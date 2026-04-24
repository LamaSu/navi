// Redis LangCache — semantic caching for Nexla pipeline outputs and PCC
// capability lookups. The first time the agent asks "list machines for
// Oakland Titanium" we hit Nexla; subsequent semantically-similar queries
// hit the cache by embedding similarity.
//
// Pattern: store (query_embedding, response_json) tuples; on read, k-NN
// search and reuse the response if cosine similarity ≥ threshold.

const MOCK = process.env.MOCK_REDIS !== "false";
const REDIS_URL = process.env.REDIS_URL ?? "";
const SIMILARITY_THRESHOLD = Number(process.env.LANGCACHE_THRESHOLD ?? "0.92");
const TTL_SECONDS = Number(process.env.LANGCACHE_TTL ?? "3600");

/**
 * Cache a (query → response) pair under a namespace, keyed by an embedding
 * the caller already computed (we don't embed in this wrapper to keep deps light).
 */
export async function cacheSet(input: {
  namespace: string;
  query: string;
  embedding: number[];
  response: unknown;
}): Promise<{ cached: true }> {
  if (MOCK || !REDIS_URL) return { cached: true };
  // TODO: connect via `redis` lib, use redisvl.HashIndex with vector field;
  //  HSET cache:{ns}:{hash(query)} q={query} r={json} v={embedding}
  return { cached: true };
}

/**
 * Look up the most semantically-similar prior query; return its response
 * if cosine similarity ≥ threshold, else null.
 */
export async function cacheGet(input: {
  namespace: string;
  embedding: number[];
}): Promise<{ hit: boolean; response?: unknown; similarity?: number }> {
  if (MOCK || !REDIS_URL) return { hit: false };
  // TODO: redisvl k-NN: KNN 1 over cache:{ns} by embedding, threshold-gate
  return { hit: false };
}

/**
 * Wrap any async function with semantic caching. Caller provides the
 * embedding for the input description; on hit we skip the inner call.
 */
export async function withSemanticCache<T>(input: {
  namespace: string;
  query: string;
  embedding: number[];
  produce: () => Promise<T>;
}): Promise<{ value: T; cache: "hit" | "miss" }> {
  const probe = await cacheGet({ namespace: input.namespace, embedding: input.embedding });
  if (probe.hit) return { value: probe.response as T, cache: "hit" };
  const value = await input.produce();
  await cacheSet({
    namespace: input.namespace,
    query: input.query,
    embedding: input.embedding,
    response: value
  });
  return { value, cache: "miss" };
}
