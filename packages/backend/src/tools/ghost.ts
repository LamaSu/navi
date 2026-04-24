const MOCK = process.env.MOCK_GHOST !== "false";

export async function forkGhost(input: {
  session_id: string;
  docs: string[];
}): Promise<{ fork_db_url: string; share_token: string; indexed_docs: number }> {
  if (MOCK) {
    return {
      fork_db_url: `postgresql://mock-ghost-fork-${input.session_id.slice(0, 6)}`,
      share_token: "mock-share-token",
      indexed_docs: input.docs.length
    };
  }
  // TODO: ghost_fork MCP tool call via ghost CLI or REST
  // Then ingest docs with pg_textsearch (BM25) + pgvectorscale (vector)
  throw new Error("ghost live wiring not implemented yet — set MOCK_GHOST=true");
}
