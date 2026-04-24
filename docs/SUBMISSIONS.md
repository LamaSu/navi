# Submissions — one paragraph per track

**Event:** Ship to Prod AI Hackathon · 2026-04-24 · SF
**Submit by:** 4:30 PM PDT

Common header for every form:

```
Project: PCC Enterprise-Operator Agent
Tagline: A meta-agent that onboards any enterprise to the Physical Capability
         Cloud in 5 minutes — by phone or chat.
Repo: https://github.com/<you>/shiptoprod-agent
Live demo: https://<deploy-host>/
Guild Agent: https://app.guild.ai/agents/<id>
Voice (Vapi): +1-XXX-XXX-XXXX (phoneNumberId 54a23043-…)
agentic.market listing: https://api.agentic.market/v1/services/<id>
cited.md: https://cited.md/c/<id>
Team: <names + Discord handles>
```

---

## Guild.ai — $1K cash track

Our PCC Enterprise-Operator Onboarder is a Guild llmAgent (`packages/guild-agent/agent.ts`) that wraps our backend's full OpenAPI as a custom integration. Every external call is mediated by Guild's runtime — credentials injected server-side, audit trail per tool. The agent walks an enterprise pointman (machinist, fleet ops, lab admin) through six steps in a multi-turn conversation: identify, data-connect, doc-ingest, interview, build, hand-off. At the end the enterprise has a fully-deployed PCC agent, an InsForge backend, a CDP wallet on Base Sepolia, an x402-gated `/jobs` endpoint, an agentic.market listing, and a cited.md profile. Built, governed, shared — Guild's exact lifecycle pitch, made real for industrial onboarding.

## Redis AI Incubator track

Three Redis modules wired in one agent. **RedisVL** indexes operator capability blurbs for semantic match. **Agent Memory Server (MCP)** stores the meta-agent's short and long-term memory across calls (config in `.mcp.json` — `uvx --from agent-memory-server agent-memory mcp`). **a2a-redis Streams** form the agent-to-agent bus between our meta-agent and the new enterprise agent it just deployed. Bonus: a **LangCache semantic-cache layer** (`packages/backend/src/tools/redis-cache.ts`) wraps our Nexla pipeline calls — second time the agent asks "list machines for Oakland Titanium" we hit the cache, saving Nexla credits. All on a 30 MB free-tier Redis Cloud instance.

## Nexla track

The meta-agent uses natural-language prompting against Nexla to build real data pipelines — when the pointman says "we have a CMMS at example.com," our backend creates a credential, source, and dataflow into the enterprise's InsForge Postgres in three API calls. Verified live with the user-provided Nexla session token; pulled an existing `/flows` listing as a smoke test before wiring the publish path. Pattern is in `packages/backend/src/tools/nexla.ts` — `buildPipelineFromPrompt()` is the agent-facing entry point. Connector list spans postgres, mysql, snowflake, sharepoint, gdrive, salesforce-via-rest. We don't pretend to be Express.dev — we drive Nexla REST directly from the meta-agent's tool-call interface.

## InsForge track

`POST /agents/v1/signup` is the killer endpoint. Our backend wraps it (`packages/backend/src/tools/insforge.ts`) so the meta-agent calls one tool and 60 seconds later the enterprise has a live Postgres backend with auth, storage, and an OpenAI-compatible Model Gateway. We then push a four-table schema (enterprises / machines / jobs / evidence) and the auto-REST is online. Zero-OAuth onboarding for the operator — they get a `claimUrl` if they later want admin access, but day-zero the agent owns the project. Demonstrates InsForge's agent-native pitch end-to-end.

## Ghost (Tiger Data) track

For each enterprise we onboard, our backend forks a Ghost Postgres (`ghost_fork`) so the operator's SOPs, MOPs, and equipment manuals live in a dedicated, copy-on-write Postgres with **pgvectorscale** + **pg_textsearch (BM25)**. The fork takes seconds, costs nothing extra, and gets handed to PCC's verifier when capture validation needs it. Per-capture isolation is the use case Tiger Data has been pitching at conferences; we're shipping it. `share_token` flows the fork to PCC's CVP without an OAuth dance.

## Chainguard track

Our backend ships in `cgr.dev/chainguard/node:latest` (multi-stage Dockerfile in repo root). Our pnpm workspace pulls from `libraries.cgr.dev/javascript/` via `.npmrc` — Chainguard Libraries entitlement created via `chainctl libraries entitlements create --ecosystems=JAVASCRIPT`. We installed the **cgstart skill** locally so our build agent verifies its own dependency chain before each deploy. Zero-CVE base image + verified-source libs + AI-driven supply-chain audit on the agent itself: the meta-pitch is "we secure the agent that secures the agents."

## Vapi track

The meta-agent gets a phone number. Pointman dials, Vapi runs the discovery interview (assistant config at `apps/voice/assistant.json`, prompt at `apps/voice/TASK-RUNNER-PROMPT.md`). The Vapi assistant emits structured output (`intent`, `tasks[]`, `missingInfo`). Our **Task Runner** endpoint (`POST /vapi/task-runner` in `packages/backend/src/onboard/task-runner.ts`) polls the Vapi REST API on `phoneNumberId=54a23043-6c89-48ab-a2b8-012747fc6516`, extracts the latest ended call's structured payload, and executes the task list against our backend in priority order — `ONBOARD_START → CONNECT_DATA_SOURCE → INGEST_DOCS → BUILD_AGENT → LIST_OPERATOR → LOCK_ESCROW → FIRE_FIRST_TASK → FOLLOW_UP`. Real B2B use: pointman hangs up, two minutes later the operator is live on PCC.

## TinyFish track (light)

TinyFish is wrapped at `packages/backend/src/tools/tinyfish.ts` and called inside the operator-onboarding flow — when the pointman gives us a website URL, our `/onboard/:id/scrape` route fires TinyFish *in parallel* with a Nexla pipeline build. TinyFish extracts capabilities from the unstructured public website; Nexla connects to whatever the enterprise has structured. Together they produce the first draft of the capability manifest. SSE streaming, JSON validation, runs on a 500-cred free tier. We also have a longer-form buyer-side cookbook recipe scaffold at `packages/pcc-capability-finder/` for a follow-up PR after the hackathon.

## Context Engineering Challenge — meta track

The meta-agent **takes real action on the open web**: scrapes the enterprise's public site (TinyFish), connects their structured systems (Nexla), publishes a discoverable operator profile to cited.md (Senso), creates a real wallet on Base Sepolia (CDP), monetizes its endpoints with x402 middleware on `/jobs` (Coinbase facilitator, 1K free tx/mo), and lists itself on agentic.market for agent-to-agent discovery. **Grounded in real sources** — we never hallucinate machines or hours; we scrape or ingest. **Three+ sponsor tools** — actually eight in one flow. **Monetized with agent payment rails** — x402 + agentic.market in production from minute zero. **Published to cited.md** — every onboarded operator becomes an entry. The meta-agent is the answer to "what does context engineering look like in 2026."
