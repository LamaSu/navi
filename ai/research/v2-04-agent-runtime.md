# v2-04 — Agent Runtime: Replace Guild Lock-In

**Author**: scout-delta
**Date**: 2026-04-24
**Context**: Guild ($1K hackathon prize sponsor) ships closed beta + opaque pricing + `@guildai/agents-sdk` lock-in. Pick replacement.

---

## TL;DR

Use **@anthropic-ai/sdk directly** with a thin tool-loop wrapper. Extend **@pcc/agent-runtime** so the loop lives next to the existing wallet/A2A/tool-registry plumbing. Do NOT pull in LangGraph/AutoGen/CrewAI — they're either Python-first or solve a problem we don't have (multi-agent graph orchestration). Keep optionality to switch to **Vercel AI SDK v6** (TS-native, MCP-first, has `ToolLoopAgent`) if we ever want streaming React server components for free.

---

## 1. Anthropic SDK direct — the actual pattern

The raw `@anthropic-ai/sdk` tool-use loop is well under 80 lines. Anthropic's docs publish the contract: when `stop_reason === "tool_use"`, iterate `response.content` for `tool_use` blocks, run them, append a user message containing matching `tool_result` blocks, loop until `stop_reason !== "tool_use"`.

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface ToolDef {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required: string[] };
  execute: (input: any) => Promise<any>;
}

