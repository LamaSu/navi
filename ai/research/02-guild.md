# Guild AI Research — scout-bravo
Fri, Apr 24, 2026  1:34:01 PM

## https://docs.guild.ai/ — 2026-04-24
**Title:** Introduction — "The control plane for AI agents"

**Core Concepts:**
- **Workspaces**: Container for agents, triggers, context, and credential policies
- **Agents**: Programs from simple scripted → autonomous LLM-driven workflows; accept input, use tools/LLMs, generate output
- **Sessions**: Log of an agent's run (input → execution → optional user interaction → output)

**Architecture Flow:**
Browser/CLI → guildcore (API) → runtime (agent executor) → Agent
Database backs the API layer
Agent execution: code loading, lifecycle management, tool invocation, sub-agent calls, LLM interactions, user questioning

**Referenced sub-pages:**
- /quickstart
- /cli/getting-started
- /guide/sdk-introduction
- /llms.txt (doc index)

## https://www.guild.ai/ — 2026-04-24
**Value Prop:** "Deploy safely. Govern centrally. Share trusted capabilities through the Managed Agent Center and Agent Hub."

**Key Features:**
- Governed Runtime (secure execution, centralized permission enforcement)
- Model Neutrality (Anthropic, OpenAI, Google, open-source)
- Full Execution Traceability (immutable audit logs for compliance)
- Managed Agent Lifecycle (versioned, reusable, rollback)
- Enterprise Identity (SSO/SAML + RBAC)
- Agent Hub (public marketplace)

**Target Audience:**
1. Enterprise buyers (AI governance, compliance — "AI, trusted in production")
2. Developers (production systems — "AI, built like real software")

**Pricing:** Waitlist only — pre-launch / invitation-only

## Funding & Market Context — 2026-04-24
- Raised $44M seed + Series A as of March 2026 (Khosla)
- Valued at $300M
- Platform emphasis: turn agents into shared production infrastructure


## https://docs.guild.ai/quickstart — 2026-04-24
**Auth flow:**
```bash
npm install -g @guildai/cli
guild auth login   # opens browser
guild auth status
```

**Create agent:**
```bash
mkdir hello-agent && cd hello-agent
guild agent init --name hello-agent --template LLM
```

**agent.ts example:**
```typescript
import { llmAgent, guildTools } from "@guildai/agents-sdk"

export default llmAgent({
  description: "A friendly greeting agent",
  tools: { ...guildTools },
  systemPrompt: `You are a friendly assistant.`,
  mode: "multi-turn",
})
```

**Test + ship:**
```bash
guild agent test --ephemeral
guild agent save --message "First version" --wait --publish
```

## https://docs.guild.ai/cli/getting-started — 2026-04-24
### All CLI subcommands:
- **Auth**: `auth login`, `auth logout`, `auth status`
- **Workspace**: `workspace select`
- **Agent lifecycle**:
  - `agent init [--name --template LLM]`
  - `agent init --fork owner/name`
  - `agent clone owner/name`
  - `agent pull`
  - `agent save [--message --wait --publish --ephemeral]`
  - `agent test [--ephemeral]`
  - `agent chat "msg"`
  - `agent publish / unpublish`
  - `agent revalidate`
  - `agent get [<id>]`
  - `agent versions [--limit N]`
  - `agent code`
- **Setup/Diag**: `guild setup` (installs Claude coding skills), `guild doctor`
- **Env**: `GUILD_WORKSPACE_ID` overrides default workspace

## https://docs.guild.ai/guide/sdk-introduction — 2026-04-24
**Package**: `@guildai/agents-sdk` (types, utilities, tool sets, platform service interfaces)

### Three Agent Types:
1. **LLM agents** — LLM follows system prompt + uses tools. Simplest.
2. **Auto-managed state agents** — TypeScript function that runs to completion. Deterministic.
3. **Self-managed state agents** — Event-driven, parallel tool calls, fine-grained state.

### Required schema fields:
- `description` (when to invoke)
- `inputSchema` (Zod)
- `outputSchema` (Zod)
- `tools` (optional)

### Critical Runtime Constraints:
- **Only `@guildai/agents-sdk` and `zod` imports allowed**
- **NO external npm packages**
- **NO Node.js built-ins**
→ All external capability goes through `guildTools` or platform services

## Knowledge Base Articles (key ones) — 2026-04-24
- "Guild.ai Raises Series A" (Mar 3, 2026)
- "Introducing Guild.ai" (Nov 19, 2025)
- "AI Agent Observability: Why You Can't Run What You Can't See"
- "How to Manage AI Agents at Scale"
- "Why AI Agents Need Their Own GitHub: The Case for Agent Infrastructure"
- "The AI Agent Portability Problem"


