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

## https://docs.guild.ai/services/create-an-integration.md — 2026-04-24 — CRITICAL FOR US
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
We can wrap PCC's 130+ REST endpoints as a Guild custom integration by pointing at capability.network's OpenAPI spec. Each endpoint becomes a tool the LLM can call. Auth via API key credential.

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

## https://docs.guild.ai/cli/commands.md — 2026-04-24
### Complete command groups:
- `guild auth` — login, logout, status, token mgmt
- `guild agent` — init, templates (**LLM, AUTO_MANAGED_STATE, BLANK**), save, test, chat, publish, versions, discovery
- `guild workspace` — create, install agents, manage context versions
- `guild chat` — one-shot queries OR session resumption, `--workspace` specifier
- `guild session` — list, inspect, manage (types: chat, webhook, time, agent_test)
- `guild trigger` — webhook-based OR scheduled events
- `guild config` — workspace defaults, output format, debugging
- `guild doctor` — diagnostic
- `guild setup` — install Claude coding skills

## https://docs.guild.ai/integrations/slack.md — 2026-04-24
- OAuth 2.0 bot tokens (never expire)
- ~45 operations: messages, conversations, reactions, files, pins, reminders, users, groups, team
- Single webhook receives all events (app_mention, message, reactions, channel changes)
- Payload scrubbed of URLs/thumbnails to reduce tokens
- Use `pick()` to scope tools to what agent actually needs

## https://docs.guild.ai/integrations/github.md — 2026-04-24
- Package: `@guildai-services/guildai~github`
- GitHub App tokens auto-refreshed
- Scopes: gists, orgs, repos, branches/commits, contents, issues, PRs, checks, workflows, releases, deployments, search, users
- 10 webhook events supported
- Guild preprocesses webhook payloads (strips avatars, permalinks, deep metadata)

## https://docs.guild.ai/integrations/pipedream.md — 2026-04-24
- Pipedream integration is NOT a generic API proxy
- Only Notion + Google Docs supported through this bridge
- Does not enable arbitrary third-party API calls

## https://docs.guild.ai/platform/workspaces.md — 2026-04-24
- Workspace connects to **a GitHub repository**
- Contains: agents, sessions, triggers, context
- Context = per-workspace background info (dynamic/generated/manual)

## https://docs.guild.ai/guide/coded-agents.md — 2026-04-24
### Auto-managed state agents:
```typescript
async function run(input: Input, task: Task<Tools>): Promise<Output>
```
- `"use agent"` directive activates Babel state-machine transform
- Deterministic sequential flow
- NO `Promise.all/any/race` (use self-managed for parallel)
- Allowed imports: `@guildai/agents-sdk`, `zod`, `@guildai-services/*`

## https://docs.guild.ai/guide/self-managed-agents.md — 2026-04-24
### Self-managed state agents:
- Event-driven: `start()` + `onToolResults()` callbacks
- Explicit `task.save()` / `task.restore()` for state persistence
- Supports **parallel tool calls** (auto-managed cannot)
- Returns either `output()` (finish) or `callTools()` (continue)

## https://docs.guild.ai/guide/tasks.md — 2026-04-24
### Task runtime context available to every agent:
- Always: `task.tools`, `task.llm`, `task.env` (Docker container mgmt), `task.console`
- Conditional: `task.ui` (needs userInterfaceTools), `task.guild` (needs guildTools)
- Self-managed-only: `task.save()`, `task.restore()`
- Tool names follow `{service}_{operation}` pattern (e.g. `github_pulls_get`)
- LLM calls return `result.text`
- Docker ops: create/execute/destroy containers
- Progress updates: use present-continuous ("Creating...", "Writing...")

## https://docs.guild.ai/packages/babel-plugin.md — 2026-04-24
- `babel-plugin-agent-compiler` transforms procedural TS → resumable state machines
- Generates `step` / `get` / `set` state machine methods
- Why: agents must pause/serialize/resume across suspension points (waiting on user or LLM)
- Constraints: Promise.all cross-await fails, conditional fn assignments unsafe

