import { emit } from "../lib/event-bus.js";
const MOCK = process.env.MOCK_GHOST !== "false";

export async function forkGhost(input: {
  session_id: string;
  docs: string[];
}): Promise<{ fork_db_url: string; share_token: string; indexed_docs: number }> {
  emit({ kind: "ghost.fork.start", sponsor: "Ghost (Tiger Data)", level: "info", session_id: input.session_id, text: `ghost_fork → indexing ${input.docs.length} doc(s) (pgvectorscale + pg_textsearch BM25)`, payload: { doc_count: input.docs.length, doc_urls: input.docs } });
  if (MOCK) {
    const r = {
      fork_db_url: `postgresql://mock-ghost-fork-${input.session_id.slice(0, 6)}`,
      share_token: "mock-share-token",
      indexed_docs: input.docs.length
    };
    emit({ kind: "ghost.fork.mock", sponsor: "Ghost (Tiger Data)", level: "warn", session_id: input.session_id, text: `MOCK_GHOST=true · returning fake fork ${r.fork_db_url}`, payload: r });
    return r;
  }
  // TODO: ghost_fork MCP tool call via ghost CLI or REST
  // Then ingest docs with pg_textsearch (BM25) + pgvectorscale (vector)
  throw new Error("ghost live wiring not implemented yet — set MOCK_GHOST=true");
}