## https://docs.guild.ai/llms.txt (master index) — 2026-04-24
**All doc pages:**
- Commands: /cli/commands.md
- CLI reference: /cli/getting-started.md
- Guild CLI: /cli/introduction.md
- Auto-managed agents: /guide/coded-agents.md
- LLM agents: /guide/llm-agents.md
- LLMs: /guide/llms.md
- Agent SDK: /guide/sdk-introduction.md
- Self-managed agents: /guide/self-managed-agents.md
- State: /guide/state.md
- Tasks: /guide/tasks.md
- Versions: /guide/versions.md
- Integrations (per-service): /integrations/{azure-devops, bitbucket, confluence, cypress, figma, github, jira, newrelic, pipedream, slack, testrail}.md
- @guildai/agents-sdk: /packages/agents-sdk.md
- babel-plugin-agent-compiler: /packages/babel-plugin.md
- Platform: /platform/{agents, context, credentials, integrations, organizations, sessions, triggers, workspaces}.md
- Quickstart: /quickstart.md
- Task object: /sdk/task-object.md
- Tool sets: /sdk/tools.md
- **Create an Integration (CRITICAL)**: /services/create-an-integration.md

## https://docs.guild.ai/sdk/tools.md — 2026-04-24
### Pre-built tool sets:
- **guildTools** — 55 tools, format `guild_{endpoint}`, maps to GuildService methods (workspace/agent/credential/API access)
- **userInterfaceTools** — 3 tools:
  - `ui_prompt` (suspending user question hook)
  - `ui_notify` (notifications/status)
  - `ui_ping` (health checks)
- **consoleTools** — 1 tool: `console_log`
- **noTools** — empty

### Service integration packages (separate npm):
`@guildai-services/*` — github, slack, jira, bitbucket, azure-devops, confluence, figma, cypress, newrelic, testrail

### Tool composition:
```typescript
const tools = {
  ...guildTools,
  ...userInterfaceTools,
};
// pick() and omit() utilities to reduce tokens
```

## https://docs.guild.ai/sdk/task-object.md — 2026-04-24
### Task object API:
| Service | Requirement |
|---------|------------|
| `task.console` | Always available |
| `task.llm` | Always available (model chosen at workspace level) |
| `task.ui` | Requires userInterfaceTools |
| `task.guild` | Requires guildTools |

### Key methods:
- `task.guild.credentials_request()` — prompts user to authorize third-party service
- `task.guild.experimental_fetch()` — **sync HTTP call**
- `task.guild.experimental_fetch_async()` — **async HTTP (result via hook)**
- `task.llm.generateText({ prompt, schema? })` — LLM call with optional Zod structured output
- `task.ui.notify(...)` — fire-and-forget
- `task.ui.prompt({ type: "text", text })` — block until user input
- `task.ui.ping({ message })` — health check

## https://docs.guild.ai/services/create-an-integration.md — 2026-04-24 ⚡ CRITICAL FOR US
**YES — Guild agents can call ARBITRARY external APIs via custom integrations.**

> "A custom integration is a versioned package that tells the Guild runtime how to proxy HTTP requests to your service on behalf of agents."

### Architecture:
Agent → Guild runtime → Integration proxy → YOUR service API

### Capabilities:
- REST HTTP (GET/POST/PUT/PATCH/DELETE)
- Auth: API key OR OAuth 2.0 — runtime injects credentials (agent never sees raw tokens)
- Define endpoints manually OR import from **OpenAPI spec**
- Can copy endpoints from previous versions

### You define per-endpoint:
- Operation name (becomes tool name LLM sees)
- HTTP method + path
- Request/response schemas

### Constraints:
- Must be HTTP-accessible
- Must define explicit schemas upfront (no dynamic HTTP)
- Webhooks need pre-configuration

### → PCC INTEGRATION STRATEGY:
We can wrap PCC's 130+ REST endpoints as a Guild custom integration by pointing at `capability.network`'s OpenAPI spec. Each endpoint becomes a tool the LLM can call. Auth via API key credential.

## https://docs.guild.ai/platform/credentials.md — 2026-04-24
- **OAuth-based**: GitHub, Slack, Jira, Bitbucket, Azure DevOps, Confluence, Figma
- **API-key-based**: New Relic, Cypress, TestRail
- Agents invoke service tools (e.g. `github_issues_get`) and runtime auto-injects org credentials
- `guild_credentials_request` — prompts user if credential missing
- Custom integration credentials = configured at org level, same pattern

## https://docs.guild.ai/platform/triggers.md — 2026-04-24
### Webhook services:
Slack (`app_mention`, `message`), GitHub (`pull_request`, `issues`, `push`), Linear, Jira, Bitbucket, Azure DevOps, Google Docs, Notion

### Schedule frequencies:
HOURLY / DAILY / WEEKLY / MONTHLY — UI or CLI configurable
Example: daily at 09:00, weekly Monday 09:00

### Invocation: agent receives event payload as input

## https://docs.guild.ai/guide/llms.md — 2026-04-24
**Model config at WORKSPACE level (not agent code)** — provider/model chosen externally
```typescript
const result = await task.llm.generateText({ prompt: "..." })
// with Zod schema:
const result = await task.llm.generateText({
  prompt: "Extract...",
  schema: z.object({ severity: z.enum(["low","medium","high"]), ... })
})
```

## https://docs.guild.ai/guide/llm-agents.md — 2026-04-24
- `llmAgent` pairs system prompt + tool set
- Fixed I/O: text in, text out
- Modes: **one-shot** vs **multi-turn** (ends on `__submit__` tool call)
- Not ideal when you need deterministic behavior or minimum token cost (use coded agents then)

