// @shiptoprod/backend — public exports.
//
// Server entry: ./server.ts (kept as the dist entrypoint via package.json#main).
// This file is the import surface for sister packages who want to embed pieces.

export {
  LLMAgent,
  runAgent,
  type ToolDef,
  type ToolCaller,
  type LLMAgentOptions,
  type ChatOptions,
  type ChatResult,
} from "./llm-agent.js";
