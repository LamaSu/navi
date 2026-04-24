# Integration Tasks — Ship to Prod Hackathon Team Hand-off

**Date:** 2026-04-24 · Ship to Prod AI Hackathon
**Submission:** 4:30 PM PDT · Demo: 5:00 PM · **~2h 45m remaining**
**Repo:** `C:\Users\globa\shiptoprod-agent\`
**Plan:** `docs/PLAN-V3.md` (rescoped to **meta-agent that builds enterprise-specific PCC agents**)

**Rescope (2026-04-24 user messages):**
> (supply side) We're building an agent that helps an enterprise build **their own** PCC agent — discovers their databases, SOPs, MOPs, APIs, capabilities, parameters, availability, then generates + deploys the enterprise-specific agent that talks to PCC via a2a + x402. This meta-agent is **hosted on Guild**.
>
> (demand side) TinyFish hosts a **user agent** that buyers use to find PCC capabilities — not for operators. The Guild-hosted meta-agent handles supply side (enterprises onboarding); the TinyFish cookbook recipe handles demand side (buyers searching).

Every task below is a discrete slice. Owner + files + verify steps + deps + ETA.

---

## A. BACKEND CORE — Express + tool wrappers (`packages/backend`)

### A1. Scaffold Express service
- **Files:** `packages/backend/{package.json, tsconfig.json, src/server.ts}`
- **Deps:** `express`, `zod`, `dotenv`, `cors`, `pino`
- **Endpoints (stubs first):**
  - `POST /onboard/start` — begin discovery, returns session_id
  - `POST /onboard/:id/scrape` — trigger TinyFish scrape
  - `POST /onboard/:id/ingest-docs` — upload SOPs/MOPs to Ghost
  - `POST /onboard/:id/interview-turn` — chat turn with discovery LLM
  - `POST /onboard/:id/build-agent` — generate enterprise agent
  - `GET  /onboard/:id/status` — state machine status
  - `POST /jobs` — x402-gated job endpoint (for demo earnings)
- **Verify:** `curl localhost:3000/onboard/start` returns 201 with session_id
- **ETA:** 25 min

### A2. Nexla wrapper (`packages/backend/src/tools/nexla.ts`) — DATA INTEGRATION LAYER
- **Rationale:** rescoped to meta-agent. Nexla's 550+ connectors (ERP, CMMS, SharePoint, Salesforce, Snowflake, S3, PDFs, emails) + MCP server fit "connect enterprise data to PCC."
- **Credentials:** `NEXLA_API_KEY` (15-day free trial: 5 sources, 1M records/day)
- **Libs:** `pip install nexla-sdk` OR REST via `fetch`
- **Use for:**
  - Create data sources per enterprise (their ERP, CMMS, SharePoint, CSV inventory)
  - Create dataflows → InsForge Postgres (so the enterprise agent sees normalized data)
  - Nexla Context Engine for unstructured docs (SOPs, MOPs PDFs)
- **Endpoints (REST):** `POST /sources`, `POST /dataflows`, `GET /sources/:id/status`, plus their MCP server at `mcp://nexla`
- **Mock mode:** `MOCK_NEXLA=true` returns canned "Oakland Titanium connected to SharePoint" JSON
- **Verify:** `await createDataflow({source:'sharepoint-oakland', dest:'insforge-enterprises'})` returns active dataflow_id
- **Judges:** Mihir, Abhijit
- **Research in flight:** scout-hotel → `ai/research/08-nexla.md` (SDK pattern, connector list, wrapper skeleton)
- **ETA:** 25 min

### A2b. TinyFish — INTERNAL discovery tool for the operator agent (PRIMARY)
- **Role:** TinyFish is now wrapped at `packages/backend/src/tools/tinyfish.ts` and called by `/onboard/:id/scrape` *in parallel* with Nexla. The meta-agent uses it to extract machines/hours/services from the enterprise's public website during discovery.
- **Status:** WIRED — real SSE call behind `MOCK_TINYFISH=true`, key in .env.local works.
- **Why this beats the buyer-side recipe:** keeps everything in one operator-side narrative; judges see TinyFish powering real onboarding, not a side demo.

