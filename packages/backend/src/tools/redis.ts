import { emit } from "../lib/event-bus.js";
const MOCK = process.env.MOCK_REDIS !== "false";

export async function indexCapability(input: {
  session_id: string;
  capabilities: Array<{ id: string; label: string }>;
}): Promise<{ indexed: number; stream: string }> {
  const stream = `a2a:intents:${input.session_id.slice(0,8)}`;
  emit({ kind: "redis.index.start", sponsor: "Redis", level: "info", session_id: input.session_id, text: `RedisVL: indexing ${input.capabilities.length} capabilities · opening stream ${stream}`, payload: { stream, count: input.capabilities.length } });
  if (MOCK) {
    emit({ kind: "redis.index.mock", sponsor: "Redis", level: "warn", session_id: input.session_id, text: `MOCK_REDIS=true · skipping real RedisVL HSET + XADD` });
    return { indexed: input.capabilities.length, stream };
  }
  // TODO: RedisVL index, Agent Memory Server state, a2a-redis Streams
  throw new Error("redis live wiring not implemented yet — set MOCK_REDIS=true");
}
