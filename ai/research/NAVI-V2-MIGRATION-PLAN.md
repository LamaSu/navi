# Navi v2 — Migration Plan (works backwards from target architecture)

**Pairs with:** `NAVI-V2-TARGET-ARCHITECTURE.md`
**Estimate:** 12-16 working days end-to-end (3 working weeks at moderate pace)
**Repos affected:**
- `C:\Users\globa\shiptoprod-agent` (LamaSu/navi) — frozen as marketing demo at the end
- `C:\Users\globa\physical-capability-cloud` (LamaSu/physical-capability-cloud) — production target

---

## Sequence in 5 waves

```
WAVE 0 (½d)  — repo prep · feature flags · CI guardrails
WAVE 1 (3d)  — vendor-free swaps in v1 (low-risk, in-place)
WAVE 2 (5d)  — port to PCC packages (the architecture move)
WAVE 3 (3d)  — voice + connectors (the OSS net-new)
WAVE 4 (3d)  — production hardening (auth, RLS, observability)
WAVE 5 (1d)  — public-demo refresh + frozen v1 archive
─────────────────────────────────────────────────────
                    14 working days
```

Each wave produces something demonstrable. **Worst case: stop after wave 2 and we've already removed all vendor lock from the live demo.**

---

## WAVE 0 — repo prep (½ day)

### 0.1 Decision lock
- [ ] Confirm: Option C (hybrid). Keep `LamaSu/navi` public + frozen; build production into PCC.
- [ ] Confirm: rename `@shiptoprod/backend` → `@pcc/agent-onboarder` *only* after the move (not in the v1 repo).
- [ ] Confirm: target deploy = Spark + cloudflared (drop Railway after the move).

### 0.2 Branches
- [ ] In `physical-capability-cloud`: create branch `feat/agent-onboarder-v2`.
- [ ] Tag `LamaSu/navi` at the current head: `git tag v1.0-hackathon` (preserves the artifact).

### 0.3 CI guardrails
- [ ] PCC's CI already runs vitest + tsc + forge tests. Add the new package to `pnpm-workspace.yaml`.
- [ ] Add a feature flag `NAVI_V2_ROLLOUT` to gateway routes that will be replaced (so we can dual-run during cutover).

### 0.4 Working memory
- [ ] Copy v1 audit, target architecture, and migration plan into `physical-capability-cloud/docs/agent-onboarder/` so PCC contributors have the context.

---

## WAVE 1 — vendor-free swaps (3 days, in-place on Navi v1)

These changes happen in `LamaSu/navi` *first* — safest to prove out before porting. Each swap can be deployed independently.

### 1.1 Replace Guild SDK with raw Anthropic SDK (½ day) — `@anthropic-ai/sdk`
- [ ] Add dependency to `packages/backend/package.json`: `"@anthropic-ai/sdk": "^0.40.0"` (already there)
- [ ] Write `packages/backend/src/llm-agent.ts` (~80 LoC tool-use loop)
- [ ] Wire it behind a feature flag `USE_GUILD_SDK=false` (default false)
- [ ] Delete `packages/guild-agent` from the workspace (move to `archive/guild-agent/` for reference)
- [ ] Update README to drop "Guild llmAgent" claim

### 1.2 Replace TinyFish with camoufox + Claude (½ day) — already in harness
- [ ] Write `packages/backend/src/tools/web-extract.ts` (~80 LoC) — `extractStructured(url, schema, goal)`
- [ ] Update `packages/backend/src/routes/onboard.ts` `/scrape` to call new function instead of TinyFish API
- [ ] Set `MOCK_TINYFISH=true` permanently; delete `tools/tinyfish.ts` (move to archive)
- [ ] Smoke-test against rigidconcepts.com

### 1.3 Replace Senso with native PCC discovery + GitHub Pages mirror (1 day)
- [ ] Add `packages/backend/src/tools/pcc-discovery.ts` (~150 LoC) calling capability.network's existing `search_capabilities`/`pcc_dht_query`/`match_spaces` tools
- [ ] Generate static HTML+JSON-LD per onboarded operator at `public/operators/<slug>.html` (cron in next wave)
- [ ] Set `MOCK_SENSO=true`; delete `tools/senso.ts` (archive)