## https://docs.guild.ai/packages/agents-sdk.md — 2026-04-24
### Core exports from `@guildai/agents-sdk`:
- **Agent constructors**: `llmAgent`, `agent` (for coded auto/self-managed)
- **Tool sets**: `guildTools`, `userInterfaceTools`, `consoleTools`, `noTools`
- Runtime constraint: ONLY `@guildai/agents-sdk`, `zod`, `@guildai-services/*` importable

## https://docs.guild.ai/platform/sessions.md — 2026-04-24
### Start a session:
- Web: app.guild.ai → "New session" → choose agent → message
- CLI: `guild session create --agent <name> --workspace <id>`
- States: Active / Completed / Failed
- Multi-turn: stays open until agent calls `__submit__`

## https://docs.guild.ai/guide/versions.md — 2026-04-24
### Version states: Saved → Validated → Published
- `guild agent save --message "..." --wait --publish`
- `--wait` holds until validation
- `--publish` promotes validated → production
- `--ephemeral` = temp test version, no history

## https://docs.guild.ai/platform/organizations.md — 2026-04-24
- Org = top-level: members, billing, shared credentials
- Auto-created on first sign-in (personal org)
- Settings > Members for team invites
- Credentials live at org level, shared across workspaces
- **No public pricing info** — waitlist / invite-only

## https://docs.guild.ai/platform/context.md — 2026-04-24
- Per-workspace context = background knowledge injected into every agent
- 3 layers: dynamic (date, user) / generated (repos, integrations) / manual (project overview, conventions)
- Versioned: DRAFT → PUBLISHED
- `guild workspace context edit <workspace-id>` — opens editor

## https://docs.guild.ai/guide/state.md — 2026-04-24
- Auto-managed state: `"use agent"` directive, Babel rewrites to resumable state machine. Minimal boilerplate, no Promise.all cross-await.
- Self-managed state: explicit `task.save()` / `task.restore()` — full control, supports parallelism.

## Ship to Prod (April 24, 2026) Hackathon — 2026-04-24
- Luma: https://luma.com/shiptoprod — **Guild.ai confirmed as sponsor**
- 12 sponsors: AWS, WunderGraph, Ghost/TigerData, Nexla, Redis, Akash, Tinyfish, Chainguard, Vapi, Insforge, **Guild.ai**
- $45K+ total prize pool — per-sponsor breakdown NOT publicly itemized
- $1K Guild prize — specific criteria not in public docs; likely "best integration / most creative use of the platform / shows enterprise-grade governance"
- Format: 1 day (9:30 AM start → 7 PM awards)
- Categories: agents, copilots, research assistants
- Judging: invitation-only judges

---

## SUMMARY — scout-bravo 2026-04-24

### Guild in 5 sentences
Guild.ai is a newly-funded ($44M, $300M valuation, March 2026) neutral control plane for AI agents in production, built by ex-infrastructure engineers who want agents to work like real software — typed interfaces, versioned releases, auditable execution, governed credentials. Its core offering is the **Agent SDK** (`@guildai/agents-sdk` TypeScript package) + a managed **runtime** that executes agents inside a sandbox, mediating every external HTTP call through pre-registered **integrations** and injecting credentials server-side so agent code never sees secrets. Agents come in three shapes (LLM / auto-managed state / self-managed state), get installed into **workspaces** (each tied to a GitHub repo), and ship via `guild agent save --publish` to an organization or the public **Agent Hub**. External services are accessed either via built-in integrations (GitHub, Slack, Jira, Figma, New Relic, etc.) or **custom integrations** — user-authored versioned packages that proxy HTTP to any REST API, optionally imported from an OpenAPI spec. Runtime is strictly sandboxed (only `@guildai/agents-sdk`, `zod`, and `@guildai-services/*` packages are importable; no Node built-ins, no arbitrary npm).

### Ideal hackathon entry angle for $1K prize
Build a **Guild-native Enterprise Operator Agent** that:
1. Lives inside a Guild workspace, deployed via the SDK (`llmAgent` or self-managed for parallel discovery).
2. Wraps **PCC's capability.network REST API** as a **Guild custom integration** (OpenAPI spec → auto-generated tools). This is the killer demo — showcases Guild's "neutral proxy" value prop with a real external partner who has 130+ endpoints ready.
3. Orchestrates a real workflow a Fortune-500 would pay for: e.g., "Enterprise Buyer requests capability X → agent discovers PCC providers → negotiates via x402 → escrows USDC → dispatches → settles → posts audit event to Slack / Jira." Every step goes through Guild's governed runtime → clean audit log.
4. Ships publicly to the Agent Hub (fork-able) so Guild can showcase the integration post-hackathon — maximizes judge attention and aligns with their "GitHub for agents" thesis.
5. Demo narrative leans into Guild's stated pains: governance, portability, auditability, multi-model. Judges see Guild solving real enterprise problems, not a toy.

