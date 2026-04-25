import { createClient, type RedisClientType } from "redis";
import { emit } from "../lib/event-bus.js";

const MOCK = process.env.MOCK_REDIS !== "false";
const URL = process.env.REDIS_URL ?? "";

let client: RedisClientType | null = null;
async function getClient(): Promise<RedisClientType> {
  if (client && client.isOpen) return client;
  if (!URL) throw new Error("REDIS_URL not set");
  client = createClient({ url: URL });
  client.on("error", (e: Error) =>
    emit({ kind: "redis.client.err", sponsor: "Redis", level: "err", text: `redis client: ${e.message}` })
  );
  await client.connect();
  return client;
}

export async function indexCapability(input: {
  session_id: string;
  capabilities: Array<{ id?: string; label: string; params_schema?: Record<string, unknown> }>;
}): Promise<{ indexed: number; stream: string }> {
  const stream = `a2a:intents:${input.session_id.slice(0, 8)}`;
  emit({
    kind: "redis.index.start",
    sponsor: "Redis",
    level: "info",
    session_id: input.session_id,
    text: `RedisVL: indexing ${input.capabilities.length} capabilities · opening stream ${stream}`,
    payload: { stream, count: input.capabilities.length }
  });

  if (MOCK) {
    emit({
      kind: "redis.index.mock",
      sponsor: "Redis",
      level: "warn",
      session_id: input.session_id,
      text: `MOCK_REDIS=true · skipping real HSET + XADD`
    });
    return { indexed: input.capabilities.length, stream };
  }

  const c = await getClient();

  // Capabilities → Hash records keyed by session + capability id
  const pipeline = c.multi();
  for (const cap of input.capabilities) {
    const id = cap.id ?? cap.label.toLowerCase().replace(/\s+/g, "-");
    pipeline.hSet(`cap:${input.session_id.slice(0, 8)}:${id}`, {
      label: cap.label,
      params_schema: JSON.stringify(cap.params_schema ?? {}),
      indexed_at: String(Date.now())
    });
  }
  // Stream — open a2a bus with an "agent online" event
  pipeline.xAdd(stream, "*", {
    kind: "agent-online",
    session_id: input.session_id,
    capabilities: String(input.capabilities.length),
    ts: String(Date.now())
  });
  await pipeline.exec();

  emit({
    kind: "redis.index.done",
    sponsor: "Redis",
    level: "ok",
    session_id: input.session_id,
    text: `${input.capabilities.length} capabilities HSET · stream ${stream} XADD agent-online`,
    payload: { stream, written: input.capabilities.length, keys_prefix: `cap:${input.session_id.slice(0, 8)}:*` }
  });
  return { indexed: input.capabilities.length, stream };
}

/** Push an a2a intent onto the operator's stream. Used by /op send-test-job. */
export async function publishIntent(session_id: string, intent: Record<string, unknown>): Promise<{ stream: string; id: string }> {
  if (MOCK) return { stream: `a2a:intents:${session_id.slice(0, 8)}`, id: "mock-id" };
  const c = await getClient();
  const stream = `a2a:intents:${session_id.slice(0, 8)}`;
  const fields: Record<string, string> = { ts: String(Date.now()) };
  for (const [k, v] of Object.entries(intent)) fields[k] = typeof v === "string" ? v : JSON.stringify(v);
  const id = await c.xAdd(stream, "*", fields);
  emit({ kind: "redis.intent.publish", sponsor: "Redis", level: "ok", session_id, text: `XADD ${stream} ${id}`, payload: { stream, id, intent } });
  return { stream, id };
}
