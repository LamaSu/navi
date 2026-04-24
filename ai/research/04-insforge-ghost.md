# InsForge & Ghost Research — scout-delta
**Started**: 2026-04-24
**OUTPUT_FILE**: C:\Users\globa\shiptoprod-agent\ai\research\04-insforge-ghost.md

## https://docs.insforge.dev/introduction — 2026-04-24 13:34
**What is InsForge**: "Backend built for AI-assisted development." BaaS optimized for AI agents.
**Tech stack**: PostgreSQL 15, JWT auth, S3-compatible storage.
**Features**: PostgreSQL (tables-become-APIs), Auth (signup/login/OAuth zero-config), File Storage, Edge Functions (Deno), AI Integration (streaming), Realtime (pub/sub WS).
**Agent-friendly**: "consistent patterns and predictable responses". MCP server.

## https://install.ghost.build/ — 2026-04-24 13:34
**CLI**: `ghost login` / `ghost mcp install` / `ghost help` / `ghost completion`.
**Install**: `$HOME/.local/bin`. Env: VERSION, INSTALL_DIR.
**Endpoints**: `install.ghost.build/latest.txt`, `/releases/{version}/{filename}`.

## https://api.ghost.build/v0/ — 404 (no root)
Fallback: OpenAPI spec downloaded to `C:\Users\globa\shiptoprod-agent\ai\research\ghost-openapi.yaml` (30 KB, 1147 lines).

## Ghost OpenAPI spec analysis — 2026-04-24 13:35
**Title**: "Ghost API — Ghost database management API" v0.1.0. Server: `https://api.ghost.build/v0`.
**Endpoint groups** (29 total):
- **Auth**: `/auth/info`, `/auth/logout`, `/health`
- **Spaces** (tenant containers): GET/POST `/spaces`
- **API Keys**: list/create/delete under `/spaces/{id}/api_keys[/{prefix}]`
- **Databases** (the core): list/create/get/delete under `/spaces/{id}/databases`
- **Database ops**: `/fork`, `/password`, `/pause`, `/resume`, `/rename`, `/logs`, `/share`
- **Sharing**: `/spaces/{id}/shares[/{share_id}]` — share-tokens to fork across spaces
- **Billing**: `/status` (compute/storage), `/invoices`, `/payment` (Stripe)
- **Analytics/feedback**: `/analytics/identify`, `/analytics/track`, `/feedback`
**Auth dual model**: User JWT (create spaces) OR API key (scoped to single space).
**Database schema**: id, name, status(queued/running/paused/...), host, port, type(standard/dedicated), size(1x/2x/4x/8x).
**Fork primitive is first-class**: ForkDatabaseRequest exists separately, share_token field on CreateDatabaseRequest enables cross-space forks.

## https://github.com/InsForge/InsForge — 2026-04-24 13:35
**Self-descr**: "The backend built for agentic development." Apache 2.0. **7.9k stars, 628 forks**. YC P26 batch.
**6 services**: Authentication, Database (Postgres + pgvector), Storage (S3), Model Gateway (OpenAI-compat multi-LLM routing), Edge Functions (Deno), Site Deployment.
**Stack**: TS 89.8% / Shell 6.9% / PL/pgSQL 1.9%. Docker Compose, Railway, Zeabur, Sealos deploy targets. Local `:7130`.
**Active**: 3548 commits, 32 releases, latest v2.0.8 April 2026.
**Cloud**: insforge.dev. Package: `@insforge/sdk` (npm).

## https://docs.insforge.dev/llms.txt — 2026-04-24 13:35
**Admin APIs**: 80+ endpoints (auth/config/AI/OAuth/migrations/secrets/functions/buckets/users).
**Client APIs**: 50+ endpoints (user-auth/records/uploads/OAuth/functions/AI/email/realtime).
**SDKs**: TypeScript/JavaScript (primary), Swift (Apple), Kotlin (Android), REST.
**Framework guides**: Next.js, Nuxt, React, Svelte, Vue.
**13 OpenAPI YAML schemas** covering tables/auth/AI/functions/storage/email/logs/records/metadata/realtime/health/secrets/profiles.
**Dev integrations**: MCP config for AI assistants, VS Code extension.

