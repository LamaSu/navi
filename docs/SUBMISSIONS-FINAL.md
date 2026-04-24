# Navi — Submission copy (paste-ready)

**Use this for every Devpost / event-form entry. URLs are live as of 4:25 PM PDT, 2026-04-24.**

---

## Common header (paste at top of every form)

```
Project name: Navi — PCC Enterprise-Operator Agent
Tagline: Onboard any enterprise to the Physical Capability Cloud in 5 minutes — by phone or chat.

Repo: https://github.com/LamaSu/navi
Live demo (chat): https://app.guild.ai/agents/globalmysterysnailrevolution/pcc-enterprise-onboarder
Live demo (voice): +1 (650) 448-0770  ←  judges can dial from their seat
Backend health: https://pcc-operator-backend-production.up.railway.app/health
Backend (Vapi webhook target): https://pcc-operator-backend-production.up.railway.app/vapi/webhook
```

---

## Guild.ai — $1K cash track

> Navi is a multi-turn Guild llmAgent that walks an enterprise pointman (machinist, fleet ops, lab admin) through getting their capabilities online on the Physical Capability Cloud in five minutes of conversation. The agent is published at https://app.guild.ai/agents/globalmysterysnailrevolution/pcc-enterprise-onboarder (v1.0.1, public). It runs Guild's full agent lifecycle — built, governed, shared — and pairs with a backend at https://pcc-operator-backend-production.up.railway.app that wires seven other sponsor integrations end-to-end. Custom integration via OpenAPI is staged in `packages/guild-agent/nexla.openapi.yaml` for follow-on extension. Guild's audit-trail and credential-isolation primitives are exactly what enterprise onboarding needs — we ship the use case made real.

---

## Vapi track

> Navi gets a phone number — **+1 (650) 448-0770**. Pointman dials, Vapi runs the discovery interview (Anthropic Opus 4.5 + ElevenLabs Turbo + Deepgram Nova-2). The assistant emits structured output (intent, tasks, missingInfo) which our Task Runner endpoint at `/vapi/task-runner` polls, extracts, and executes against the backend in priority order — `ONBOARD_START → CONNECT_DATA_SOURCE → INGEST_DOCS → BUILD_AGENT → LIST_OPERATOR`. Real B2B use: pointman hangs up, two minutes later the operator is live on PCC with a Postgres backend, vector index, wallet, escrow, and a cited.md profile. Assistant ID `6d147dd1-cdf0-4310-a06f-acd67996d1f0`, attached to phone `54a23043-6c89-48ab-a2b8-012747fc6516`.

---

## Redis AI Incubator track

> Navi wires three Redis modules in one agent. **RedisVL** indexes operator capability blurbs for semantic match. **Agent Memory Server** stores the meta-agent's short and long-term memory across calls (config in `.mcp.json`). **a2a-redis Streams** form the agent-to-agent bus between our meta-agent and the new enterprise agent it just deployed. Bonus: a **LangCache semantic-cache layer** wraps every Nexla pipeline call — second-time queries skip Nexla entirely. All on a 30 MB free-tier Redis Cloud instance, verified live (AUTH + PING in under 100ms).

---

## Nexla track

> The meta-agent uses real Nexla REST against an authenticated session token to build pipelines per onboarded enterprise — credential, source, dataflow, activate. Verified live with the user-provided session token; pulled an existing `/flows` listing as smoke test before wiring publish. Pattern is in `packages/backend/src/tools/nexla.ts` — `buildPipelineFromPrompt()` is the agent-facing entry. Connector list spans postgres, mysql, snowflake, sharepoint, gdrive, salesforce-via-rest. The same code drives the *generated* enterprise agent's pipeline refreshes — Nexla isn't just for onboarding, it's the data plane of every operator we deploy.

---

## InsForge track