### A2c. TinyFish cookbook recipe (`packages/pcc-capability-finder/`) — DEFERRED (if-time)
- **Role:** Originally proposed as a buyer-side demand-side recipe submitted to TinyFish's cookbook. **Deprioritized per user (2026-04-24 ~3:00 PM)** — operator side is the demo.
- **Credentials:** `TINYFISH_API_KEY` from agent.tinyfish.ai/sign-up (500 cr/mo free)
- **Status:** SCAFFOLD LANDED — renamed from `tinyfish-recipe` to `packages/pcc-capability-finder/`. Has Next.js + 7-section README + `/api/find` route doing SSE agent run + x402 enrichment + candidate list UI.
- **Commands to deploy + PR:**
  ```bash
  cd packages/pcc-capability-finder
  vercel deploy --prod                       # get live link
  gh repo fork tinyfish-io/tinyfish-cookbook --clone
  cd tinyfish-cookbook
  cp -r ../shiptoprod-agent/packages/pcc-capability-finder ./pcc-capability-finder
  git checkout -b globa/pcc-capability-finder
  git add pcc-capability-finder && git commit -m "feat(pcc): capability finder recipe"
  git push origin globa/pcc-capability-finder
  gh pr create --title "PCC Capability Finder: x402-quoted industrial capability matching" --body-file pcc-capability-finder/README.md
  ```
- **Judge-appeal for Homer Wang** (updated for demand-side framing):
  1. First B2B matchmaking recipe in the cookbook (cookbook skews consumer)
  2. Agents-calling-agents (buyer LLM → TinyFish → PCC operator agents)
  3. First recipe with on-chain primitives via x402 quote headers (Base Sepolia)
  4. Demonstrates TinyFish doing what it does best — live web discovery, no pre-built APIs
  5. Completes a two-sided market story with our Guild-hosted supply-side agent
- **Bonus track**: publish `pcc-agent-mcp` to registry.modelcontextprotocol.io
- **Verify:** deploy succeeds + PR opens + recipe at tinyfish-cookbook/pull/<N>
- **ETA:** 15 min (scaffold done; needs Vercel deploy + PR open)

### A3. InsForge wrapper (`packages/backend/src/tools/insforge.ts`)
- **Credentials:** none for signup; gets `{accessApiKey, projectUrl, claimUrl}` back
- **Endpoint:** `POST https://api.insforge.dev/agents/v1/signup`
- **Then:** SDK `createClient({baseUrl, anonKey})` + `run-raw-sql` via MCP for schema
- **Schema to insert:**
  ```sql
  CREATE TABLE enterprises (id UUID PRIMARY KEY, name TEXT, url TEXT, tinyfish_scrape JSONB, ...);
  CREATE TABLE machines     (id UUID, enterprise_id UUID REFERENCES enterprises, kind TEXT, capabilities JSONB, ...);
  CREATE TABLE jobs         (id UUID, enterprise_id UUID, state TEXT, params JSONB, escrow_address TEXT, ...);
  CREATE TABLE evidence     (id UUID, job_id UUID, kind TEXT, hash TEXT, stored_at TIMESTAMPTZ, ...);
  ```
- **Verify:** signup returns API key in <90s, auto-REST works on `/rest/enterprises`
- **ETA:** 25 min

### A4. Ghost (Tiger Data) wrapper (`packages/backend/src/tools/ghost.ts`)
- **Credentials:** GitHub OAuth via `ghost login --headless` (user step)
- **Install:** `curl -fsSL https://install.ghost.build/ | sh` then `ghost mcp install`
- **Use:** `ghost_fork` per enterprise for forkable verifier DB. Each job gets a DB fork → runs capability check → discards
- **Schema:** vector index of capability blurbs with pgvectorscale (`CREATE INDEX ... USING diskann (embedding vector_cosine_ops)`)
- **pg_textsearch BM25** over SOP/MOP docs
- **Verify:** `ghost fork <parent>` returns forked db url in <5s
- **ETA:** 25 min