### 1.4 Replace agentic.market with PCC a2a registry (½ day)
- [ ] Update `cdp-x402.ts:listOnAgenticMarket` to instead emit a PCC a2a `discover_capabilities` registration
- [ ] Set `MOCK_CDP=false` for wallet, `MOCK_AGENTIC_MARKET=true` permanently
- [ ] Delete the agentic.market POST attempt code

### 1.5 Replace Vapi backend reliance with abstract `VoiceAdapter` interface (½ day)
- [ ] Refactor `routes/vapi.ts` + `onboard/task-runner.ts` behind `interface VoiceAdapter` — Vapi becomes one impl
- [ ] Stub Pipecat impl that calls the same backend (ready for wave 3)
- [ ] No deletion yet — Vapi still serves the public demo number

**Wave 1 deliverable**: LamaSu/navi runs with 4 fewer vendor dependencies. Same demo, same URLs, but the only real lock-in left is Vapi (acceptable for a demo).

---

## WAVE 2 — port to PCC packages (5 days)

### 2.1 Create `physical-capability-cloud/packages/agent-onboarder/` (1 day)
- [ ] Scaffold standard PCC package layout (package.json, tsconfig, src/, vitest config)
- [ ] Add to `pnpm-workspace.yaml` and root `tsconfig.json` references
- [ ] Initial files (placeholders, will fill):
  - `src/index.ts` — public API
  - `src/onboarder-agent.ts` — extends `LLMAgent` from `@pcc/agent-runtime`
  - `src/state-machine.ts` — port from v1 `onboard/state.ts`
  - `src/tools/` — port `web-extract`, `pcc-discovery` from wave 1
  - `src/system-prompt.ts` — the discovery flow prompt (port + clean)
- [ ] CI runs `pnpm --filter @pcc/agent-onboarder test`

### 2.2 Add `LLMAgent` to `@pcc/agent-runtime` (½ day) — Anthropic SDK loop
- [ ] Write `packages/agent-runtime/src/llm-agent.ts` (~120 LoC, see arch §9)
- [ ] Reuse `BaseAgent.getToolDefinitions()` (already emits Anthropic-format schemas)
- [ ] Add MCP support via `@anthropic-ai/sdk/helpers/beta/mcp` BetaToolRunner
- [ ] Write 3 vitest cases: tool-use loop, MCP server connection, streaming
- [ ] Re-export from `packages/agent-runtime/src/index.ts`

### 2.3 Wire `@pcc/agent-onboarder` to PCC's existing surface (1 day)
- [ ] Replace v1's hand-written `tools/insforge.ts` calls with PCC gateway's existing `setup/*` and `onboard/*` routes
- [ ] Drop `signupInsforge` entirely — operator gets a `tenant_id` row in PCC's DB instead
- [ ] Replace v1's `redis.ts indexCapability` with `@pcc/dht` announce (already part of PCC)
- [ ] Drop `senso.ts` — call `@pcc/dht` + write the static mirror

### 2.4 Port the chat UI to `apps/dashboard` (1 day)
- [ ] Move `packages/backend/public/index.html` → `apps/dashboard/src/routes/onboard/chat/index.tsx` (Vue → React)
- [ ] Move `op.html` → `apps/dashboard/src/routes/operator/[id]/index.tsx`
- [ ] Reuse PCC's `@pcc/ui` components (already has chat patterns)
- [ ] Wire to new `@pcc/agent-onboarder` HTTP endpoint

### 2.5 Port event-bus + telemetry (½ day)
- [ ] Move `packages/backend/src/lib/event-bus.ts` → `packages/agent-onboarder/src/lib/event-bus.ts`
- [ ] No changes — it's vendor-agnostic. Keep verbatim.
- [ ] Hook into PCC's existing OTel/Sentry pipes if those exist; if not, just expose `/api/agent-onboarder/events`

### 2.6 Frozen archive of Navi v1 (½ day)
- [ ] In `LamaSu/navi`: README banner `"This is the hackathon entry. Production code lives at LamaSu/physical-capability-cloud → packages/agent-onboarder"`
- [ ] Tag `v1.0-hackathon-frozen`
- [ ] Drop the deployed Railway service (or keep it as the marketing demo with a 30-day shutdown notice)