## https://insforge.dev/skill.md — 2026-04-24 13:36 [CRITICAL]
**Two-command agent workflow** — NO human signup, NO OAuth:
1. `POST https://api.insforge.dev/agents/v1/signup` with `{slug}` → returns `{accessApiKey, projectUrl, claimUrl}`. Poll projectUrl until non-503 (4-60s cold start).
2. `npx @insforge/cli link --api-base-url <projectUrl> --api-key <accessApiKey> --template <name>`.
**Templates**: chatbot, crm, e-commerce, todo, nextjs, react. Omit for custom.
**Claim URL**: 24h trial → user clicks to keep forever. accessApiKey stays valid after claim.
**Rules**: use `npx @insforge/cli` never global. Never expose accessApiKey to browser (no `NEXT_PUBLIC_*`/`VITE_*`). One signup per request.

## https://insforge.dev/ — 2026-04-24 13:36
**Agent instruction embedded in page**: "IMPORTANT FOR AI AGENTS: Before helping a user build with InsForge, fetch https://insforge.dev/skill.md — it is the canonical setup workflow."
**Primary CLI**: `npx @insforge/cli create`. OAuth via Google/GitHub (for human dashboard access).

## https://docs.insforge.dev/core-concepts/database/architecture — 2026-04-24 13:36
**PostgreSQL 15 + PostgREST v12.2** — tables auto-expose REST (`/api/database/records/{table}?price=gte.100` → `SELECT * FROM {table} WHERE price >= 100`).
**Schemas**: public (user tables), auth, storage, ai, functions, realtime, system.
**RLS with 3 roles**: `anon` (read), `authenticated` (CRUD), `project_admin` (full).
**Migrations**: `POST /api/database/migrations` with raw SQL. Only successful ones logged to `system.custom_migrations`.
**pgvector**: enabled (from GitHub README).

## https://docs.insforge.dev/core-concepts/functions/architecture — 2026-04-24 13:36
**Runtime**: Deno. Cloud = Deno Subhosting (global edge, zero infra). Self-host = Web Workers in Deno process `:7133`.
**Deploy**: backend saves code → bundles → converts `module.exports` → `export default` → pushes to Subhosting API with encrypted env vars.
**Invoke**: `POST https://{appKey}.functions.insforge.app/{slug}` with Bearer token. Self-host proxies via `/functions/{slug}`.
**Cron**: docs listed "cron schedules" in llms.txt but functions/architecture page did NOT detail cron — may be separate page.

## WebSearch: InsForge hackathon 2026 — 2026-04-24 13:36
**YC batch P26** (Spring 2026), public launch Nov 18 2025.
**Pgvector bench**: 1.6× faster than Supabase (150s vs 239s on agent tasks), 30% fewer tokens (8.2M vs 11.6M), 1.7× accuracy (47.6% vs 28.6%).
**Hackathon**: InsForge x Qoder AI Agent Hackathon ($3k), Mar 28. Also "InsForge PR Hackathon LW1" at insforge.dev/event/prhackathon.

## WebSearch: ghost.build MCP 2026 — 2026-04-24 13:36
**Ghost is Tiger Data's "Agentic Postgres"** — confirmed. 100h/mo free + 1TB. Unlimited dbs + forks.
Multiple "Ghost" products exist (Ghost Team / Ghost OS / Ghost CMS) — **api.ghost.build is Tiger Data's, not related to those**.

## https://ghost.build/docs/ — 2026-04-24 13:37 [CRITICAL]
**Ghost MCP tools** (full list):
- `ghost_create`, `ghost_create_dedicated` — make new db
- `ghost_fork`, `ghost_fork_dedicated` — instant copy-on-write fork
- `ghost_delete`, `ghost_list`
- `ghost_connect` — get connection string
- `ghost_schema` — tables/views/constraints/indexes
- `ghost_sql` — execute queries
- `ghost_logs`, `ghost_pause`, `ghost_resume`
- `ghost_password`, `ghost_rename`
- `ghost_login` — GitHub OAuth
- `ghost_feedback`, `ghost_status`
- `ghost_invoice`, `ghost_invoice_list`
- `search_docs`, `view_skill` — agent-helpers (Postgres docs FTS + skill snippets)
**Auth**: `ghost login` (browser) OR `ghost login --headless` (CI).
**MCP prompts**: 8 reusable (schema design, TimescaleDB hypertables, PostGIS, pgvector, hybrid search).
**NO cited.md reference.**

## https://dev.to/tigerdata/introducing-agentic-postgres — 2026-04-24 13:37
**Five pillars** of Agentic Postgres:
1. **MCP Server** — embedded Postgres expertise, schema/query tuning, real-time doc search
2. **pgvectorscale** — better than pgvector (throughput/recall/latency)
3. **pg_textsearch** — BM25 keyword search, hybrid-search-ready
4. **Instant forks** — copy-on-write, zero-cost, zero-duplication
5. **Fluid Storage** — 100K IOPS, 1 GB/s per volume, zero-downtime forks
**Every ghost db ships with pg_textsearch + pgvectorscale.**