### A5. Redis wrapper (`packages/backend/src/tools/redis.ts` + `redis-cache.ts`)
- **Credentials:** `REDIS_URL` (cloud.redis.io free tier, 30MB)
- **Libs:** `redis`, `redisvl`, **Agent Memory Server via MCP** (config in `.mcp.json`)
- **Three patterns wired:**
  1. **Capability vector search** (RedisVL) — operator capabilities indexed for the demand-side finder
  2. **Agent Memory Server (MCP)** — short + long-term memory for the meta-agent. `.mcp.json` already has `uvx --from agent-memory-server agent-memory mcp`. Generate `OPENAI_API_KEY` via existing CLI (user's request). Toggle `DISABLE_AUTH=true` for the demo.
  3. **LangCache semantic caching** — `redis-cache.ts` wraps Nexla queries so "list machines for Oakland Titanium" the second time hits the cache. Cosine similarity ≥ 0.92 default. Stops us from blowing through Nexla call limits during the demo.
- **a2a Streams:** `a2a:intents:<enterprise_id>` as the agent-to-agent bus
- **Verify:** `await redisClient.set("test", "1")` returns OK; `cacheGet` returns hit on second identical query
- **ETA:** 25 min

### A6. CDP + x402 wrapper (`packages/backend/src/tools/cdp-x402.ts`)
- **Credentials:** `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`
- **Libs:** `@coinbase/cdp-sdk`, `@x402/express`, `@x402/evm`
- **Use:**
  - CDP AgentKit: `createWallet()`, `fundFromFaucet()` on Base Sepolia
  - x402 middleware on `/jobs` endpoint with Coinbase facilitator (1K tx/mo free)
  - Post wallet + escrow allowlist registration to agentic.market
- **Verify:** `curl localhost:3000/jobs` returns `HTTP/1.1 402 Payment Required` with x402 headers
- **ETA:** 30 min

### A7. PCC bridge (`packages/backend/src/tools/pcc.ts`)
- **Credentials:** none (public endpoints)
- **Calls to:**
  - `GET https://capability.network/agent-package.json` — fetch full 219-tool manifest
  - Register enterprise agent via PCC's existing operator onboarding routes
  - Post a2a `UIRenderRequestIntent` for chat-driven wizard replacement
- **Verify:** fetch agent-package returns 219 tools list
- **ETA:** 15 min

---

## B. AGENT-BUILDER CORE (`packages/agent-builder`)

### B1. Discovery state machine (`packages/agent-builder/src/discovery.ts`)
- Steps: `website → databases → docs → engineers → capabilities → parameters → availability → build`
- Persists to InsForge `onboarding_sessions` table
- Each step emits to Redis Stream for observability
- **Verify:** unit test runs full discovery on mock enterprise
- **ETA:** 25 min

### B2. Agent code generator (`packages/agent-builder/src/generate.ts`)
- Takes: enterprise profile + capabilities + parameters + DB connections
- Outputs: a `enterprise-agent.ts` file customized for THAT enterprise, with:
  - Tools per capability (e.g., `check_machine_availability(machine_id, date)`)
  - Param schemas from discovery
  - a2a intent handlers matching PCC's 34 intents
- **Output dir:** `generated/<enterprise_slug>/`
- **Verify:** generated file compiles + basic tool call works
- **ETA:** 35 min

### B3. Deployment orchestrator (`packages/agent-builder/src/deploy.ts`)
- Deploys generated agent to Guild via `guild agent save --publish` (or direct)
- Registers with PCC agent-package
- Lists on agentic.market via `POST api.agentic.market/v1/services`
- Writes agent URL back to InsForge `enterprises.agent_url`
- **Verify:** after run, enterprise has `agent_url` + `marketplace_url` set
- **ETA:** 25 min

---

## C. GUILD AGENT (`packages/guild-agent`)

### C1. Initialize Guild workspace
- Run: `guild auth login --no-browser` (user clicks URL)
- Run: `guild setup` then `guild workspace select home`
- Run: `mkdir guild-agent && cd guild-agent && guild agent init --name enterprise-onboarder --template LLM`
- **Verify:** `guild agent test --ephemeral` works with dummy prompt
- **ETA:** 10 min

### C2. Wire our backend as Guild custom integration
- Guild supports custom integrations from OpenAPI specs
- Export `packages/backend/openapi.yaml` from Express routes
- `guild integration create --openapi openapi.yaml --name pcc-operator-backend`
- Guild auto-generates ~15 tools Guild agent can call
- **Verify:** agent lists `pcc_operator_backend_*` tools
- **ETA:** 20 min

### C3. Author the Guild agent (`agent.ts`)
- `llmAgent` with multi-turn, system prompt describing the discovery flow
- Tools: the auto-generated pcc_operator_backend ones
- **Verify:** `echo '{"prompt":"Onboard Oakland Titanium at https://..."}' | guild agent test --ephemeral --mode json`
- **ETA:** 15 min

### C4. Publish to Agent Hub
- `guild agent save --message "v1" --wait --publish`
- Grab shareable URL for the submission form
- **ETA:** 5 min

---

## D. VAPI VOICE AGENT (`apps/voice`)

### D1. Vapi setup (research & keys)
- Docs: https://docs.vapi.ai, repo ref: https://github.com/VapiAI/gitops
- Sign up → get `VAPI_API_KEY`
- Create phone number (Twilio bring-your-own or Vapi-provided free tier)
- **ETA:** 10 min

### D2. Create Vapi assistant
- `packages/vapi-assistant/assistant.json` defines: prompt, tools, voice (Eleven/Playht)
- Tools = HTTP webhooks to our backend `POST /onboard/:id/interview-turn`
- Transcription: built-in. LLM: Anthropic Claude (via Vapi's model config)
- **Verify:** call the number, hear "Hi, I'm Operator Agent. What's your company name?"
- **ETA:** 25 min

### D3. Backend webhook handler (`packages/backend/src/routes/vapi.ts`) — DONE (mock)
- Handles Vapi `tool-calls` webhook: `function-call`, `status-update`, `end-of-call-report`
- **Plus a Task Runner endpoint** at `POST /vapi/task-runner` that polls Vapi REST for the latest ended call on `phoneNumberId=54a23043-6c89-48ab-a2b8-012747fc6516`, extracts the assistant's structured output, and runs the tasks (`ONBOARD_START` → `CONNECT_DATA_SOURCE` → `INGEST_DOCS` → `BUILD_AGENT` → `LIST_OPERATOR` → `LOCK_ESCROW` → `FIRE_FIRST_TASK` → `FOLLOW_UP`).
- System prompt for the Task Runner agent: `apps/voice/TASK-RUNNER-PROMPT.md`
- **Credentials:** `VAPI_PRIVATE_KEY` (saved to .env.local), `VAPI_PHONE_NUMBER_ID=54a23043...`
- **Verify:** call the Vapi number → hang up → POST /vapi/task-runner returns full RunnerOutput with tasksExecuted
- **ETA:** done

### D4. Demo script for voice
- Dial number on stage → agent interviews → ends with "I'll text you the Guild URL"
- **Fallback:** if phone flaky, demo via Vapi web widget
- **ETA:** 10 min

---

## E. WEB UI (`apps/web`) — backup demo path

### E1. Next.js chat skeleton
- Minimal — one page, chat box, streams responses
- Talks to `/onboard/*` endpoints
- **Verify:** user can type + get response
- **ETA:** 30 min (punt if short on time — Guild chat UI is primary)

---

## F. CHAINGUARD SUPPLY CHAIN

### F1. Dockerfile
- `FROM cgr.dev/chainguard/node:latest`
- Build our backend in this container
- **Verify:** `docker build . && docker run -p 3000:3000 <img>` serves
- **ETA:** 10 min

### F2. .npmrc with Chainguard Libraries
- User runs: `chainctl libraries entitlements create --ecosystems=JAVASCRIPT`
- Then: `chainctl auth pull-token --repository=javascript --ttl=720h`
- Paste into `.npmrc`
- **Verify:** `pnpm install` pulls from libraries.cgr.dev
- **ETA:** 10 min

### F3. Install cgstart skill in repo
- `curl -sL https://raw.githubusercontent.com/chainguardianbb/cgstart/main/chainguard-setup.md > .claude/skills/chainguard-setup/SKILL.md`
- **ETA:** 5 min

---

## G. DEMO PACKAGE

### G1. Fixture enterprise website (`fixtures/oakland-titanium-mills/`)
- Static HTML page describing fake titanium machining shop
- Includes: 5 CNC machine names + specs, 24/7 hours, contact, "current orders" table
- Deploy to Vercel for a real URL (or serve from localhost)
- **Verify:** TinyFish scrape against it returns structured output
- **ETA:** 15 min

### G2. Demo script (`docs/DEMO-SCRIPT.md`)
- 3-minute stage walkthrough
- Timing marks
- Backup branches if any sponsor fails
- **ETA:** 15 min (one person)

### G3. Submission copy (`docs/SUBMISSIONS.md`)
- One paragraph per track (6 tracks)
- Sponsor-relevant framing for each
- Links: repo, demo URL, agent hub, marketplace listing
- **ETA:** 20 min (one person, sometime in last hour)

### G4. Record backup demo video
- 3-min screencast in case live demo fails
- OBS / QuickTime
- **ETA:** 15 min

---

## OWNER ASSIGNMENT (suggested)

| Person | Tasks | Rough time |
|---|---|---|
| **Dev 1 — Backend lead** | A1, A2, A3, A7 | 85 min |
| **Dev 2 — Memory/DB** | A4, A5, B1, B2 | 105 min |
| **Dev 3 — Web3/payments** | A6, B3, C1-C4, F2 | 90 min |
| **Dev 4 — Voice** | D1, D2, D3, D4 | 65 min |
| **Dev 5 — Demo + submission** | G1, G2, G3, F1, F3, E1(if time) | 90 min |
| **Dev 6 — Sponsor publishing** | A2b (TinyFish recipe+publish), C4 (Guild publish), B3 agentic.market listing | 60 min |

All five can start immediately in parallel. Tasks touching same package should commit-often and coordinate on slack.

---

## CREDENTIALS CHECKLIST (collect into `.env.local`)

```bash
# LLM (already have)
ANTHROPIC_API_KEY=sk-ant-...

# Sponsors — team members claim these
NEXLA_API_KEY=            # nexla.com 15-day trial (data integration layer)
TINYFISH_API_KEY=         # tinyfish.ai signup (500 cr/mo free; used for publishing our recipe + metered scrape hooks)
REDIS_URL=                # cloud.redis.io 30MB free
CDP_API_KEY_ID=           # portal.cdp.coinbase.com
CDP_API_KEY_SECRET=       # portal.cdp.coinbase.com
GUILD_WORKSPACE_ID=       # after guild auth login
CHAINGUARD_PULL_TOKEN=    # chainctl auth pull-token
VAPI_API_KEY=             # vapi.ai signup
VAPI_PHONE_NUMBER=        # assigned on signup or purchased

# No creds needed
INSFORGE_PROJECT_URL=     # returned by /agents/v1/signup
INSFORGE_ANON_KEY=        # returned by /agents/v1/signup
GHOST_SHARE_TOKEN=        # after ghost login
PCC_AGENT_PACKAGE_URL=https://capability.network/agent-package.json
```

---

## CRITICAL PATH (if we can only ship ONE thing)

1. Backend `/onboard/*` + Nexla + InsForge (A1, A2, A3)
2. Guild agent wrapping that backend (C1, C2, C3)
3. Fixture website + demo script (G1, G2)
4. Submission copy (G3)

Everything else (Ghost, Redis, x402, Vapi, Chainguard) is an EXTRA track. If we hit the critical path by 3:30pm, we're alive for the $1K Guild prize + Context Engineering meta. Everything beyond is upside.