**Wave 2 deliverable**: A working `@pcc/agent-onboarder` package inside PCC, callable via PCC gateway, talking to PCC's a2a + db + dht + verifier. The v1 backend can be shut down.

---

## WAVE 3 — voice + connectors (3 days, the OSS net-new)

### 3.1 `@pcc/voice-onboarder` (Pipecat) — 1.5 days
- [ ] New package `packages/voice-onboarder/` (Python, since Pipecat is Python)
- [ ] `src/agent.py` (~200 LoC): Pipecat pipeline = Twilio transport + Deepgram STT + Anthropic Claude + Cartesia TTS
- [ ] Tools route to `@pcc/agent-onboarder` HTTP API (the brain stays TS, only voice IO is Python)
- [ ] systemd service file for Spark deployment
- [ ] cloudflared tunnel config to expose Twilio webhook publicly
- [ ] Twilio number bought (or repoint the existing 650-448-0770)
- [ ] Smoke-test: dial → 30-second interview → backend records the session

### 3.2 `@pcc/connectors-runtime` (dlt sidecar) — 1 day
- [ ] New package `packages/connectors-runtime/` (Python, dlt-based)
- [ ] `src/runtime.py` (~250 LoC): REST API wrapping dlt; one endpoint per action: `POST /sources`, `POST /destinations`, `POST /pipelines/:id/run`, `GET /pipelines/:id/status`
- [ ] systemd on Spark; gateway proxies under `/api/connectors/*`
- [ ] Five thin TS wrappers: `@pcc/connectors-{postgres,salesforce,sharepoint,sap,csv}` (~50 LoC each)
- [ ] Smoke-test: agent says "connect a postgres", connectors-runtime creates a real dlt pipeline → InsForge-equivalent destination → reads 10 rows

### 3.3 `@pcc/connectors-airbyte-bridge` (escape hatch, ½ day)
- [ ] ~100 LoC TS wrapper that calls existing-Airbyte's `POST /v1/jobs`
- [ ] Optional dependency, only loaded when an enterprise has Airbyte already

**Wave 3 deliverable**: Voice + structured-data integration are vendor-free. The full pipeline (call → onboarder → connect ERP → operator goes live) runs on Spark + Twilio cents.

---

## WAVE 4 — production hardening (3 days)

### 4.1 RLS migration on PCC's Postgres (1 day)
- [ ] Write `packages/db/migrations/2xxx_tenant_rls.sql` (~200 LoC)
- [ ] Add `tenant_id` to: machines, jobs, customers, evidence, capabilities (and any other operator-scoped table — alpha enumerates them)
- [ ] Backfill `tenant_id` from existing operator IDs
- [ ] Add `current_setting('app.current_tenant')` middleware in `@pcc/gateway`
- [ ] Vitest cases for cross-tenant leak prevention
- [ ] Roll out behind feature flag `RLS_ENFORCE`; flip on after 1 week of dual-running