**Why this wins:** it's the exact vision Guild raised $44M on (shared production infrastructure, neutral control plane), instantiated end-to-end. Not "we called an API" — it's a complete custom integration showing off proxy/credential/OpenAPI primitives PLUS a realistic enterprise workflow PLUS discoverable Agent Hub publish PLUS full audit trail. Every box ticked.

### Required CLI/SDK steps

```
# One-time setup
npm install -g @guildai/cli
guild auth login                                 # browser OAuth
guild workspace select                           # pick workspace (or create via web UI first; must link GitHub repo)

# Create the custom integration FIRST
# (via web UI: Settings > Integrations > Custom → import OpenAPI from capability.network)
# gives us a credentials slot for PCC API key

# Create the agent
mkdir pcc-operator && cd pcc-operator
guild agent init --name pcc-operator --template LLM
# Edit agent.ts - import llmAgent, guildTools, userInterfaceTools, + the auto-generated @guildai-services/pcc pkg
# Spread them into tools, write systemPrompt about PCC capability buying

guild agent test --ephemeral                     # iterate locally
guild agent save --message "v1 operator" --wait --publish
guild agent publish                              # push to org / Agent Hub
```

### Gotchas / unknowns
1. **Waitlist-only signup** — we need Guild early-access (`hype_code=GUILD-EARLY-ACCESS` URL suggests this hackathon IS the access code; try it, fall back to personal account).
2. **No external npm packages** in agent code. If PCC has a TS client lib we CANNOT import it — must go through custom integration proxy. Pure Zod + generated tool names only.
3. **Model is workspace-level**, not agent-level. Judges will see what the workspace is configured to use; confirm Anthropic/OpenAI pre-demo.
4. **Custom integration requires OpenAPI spec or manual endpoint definition** — PCC needs an OpenAPI at capability.network to make this turnkey. If not, we hand-define 5-10 key endpoints (discover / negotiate / escrow / dispatch / settle).
5. **Webhook payloads are pre-processed** (stripped of URLs/avatars) — if we lean on webhook triggers, verify required data survives.
6. **Agent runtime is sandboxed, deterministic** — no file I/O, no setTimeout hacks. Use `task.save/restore` or auto-managed state for persistence.
7. **Runtime constraint**: `Promise.all` won't work in auto-managed agents. Use self-managed if we need parallel PCC calls (e.g. "discover 3 providers simultaneously").
8. **$1K prize criteria not public** — assume judging on: creativity, integration depth, shipping quality, alignment with Guild's thesis (governance, neutrality, reusability, Agent Hub publish).

### Does Guild support calling external APIs (PCC, x402, InsForge, Redis)? How?
- **YES — via custom integrations** (docs.guild.ai/services/create-an-integration.md).
  - Define endpoints manually OR import OpenAPI spec.
  - REST only (GET/POST/PUT/PATCH/DELETE), API key or OAuth 2.0.
  - Runtime proxies the call server-side, injects creds, returns typed result.
  - Each endpoint becomes a tool the agent can call by name.
- **PCC (capability.network)**: Custom integration, import its OpenAPI → ~130 tools. Agent calls e.g. `pcc_capabilities_discover`, `pcc_escrow_create`, `pcc_session_settle`.
- **x402**: If PCC exposes x402 behind the same REST surface, same pattern. Otherwise a second custom integration wrapping a facilitator (Coinbase/Neynar) endpoint.
- **Insforge** (also a hackathon sponsor): Custom integration OR route via PCC. Bonus co-sponsor mention opportunity.
- **Redis**: NOT HTTP — Guild's proxy model wouldn't cover raw TCP. Would need a thin HTTPS wrapper service; or skip Redis and use Guild's own state persistence via `task.save/restore` instead.
- **Pipedream integration exists** for Notion/Google Docs but is NOT a generic API proxy — only those two services.
