const MOCK = process.env.MOCK_REDIS !== "false";

export async function indexCapability(input: {
  session_id: string;
  capabilities: Array<{ id: string; label: string }>;
}): Promise<{ indexed: number; stream: string }> {
  if (MOCK) {
    return { indexed: input.capabilities.length, stream: `a2a:intents:${input.session_id}` };
  }
  // TODO: RedisVL index, Agent Memory Server state, a2a-redis Streams
  throw new Error("redis live wiring not implemented yet — set MOCK_REDIS=true");
}