export async function runAgent(opts: {
  model: string;                 // "claude-opus-4-7"
  system: string;
  userPrompt: string;
  tools: ToolDef[];
  maxIterations?: number;        // default 10
  onStep?: (step: { iteration: number; stop_reason: string; toolCalls: any[] }) => void;
}): Promise<{ text: string; iterations: number; toolCalls: number }> {
  const tools = opts.tools.map(({ execute, ...t }) => t);
  const toolMap = new Map(opts.tools.map(t => [t.name, t]));
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: opts.userPrompt }
  ];

  let toolCalls = 0;
  for (let i = 0; i < (opts.maxIterations ?? 10); i++) {
    const resp = await client.messages.create({
      model: opts.model,
      max_tokens: 4096,
      system: opts.system,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: resp.content });

    if (resp.stop_reason !== "tool_use") {
      const text = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map(b => b.text).join("\n");
      return { text, iterations: i + 1, toolCalls };
    }

    const toolUses = resp.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    opts.onStep?.({ iteration: i, stop_reason: resp.stop_reason, toolCalls: toolUses });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const tool = toolMap.get(tu.name);
      try {
        const out = tool ? await tool.execute(tu.input) : { error: `unknown tool ${tu.name}` };
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify(out),
        });
        toolCalls++;
      } catch (err: any) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify({ error: err.message }),
          is_error: true,
        });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }
  throw new Error(`agent exceeded maxIterations=${opts.maxIterations ?? 10}`);
}
```

**Streaming**: swap `client.messages.create(...)` for `client.messages.stream(...)`, listen for `text`/`contentBlock` events, accumulate, then process tool calls when stream ends. ~15 extra lines.

**Structured output**: define a tool with the desired schema and use `tool_choice: { type: "tool", name: "return_result" }` to force Claude to call it. Schema is enforced via `strict: true` on the tool def.

**MCP support — built into the SDK**: `@anthropic-ai/sdk/helpers/beta/mcp` exposes `mcpTools()`, `mcpMessages()`, `mcpResourceToContent()`, and a `BetaToolRunner` class that does the loop above for you with native MCP server handling. So we get MCP for free without writing the runner.

**Lock-in**: Zero. The Messages API shape (system + messages + tools + tool_use/tool_result) is also implemented by AWS Bedrock, GCP Vertex, and trivially convertable to OpenAI's chat completions schema. PCC already runs on AWS Bedrock for some workloads — same SDK, different transport.

---

## 2. Anthropic Managed Agents (April 8, 2026 GA-beta)

**Status**: Public beta as of April 8, 2026. Header `managed-agents-2026-04-01`. Each agent runs in a gVisor-isolated container with default-deny egress (allowlist domains). $0.08 / agent-runtime-hour + Claude tokens. Notion, Rakuten, Asana on it.

**Why it's tempting**: removes ops burden — sandboxing, session state, credential vault, retry, persistence. Built-in MCP. Backed by the same engineering team as Claude Code.

**Why we should NOT use it for shiptoprod**:
- It's hosted-only. Locks the agent runtime to `api.anthropic.com`. Same lock-in shape as Guild, just from a different vendor.
- $0.08/hour adds up for long-running operator agents (PCC kernels could run 24/7).
- We already have @pcc/agent-runtime + wallet + A2A. Most of what Managed Agents does is solved here.
- Beta — schema can change.

**When to revisit**: if PCC ever needs sandboxed third-party agent hosting (operator-uploaded agents running someone else's code), Managed Agents is a cleaner buy than building gVisor ourselves.

---

## 3. Other runtimes (decision matrix)

| Runtime | License | Stars | Lang | MCP | A2A | Lock-in | LOC for our use case | Verdict |
|---|---|---|---|---|---|---|---|---|
| **@anthropic-ai/sdk + custom loop** | MIT | 4k | TS | beta helper | via @pcc/a2a | none | ~80 | **PICK** |
| Vercel AI SDK v6 | Apache-2 | 16k | TS | native | bridgeable | low (provider-pluggable) | ~30 (`ToolLoopAgent`) | strong fallback |
| Mastra | MIT | 22k | TS | native | partial | low | ~50 | overkill, Gatsby-team framework |
| OpenAI Agents JS | MIT | 4k | TS | hosted+local | via shim | medium (OpenAI bias) | ~40 | only if OpenAI-first |
| LangGraph | MIT | 24k | Py/TS (TS lags) | via adapter | native v1.10+ | medium | ~150 | TS SDK lags, Python-first |
| Microsoft Agent Framework | MIT | 28k | .NET/Py | native | native | medium | n/a (no JS) | wrong stack |
| AutoGen | MIT | 36k | Py | community only | community | high (maintenance mode) | n/a | dead, replaced by MS Agent Framework |
| CrewAI | MIT | 46k | Py | native v1.10 | native v1.10 | medium | n/a (no JS) | wrong stack |
| Anthropic Managed Agents | proprietary | n/a | TS/Py | native | n/a | **HIGH** (hosted) | ~10 | revisit only for sandbox |
| Claude Agent SDK V2 | MIT | n/a | TS | native | n/a | medium (bundles Claude Code binary) | ~10 | wrong abstraction (file-system agent, not API agent) |
| Guild | proprietary | n/a | TS | unknown | unknown | **HIGH** | n/a | replace |

**TS-native + MCP-native + low-lock-in shortlist**: raw SDK, Vercel AI SDK v6, Mastra. Of those, raw SDK has the smallest surface area and zero new deps — PCC already imports `@anthropic-ai/sdk` (search the monorepo).

---

## 4. PCC's existing agent layer

`@pcc/agent-runtime/src/base-agent.ts` (262 lines) already provides:

- `BaseAgent` abstract class — identity (`AgentCard`), wallet (signing/paying via EVM + Solana), MessageBus subscribe/publish, signed A2A messages, intent handler registry, **tool registry with `getToolDefinitions()` that already returns Anthropic-format schema**.
- Subclasses: `BrokerAgent` (discovers hubs, quotes jobs, settles), `KernelAgent` (per-shop, accepts work, emits evidence), `NanoclawAgent`.

The piece NOT in @pcc/agent-runtime today: **the LLM tool-use loop itself**. `BaseAgent.executeTool()` exists but no class drives "ask LLM, run tool, repeat." That's what Guild was bolted on for.

The natural extension is a `LLMAgent extends BaseAgent` that wires the runner from §1 against `this.tools` and `this.bus`. Tool calls become A2A messages or local invocations depending on the tool's `execute` impl.

---

## 5. Architectural recommendation: where does @pcc/agent-onboarder live?

Three options from the prompt:
- (a) Inside @pcc/agent-runtime (extend)
- (b) Standalone process that calls PCC via A2A
- (c) Both — thin wrapper + heavy lifting in @pcc/agent-runtime

### Recommendation: (c) but skewed heavily toward (a)

**Concrete shape**:

1. **Inside @pcc/agent-runtime** — add a single new file `src/llm-agent.ts` (~120 lines) implementing `LLMAgent extends BaseAgent`. It owns the tool-loop, accepts a `model` config, reuses `getToolDefinitions()`, and routes every tool call through `BaseAgent.executeTool()`. This is the heavy lifting — wallet, A2A, content scanning, signing all come for free from the parent class.

2. **@pcc/agent-onboarder** — a thin standalone package (~80 lines + tests) that:
   - Imports `LLMAgent` from `@pcc/agent-runtime`.
   - Registers ~10 onboarding-specific tools (provision-key, generate-config, register-kernel, register-device, run-test-job, prove).
   - Each tool is a tiny wrapper around an existing PCC HTTP route or A2A intent.
   - Ships its own `npx @pcc/agent-onboarder` binary so an operator can run `npx @pcc/agent-onboarder` and get walked through.
   - Runs as its own process so it can be deployed independently of the gateway and so its restart cycle doesn't perturb other agents.

**Why (c) over pure (a)**: separating the onboarder process keeps the runtime package free of onboarding-specific state and lets us version + deploy + npm-publish the onboarder on its own cadence. New operators install just the onboarder, not the whole monorepo.

**Why heavily toward (a)**: the alternative — onboarder calling PCC over A2A only — would require duplicating the LLM loop, the wallet, and the message-signing inside the standalone package, which is exactly the lock-in trap Guild forced on us. Letting the onboarder import `@pcc/agent-runtime` keeps one canonical loop.

**Why NOT pure (b)**: A2A-only would mean the onboarder sends an "onboard me" intent to a remote PCC agent and waits for follow-ups. That works for the simple case but breaks when the onboarder needs to mutate local files (env vars, config), execute local CLI commands (octoprint reachability), or stream camera frames. The onboarder fundamentally needs **local execution** + remote intents, which is exactly what `LLMAgent extends BaseAgent` provides — local tool execution and bus-aware A2A in one object.

---

## 6. Migration plan

1. Add `src/llm-agent.ts` to @pcc/agent-runtime — implement the §1 loop on top of `BaseAgent`. ~2 hours.
2. Add `provider` config — accept `{ provider: "anthropic" | "bedrock" | "openai-compatible", model: string }`. Default Anthropic. ~30 min.
3. Smoke-test with a single tool (`pcc_get_kernel`) and one prompt. ~30 min.
4. Stub `@pcc/agent-onboarder` package, register the 10 onboarding tools, publish CLI bin. ~3 hours.
5. Delete `@guildai/agents-sdk` import + the Guild-specific glue. Verify tests pass. ~30 min.
6. Add `optional: vercel-ai-sdk` adapter as a future escape hatch. Not blocking. ~2 hours later.

**Total**: ~half-day to replace Guild end-to-end.

---

## Sources

- [Anthropic — Tool use docs](https://platform.claude.com/docs/en/build-with-claude/tool-use)
- [Anthropic — Claude Agent SDK V2 (TS preview)](https://code.claude.com/docs/en/agent-sdk/typescript-v2-preview)
- [Anthropic — Managed Agents launch (April 8, 2026)](https://www.anthropic.com/engineering/managed-agents)
- [InfoQ — Anthropic Managed Agents announcement](https://www.infoq.com/news/2026/04/anthropic-managed-agents/)
- [Anthropic SDK TypeScript GitHub](https://github.com/anthropics/anthropic-sdk-typescript)
- [DeepWiki — @anthropic-ai/sdk beta features (MCP helpers)](https://deepwiki.com/anthropics/anthropic-sdk-typescript/4-beta-features)
- [Vercel AI SDK 6 launch](https://vercel.com/blog/ai-sdk-6)
- [Mastra docs](https://mastra.ai/docs)
- [Mastra GitHub](https://github.com/mastra-ai/mastra)
- [LangGraph + MCP guide](https://generect.com/blog/langgraph-mcp/)
- [@openai/agents npm](https://www.npmjs.com/package/@openai/agents)
- [Microsoft Agent Framework 1.0 (MCP+A2A)](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/)
- [microsoft/autogen GitHub](https://github.com/microsoft/autogen)
- [CrewAI — frameworks comparison 2026](https://www.channel.tel/blog/ai-agent-frameworks-compared-2026-what-ships)
- [Google A2A Protocol spec](https://a2a-protocol.org/latest/specification/)
- [a2aproject/A2A GitHub](https://github.com/a2aproject/A2A)