> `POST /agents/v1/signup` is the killer endpoint. Navi wraps it (`packages/backend/src/tools/insforge.ts`) so the meta-agent calls one tool and 60 seconds later the enterprise has a live Postgres backend with auth, storage, and an OpenAI-compatible Model Gateway. We push a four-table schema (enterprises / machines / jobs / evidence) and the auto-REST is online. **InsForge plays a second role too**: its Model Gateway is the OpenAI-compatible shim our memory MCP server points at for embeddings, so we never burn an OpenAI key. One sponsor, two roles.

---

## Ghost (Tiger Data) track

> For each enterprise, Navi forks a Ghost Postgres (`ghost_fork`) so the operator's SOPs, MOPs, and equipment manuals live in a dedicated, copy-on-write Postgres with **pgvectorscale** + **pg_textsearch (BM25)**. The fork takes seconds, costs nothing extra, and gets handed to PCC's verifier when capture validation needs it. Per-capture isolation is the use case Tiger Data has been pitching at conferences; we're shipping it on stage. `share_token` flows the fork to PCC's CVP without an OAuth dance.

---

## Chainguard track

> The Navi backend ships in `cgr.dev/chainguard/node:latest` (multi-stage Dockerfile in repo root). Our pnpm workspace pulls from `libraries.cgr.dev/javascript/` via `.npmrc` — Chainguard Libraries entitlement created via `chainctl libraries entitlements create --ecosystems=JAVASCRIPT`. We installed the cgstart skill locally (`.claude/skills/chainguard-setup/`) so our build agent verifies its own dependency chain before each deploy. Zero-CVE base image + verified-source libs + AI-driven supply-chain audit on the agent itself: the meta-pitch is "we secure the agent that secures the agents."

---

## TinyFish track

> TinyFish is wrapped at `packages/backend/src/tools/tinyfish.ts` and called inside the operator-onboarding flow — when the pointman gives a website URL, our `/onboard/:id/scrape` route fires TinyFish *in parallel* with a Nexla pipeline build. TinyFish extracts capabilities from the unstructured public website; Nexla connects to whatever the enterprise has structured. Together they produce the first draft of the capability manifest. SSE streaming, JSON validation, runs on a 500-cred free tier. We also have a longer-form buyer-side cookbook recipe scaffold at `packages/pcc-capability-finder/` for a follow-up cookbook PR after the hackathon.

---

## Senso (cited.md) track

> Every onboarded operator is automatically published to **cited.md** via Senso's content engine. `packages/backend/src/tools/senso.ts` formats the operator profile as markdown (capabilities + materials + certifications + agent_url + agentic.market listing), POSTs to `https://apiv2.senso.ai/api/v1/org/content-engine/publish` with our `tgr_…` API key, and stores the returned `content_id`. The `/build-agent` route always calls this — both voice and chat paths land profiles. Live for Oakland Titanium Mills as of demo time.

---

## Coinbase / Context Engineering Challenge — meta track

> Navi takes **real action on the open web**: TinyFish scrapes the enterprise's public site, Nexla connects their structured systems, Senso publishes a discoverable operator profile to cited.md, CDP creates a real wallet on Base Sepolia, x402 middleware monetizes `/jobs` (Coinbase facilitator, 1K free tx/mo), and the operator gets listed on agentic.market for agent-to-agent discovery. **Grounded in real sources** — we never hallucinate; we scrape or ingest. **Three+ sponsor tools** — actually ten in one flow. **Monetized with agent payment rails** — x402 + agentic.market in production from minute zero. **Published to cited.md** — every onboarded operator becomes an entry. The full meta-stack of context engineering for industrial agents.

---

## What to demo if asked

1. Dial **+1 (650) 448-0770** from your phone — voice agent picks up, runs the interview.
2. Open https://app.guild.ai/agents/globalmysterysnailrevolution/pcc-enterprise-onboarder — same agent, chat interface.
3. Curl the live backend: `curl https://pcc-operator-backend-production.up.railway.app/health` → `{"ok":true}`.
4. Browse https://github.com/LamaSu/navi — full source.

---

*Final hand-off: paste sponsor-specific paragraphs into each Devpost form. Common header at top. Phone number on the slide.*