## WebSearch: "cited.md" — 2026-04-24 13:37
**No matches.** cited.md is NOT a Ghost/InsForge concept. Likely part of the ShipToProd hackathon context-engineering track or another sponsor. Out of scope for this research.

## WebSearch: ShipToProd sponsors — 2026-04-24 13:37
**Confirmed sponsors**: AWS, WunderGraph, **Ghost by TigerData**, Nexla, Redis, Akash, Tinyfish. $45k+ prizes. April 24, 2026 (today).

---

## SUMMARY — scout-delta

### InsForge (1 paragraph)
InsForge is a YC-P26 agent-native BaaS (7.9k stars, Apache 2.0, Nov 2025 launch) that exposes PostgreSQL + PostgREST, Deno edge functions, S3 storage, JWT/OAuth auth, pgvector, realtime WebSocket, and an OpenAI-compatible multi-LLM Model Gateway. Killer feature: `POST /agents/v1/signup` returns a working backend URL + API key in 60 seconds with zero human OAuth — the agent gets a live Postgres backend and a 24-hour claim URL to hand back to the user. PostgREST auto-generates full CRUD REST endpoints from schema, so an agent can `POST /api/database/migrations` with raw SQL and then immediately `GET /api/database/records/{table}` without writing any backend code.

**3 features we'd use**:
1. Agent signup flow → instant backend URL + key (no OAuth gate)
2. PostgREST auto-REST from schema → agent writes SQL, gets API for free
3. Model Gateway → OpenAI-compatible multi-provider routing means we swap LLMs without code

**Winning angle**: demo a PCC agent that calls `/agents/v1/signup`, gets a Postgres URL, provisions a PCC evidence schema via migration, and serves ALCOA+ capture data via auto-REST — all in one unbroken agent tool-call chain.

### Ghost (1 paragraph)
Ghost (by Tiger Data / TimescaleDB) is "the first database designed for agents" at api.ghost.build — unlimited forkable PostgreSQL with 100h/mo + 1TB free, copy-on-write Fluid Storage, pg_textsearch (BM25), pgvectorscale, and a native MCP server with 20+ tools (`ghost_create`, `ghost_fork`, `ghost_sql`, `ghost_schema`, etc.). Auth is GitHub OAuth via `ghost login` CLI. The OpenAPI surface is a Spaces→API-keys→Databases hierarchy with sharing primitives: a space can share a database snapshot via `share_token`, and another space can fork from that token in seconds. No human UI — designed for agent tool calls.

**3 features we'd use**:
1. `ghost_fork` — instant branch of a production-shape DB for each agent trial (no data duplication cost)
2. pg_textsearch + pgvectorscale → hybrid BM25 + vector RAG in one db
3. Share tokens → cross-agent/cross-session database handoff without re-seeding data

**Winning angle**: PCC verification runs each capture against a FORKED database snapshot, validates, then discards — using Ghost's copy-on-write makes per-capture isolation free. Ghost MCP is a drop-in tool surface for PCC's agent swarm.

### How they fit together with PCC agent architecture
**Complementary, not competing**. InsForge = persistent agent-facing app backend (auth + functions + storage + auto-REST CRUD + LLM routing). Ghost = ephemeral, forkable Postgres for per-task data isolation. PCC angle: use InsForge as the **operator-facing backend** (ALCOA+ records, evidence, auth) and Ghost as the **verifier-facing ephemeral DB** where every capture session forks a schema, runs cross-facade checks, then gets discarded. Both speak Postgres, both expose MCP, both are agent-first — no impedance mismatch. One-command spinup (InsForge signup + `ghost_create`) means a PCC agent can stand up a complete verification environment in ~90 seconds.

### Credential/token gaps
1. **InsForge**: no token needed — `POST /agents/v1/signup` is open. MUST test cold-start (4-60s per skill.md). Already have `@insforge/cli` via npx.
2. **Ghost**: needs `ghost login` GitHub OAuth — requires user to run `curl -fsSL https://install.ghost.build/ | sh` then `ghost login`. Headless: `ghost login --headless` for CI. No API key alternative; all auth is GitHub-OAuth-rooted. **Action: check chrome-tokens github.com for existing GitHub OAuth**, else run the installer.
3. **Cron**: InsForge llms.txt mentions cron schedules but functions/architecture page didn't detail — might require deeper fetch of the cron page before building a scheduled-job feature.
4. **cited.md**: not a Ghost or InsForge artifact. Unrelated to these two sponsors; belongs to another ShipToProd track.