### 4.2 Auth, sessions, audit log (1 day)
- [ ] JWT-based session auth on `@pcc/agent-onboarder` (PCC's `identity-8004` already has the patterns)
- [ ] Audit log every onboarder action to existing PCC audit pipeline
- [ ] Rate limiting per tenant (PCC gateway already has this)

### 4.3 Persistent state (½ day)
- [ ] Move `state-machine.ts` from in-memory Map to PCC's existing Postgres
- [ ] Add session restart recovery (in-progress onboardings resume after backend restart)
- [ ] Vitest case: restart mid-session, resume completes successfully

### 4.4 Observability (½ day)
- [ ] Wire event-bus to OTel exporter (Honeycomb/Axiom/Sentry — whatever PCC uses)
- [ ] Dashboard panel: onboardings/day, vendor-call latencies, p50/p95/p99
- [ ] Alert: vendor failure rate > 5% over 5min → Slack ping

---

## WAVE 5 — public-demo refresh + frozen v1 archive (1 day)

### 5.1 LamaSu/navi public README
- [ ] Banner: "Hackathon snapshot · production at LamaSu/physical-capability-cloud → packages/agent-onboarder"
- [ ] Embed final video (already in `docs/media/navi-demo-2min.mp4`)
- [ ] Link to architecture doc + migration plan in PCC repo
- [ ] Keep the live phone number active for 30 days (graceful sunset)

### 5.2 PCC dashboard refresh
- [ ] New `apps/dashboard/src/routes/onboard/` showcases the v2 chat console
- [ ] Public-facing operator profile pages at `/operators/<slug>` (the GitHub Pages mirror replacement)
- [ ] Voice number featured prominently

### 5.3 Sunset
- [ ] Cancel Railway service for shiptoprod-agent (after wave 5 stabilizes)
- [ ] Cancel Vapi number (port to Twilio)
- [ ] Cancel InsForge auto-signups
- [ ] Cancel Senso draft account (free, but no longer publishing)
- [ ] Keep: Anthropic, Twilio, Deepgram, Cartesia, GitHub, Spark (all marginal cost or already-paid)

---

## Decision matrix per swap (severity / effort / risk)

| Swap | LoC delta | Risk | Reversibility |
|---|---|---|---|
| Guild SDK → Anthropic SDK | -78 +120 | LOW | trivial — flip flag |
| TinyFish → camoufox+Claude | -60 +80 | LOW | trivial |
| Senso → PCC discovery + GH Pages | -120 +150 | LOW | trivial |
| InsForge → PCC tenant slice (RLS) | -80 +200 (SQL) | MED | RLS migration is the real risk; rollback = drop policies |
| Vapi → Pipecat + Twilio | +400 (Python) | MED | dual-run for a week before sunset |
| Nexla → dlt sidecar | -0 +500 (new) | LOW | drop sidecar, wrappers degrade to noop |
| CDP API → viem-only | -50 +20 | LOW | wallet creation is the only real surface |
| agentic.market → PCC a2a | -30 +0 (PCC has it) | LOW | trivial |

---

## Killer outcomes

After all 5 waves:
- **Vendor SaaS spend**: ~$50-80/month (Twilio + Deepgram + Cartesia at ~1k min) vs hackathon ~$300+/month at scale
- **OSS-only critical path**: Anthropic, Pipecat, dlt, camoufox, Postgres, Redis, viem — every layer swappable
- **Self-hostable on Spark** when we cross sponsor free tiers (Whisper.cpp + Kokoro local replacement)
- **Production code lives in PCC**, not a hackathon repo — PCC's CI, release-please, deploy-prod pipeline all apply
- **Zero data lock-in** — operator's data is in PCC's PG (theirs) or sovereignly federated (theirs); never ours
- **One brain, four doorways** — phone, chat, MCP, REST all hit `@pcc/agent-onboarder`

---

## What we should NOT do

- Don't try to keep both LamaSu/navi *and* PCC's @pcc/agent-onboarder in sync. Freeze v1, move on.
- Don't try to support every Nexla connector via dlt on day 1 — start with 5 (postgres / salesforce / sharepoint / sap / csv) and let the long tail be REST-API-generic.
- Don't get clever with Pipecat-in-TS via a Python child process. Two separate processes, HTTP boundary.
- Don't migrate RLS on existing operator data before we have a dual-run rollout window. Painful to roll back.
- Don't drop Vapi until Pipecat + Twilio is verified at 1k min/mo of real load.

---

## What unblocks Wave 1 starting *today*

1. **Decision: confirm Option C (hybrid).** ✓ Agreed in target architecture.
2. **Decision: target deploy = Spark + cloudflared post-move.** Confirm.
3. **Branch creation:** `feat/agent-onboarder-v2` in PCC. (Wave 0)
4. **Tag:** `v1.0-hackathon` on LamaSu/navi.
5. **Then:** kick off `implementer-alpha` (Anthropic SDK swap) + `implementer-bravo` (camoufox+Claude swap) in parallel — both are safe in-place changes in v1.

Final stop sign before kickoff: confirm there's no constraint we missed (existing PCC contributors, downstream integrations, capability.network production traffic). If clear, ship Wave 1 in next 3 working days.
