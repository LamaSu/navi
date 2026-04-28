# Navi v2 — Target-State Architecture (vendor-free, PCC-native)

**Author:** orchestrator + 7 parallel scouts (alpha · bravo · charlie · delta · echo · foxtrot · golf)
**Date:** 2026-04-28
**Sources:** `ai/research/v2-{01..07}-*.md`

---

## 1. Thesis

Navi's hackathon entry was a tour of 10 sponsors. **Navi v2 is a tour of one substrate (PCC) plus the four OSS pieces that don't exist in PCC yet (voice, data integration, web extraction, container hardening).**

PCC already provides every capability we leaned on a sponsor for, *except* those four. Echo's blunt summary: *"the hackathon's InsForge dependency was solving a problem that doesn't exist when PCC is the substrate."* Same applies to Senso, agentic.market, and most of Guild's value.

The right architecture is:

> **`@pcc/agent-onboarder` — a thin chat-orchestration layer (~800 LoC) inside PCC, talking to PCC's existing 218-tool agent-package, driven by raw Anthropic SDK, served via Pipecat for voice and a small chat UI for web. dlt wraps every enterprise data source. camoufox+Claude replaces TinyFish.**

**Code shrinkage**: ~40% (Navi v1 ~1400 LoC backend → v2 core ~800 LoC) by deleting work PCC already does.

---

## 2. The four-layer vendor map (post-rearchitecture)

### Layer 1: PCC substrate (what we adopt as-is)

| Concern | PCC package | Replaces v1 vendor |
|---|---|---|
| Agent runtime base (wallet, A2A, tool-use) | `@pcc/agent-runtime` (extend with `LLMAgent`) | Guild SDK |
| Operator's data backend (Postgres + auth + REST) | `@pcc/gateway` + `@pcc/db` with `tenant_id` + RLS | InsForge |
| Capability discovery (buyer side) | `agent-package.json` already exposes `search_capabilities`, `pcc_dht_query`, `match_spaces`, `get_marketplace_overview` | Senso · cited.md · agentic.market |
| Job lifecycle / a2a bus / 34 intents | `@pcc/a2a` (the `setup_*` intents we need are already there) | Custom Redis-only stream |
| MilestoneEscrow + x402 + ERC-8004 reputation | `@pcc/contracts` + `@pcc/payments` (already on Base Sepolia) | CDP wallet hassles |
| Per-capture verification | `@pcc/verifier` + CVP (waves 1-6 shipped) | Bespoke Ghost forks |
| Onboarding scaffolds + 3 device templates | `@pcc/onboard-kit` | Hand-built fixtures |
| 218-tool agent-package | `@pcc/mcp-server` exposes 49; gateway serves all | Custom MCP forge per sponsor |

**Net effect**: 7 of v1's 10 sponsors collapse into "use PCC."

### Layer 2: OSS we adopt (where PCC doesn't reach)

| Concern | Pick | License | Why |
|---|---|---|---|
| Voice agent stack | **Pipecat** + **Twilio** + **Deepgram Nova-3** + **Cartesia Sonic 3** + **Claude** | BSD-2 (Pipecat) | Native Anthropic plugins · transport-agnostic · Anthropic publishes Pipecat plugins · zero vendor lock per layer |
| Web extraction | **camoufox + Claude** (`extractStructured(url, schema, goal)` ~80 LoC) | MIT | Verified live on rigidconcepts.com · already in our harness · ~$0.020/page · stealth defeats Cloudflare/DataDome |
| Data integration runtime | **dlt** (Python lib, embedded as Python sidecar) | Apache 2.0 | ~50 MB · 60+ verified sources · 10k community · 5-step agent flow in 4 LoC · 2.8-6× faster than Airbyte |
| Container hardening | **Chainguard `cgr.dev/chainguard/node:latest-dev`** | None (free for OSS) | Already in v1 · zero-CVE · keep |

### Layer 3: In-house we own (the new code)

| Package | Purpose | Approx. LoC |
|---|---|---|
| `@pcc/agent-runtime` (existing) + new `src/llm-agent.ts` | Anthropic SDK tool-use loop, MCP support, streaming, structured output | +120 LoC patch |
| `@pcc/agent-onboarder` (new) | Chat orchestration over PCC's setup/* + onboard/* routes; smart troubleshooting; photo→capability inference; CVP fast-track guidance; hand-off to kernel agent | ~800 LoC |
| `@pcc/connectors-runtime` (new, Python sidecar wrapping dlt) | Programmatic source/destination/sync API for the agent | ~250 LoC |
| `@pcc/connectors-{postgres,salesforce,sharepoint,sap,csv}` (new TS shells) | Thin TypeScript wrappers that emit dlt source specs; agent-friendly DX | ~50 LoC each (5 × 50 = 250) |
| `@pcc/connectors-airbyte-bridge` (new, optional) | Escape hatch for enterprises already running Airbyte (talks to their existing `POST /v1/jobs`) | ~100 LoC |
| `@pcc/voice-onboarder` (new, Pipecat-based) | Voice doorway to `@pcc/agent-onboarder`; runs on Spark behind cloudflared/Twilio | ~300 LoC |
| `@pcc/web-extract` (new) | `extractStructured(url, schema, goal)` using `camoufox` subprocess + Claude tool-use | ~80 LoC |
| `@pcc/agent-onboarder-ui` (new, lives in `apps/dashboard`) | Chat console + drop-zone + live integration feed (port from Navi v1's good UI patterns) | ~600 LoC |

### Layer 4: Drop completely

| v1 sponsor / piece | Why drop |
|---|---|
| **Vapi** | Pipecat + Twilio gives us same surface, OSS, no $0.05/min after free tier |
| **Guild SDK** | Anthropic SDK direct is 80 LoC; same value, no closed-beta lock |
| **InsForge** | RLS on PCC's existing Postgres covers operator tenant data |
| **Nexla** | dlt covers 60+ first-class + 10k community sources at zero infra cost |
| **TinyFish** | camoufox + Claude does the same, free, on-device |
| **Senso (cited.md)** | PCC's agent-package + GitHub Pages mirror is the discovery surface |
| **agentic.market** | PCC's a2a + ERC-8004 reputation is the registry |
| **CDP API** (the *paid* parts) | viem-only wallet creation works; CDP optional for gasless UX upgrade later |
| **Anthropic Managed Agents** | "Guild with Anthropic branding" — same lock |
| **Ghost (Tiger Data)** | Postgres LISTEN/NOTIFY + isolated schemas is enough for verifier; revisit if true per-capture forks ever become hot path |

---

## 3. Architecture diagram (target state)

```
┌─────────────────── ENTERPRISE OPERATOR (the pointman) ────────────────────┐
│   📞 Twilio number  ·  💬 chat console  ·  🤖 Claude Code MCP client     │
└─────────────────────────────┬─────────────────────────────────────────────┘
                              │
              ┌───────────────┼─────────────────┐
              ▼               ▼                 ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ @pcc/voice-      │  │ @pcc/agent-      │  │ @pcc/mcp-server  │
    │ onboarder        │  │ onboarder-ui     │  │ (49 PCC tools    │
    │ (Pipecat + ...)  │  │ (chat in dash)   │  │  inc. setup_*)   │
    └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
             │                     │                     │
             ▼                     ▼                     ▼
    ┌────────────────────────────────────────────────────────────────┐
    │  @pcc/agent-onboarder  (the brain — ~800 LoC)                  │
    │  ▸ Anthropic SDK tool-use loop via @pcc/agent-runtime          │
    │  ▸ Conversational orchestration over the 7-step wizard         │
    │  ▸ Smart troubleshooting on /api/setup/validate failures       │
    │  ▸ Photo → capability inference                                │
    │  ▸ CVP fast-track via prove_registration                       │
    │  ▸ Hands off to kernel agent when done                         │
    └────────────────────────────┬───────────────────────────────────┘
                                 │ uses tools from
                                 ▼
    ┌────────────────────────────────────────────────────────────────┐
    │ @pcc/agent-runtime + @pcc/onboard-kit + @pcc/spec + @pcc/a2a   │
    │ (LLMAgent extends BaseAgent · wallet · A2A messaging)           │
    └────────────────────────────┬───────────────────────────────────┘
                                 │
        ┌────────────┬───────────┼─────────────┬─────────────┐
        ▼            ▼           ▼             ▼             ▼
┌────────────┐ ┌────────────┐ ┌─────────┐ ┌────────────┐ ┌──────────────┐
│ @pcc/      │ │ @pcc/      │ │ @pcc/   │ │ @pcc/web-  │ │ @pcc/        │
│ connectors │ │ gateway    │ │ verifier│ │ extract    │ │ contracts +  │
│ (dlt-based)│ │ + db (RLS) │ │ (CVP)   │ │ (camoufox  │ │ payments     │
│            │ │            │ │         │ │  + Claude) │ │ (x402,escrow)│
└─────┬──────┘ └─────┬──────┘ └────┬────┘ └─────┬──────┘ └──────┬───────┘
      │              │             │            │               │
      ▼              ▼             ▼            ▼               ▼
   enterprise's   operator's   per-capture   stealth web   Base Sepolia
   ERP/CRM/      tenant slice  evidence +    extraction    + ERC-8004
   Salesforce    of PCC's PG   ZK proofs     (no vendor)   reputation
   /SAP/MES      with RLS                                    (no vendor)
```

---

## 4. The voice stack (replacing Vapi)

```
Phone caller
    │
    ▼ PSTN
┌─────────────┐
│ Twilio      │   $0.0085/min ingress · phone number provider
│ Voice       │
└──────┬──────┘
       │ media stream (websocket)
       ▼
┌─────────────────────────────────────────────────┐
│ Pipecat agent (Python, BSD-2)                   │
│  ▸ Twilio transport plugin                      │
│  ▸ Deepgram Nova-3 STT  ($0.0077/min)            │
│  ▸ Anthropic Claude (PCC's existing key)         │
│  ▸ Cartesia Sonic 3 TTS  ($0.030/min)            │
│  ▸ Tool-use → @pcc/agent-onboarder over HTTP    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
              @pcc/agent-onboarder backend (TS, on Spark)
```

**Cost @ 1k min/mo**: ~$46 + LLM (vs Vapi $50 + LLM). Real win is no lock-in.
**Scale-down at 10k+ min/mo**: swap Deepgram → faster-whisper INT8 + swap Cartesia → Kokoro on Spark = ~$8.50/1k min (5× cheaper than Vapi).

---

## 5. The data integration story (replacing Nexla)

When the agent says *"I need to read your CMMS"*:

```python
# packages/connectors-runtime/src/runtime.py (~50 LoC core)
import dlt
from dlt.sources.helpers.rest_client import RESTClient, BearerTokenAuth
from dlt.sources.sql_database import sql_database

def connect(spec: ConnectorSpec) -> Pipeline:
    if spec.kind == "postgres":
        source = sql_database(credentials=spec.uri, table_names=spec.tables)
    elif spec.kind == "salesforce":
        source = rest_api({"client": {"base_url": spec.base_url, ...}})
    # ... 5 first-class kinds

    pipeline = dlt.pipeline(
        pipeline_name=spec.tenant_slug,
        destination=dlt.destinations.postgres(spec.pcc_destination_uri),
        dataset_name=f"raw_{spec.kind}"
    )
    return pipeline

def run_sync(pipeline, source) -> SyncStatus:
    return pipeline.run(source)
```

The agent calls TS thin wrapper:
```typescript
// packages/connectors-postgres/src/index.ts (~50 LoC)
export async function connectPostgres(uri: string, tables: string[]): Promise<ConnectorHandle> {
  return await callConnectorRuntime({ kind: "postgres", uri, tables });
}
```

**For the long tail**: dlt's declarative REST-API generic source covers ~10k community-built sources (anything with OpenAPI). Agent generates the spec from the API URL + auth pattern.
**Escape hatch**: `@pcc/connectors-airbyte-bridge` for enterprises already running Airbyte (we never operate Airbyte ourselves).

---

## 6. Web extraction (replacing TinyFish)

```typescript
// packages/web-extract/src/index.ts (~80 LoC)
import { spawn } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";

export async function extractStructured<T>(opts: {
  url: string;
  schema: ZodSchema<T>;
  goal: string;
  hops?: number;  // default 1, multi-step nav uses Haiku next-URL picker
}): Promise<T> {
  const html = await camoufoxFetch(opts.url);  // stealth Firefox
  const claude = new Anthropic();

  const result = await claude.messages.create({
    model: "claude-sonnet-4-6",
    tools: [{
      name: "emit_result",
      description: opts.goal,
      input_schema: zodToJsonSchema(opts.schema)
    }],
    tool_choice: { type: "tool", name: "emit_result" },
    messages: [{ role: "user", content: `URL: ${opts.url}\n\nHTML:\n${html.slice(0, 100_000)}\n\nGoal: ${opts.goal}` }]
  });
  return parseToolUse(result);
}
```

**Verified live by foxtrot** on `rigidconcepts.com` — pulled `Ti-6Al`, `Inconel`, `Hastelloy`, `5-Axis`, `ISO 9001`, `ITAR` first-try, no Cloudflare interstitial. ~$0.020/page.

---

## 7. Operator backend story (replacing InsForge)

**Operators get a `tenant_id` slice of PCC's existing Postgres**, not their own database.

```sql
-- packages/db/migrations/2xxx_tenant_rls.sql (~200 LoC)

ALTER TABLE machines ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id);
ALTER TABLE jobs     ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id);
-- ... for every operator-scoped table

CREATE POLICY tenant_isolation_machines ON machines
  USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
-- ... etc
```

```typescript
// packages/gateway/src/middleware/tenant.ts (~30 LoC)
app.use((req, res, next) => {
  const tenantId = req.session?.tenantId ?? req.headers['x-tenant-id'];
  db.exec(`SET LOCAL app.current_tenant = '${tenantId}'`);
  next();
});
```

**Operators get auto-REST for free** (PCC's gateway already proxies tables). Tier-3 enterprises that want their own sovereign DB point at on-prem PG via `@pcc/connectors-postgres` — same agent flow, different destination URI.

---

## 8. Discovery surface (replacing Senso/agentic.market)

```
Buyer agent's job spec
   │
   ▼
GET /api/capabilities/templates/match
  ?material=Ti-6Al-4V
  &dim_max=4x4x6in
  &certifications=AS9100D
  &require_cvp_attestation=true
  &lead_days_max=14
   │
   ▼
PCC gateway → @pcc/dht (gossip discovery) + @pcc/db (operator catalog)
   │
   ▼
Returns ranked operators:
  [{
    operator_id, name, kernel_url,
    capability_match_score: 0.94,
    erc_8004_reputation: 0.87,
    cvp_attestation_uri: "ipfs://...",  // ALCOA+ on-chain proof
    x402_quote_url: "https://operator.example/jobs",
    pricing_hint: "$280-340/hr",
    typical_lead_days: 7
  }, ...]
```

**Human/SEO surface**: nightly cron generates static HTML + JSON-LD per operator at `https://capability.network/operators/<slug>` — free, indexable, links back to the API. No Senso, no $2.5K/mo.

---

## 9. Agent runtime — the `LLMAgent` patch

```typescript
// packages/agent-runtime/src/llm-agent.ts  (NEW, ~120 LoC)
import { BaseAgent } from "./base-agent.js";
import Anthropic from "@anthropic-ai/sdk";
import { BetaToolRunner } from "@anthropic-ai/sdk/helpers/beta/mcp.js";

export class LLMAgent extends BaseAgent {
  private claude = new Anthropic();

  async chat(input: string, opts?: { maxTurns?: number; mcpServers?: string[] }): Promise<ChatResult> {
    const tools = this.getToolDefinitions();  // BaseAgent already emits Anthropic schema!
    const messages: MessageParam[] = [{ role: "user", content: input }];

    for (let turn = 0; turn < (opts?.maxTurns ?? 12); turn++) {
      const resp = await this.claude.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        tools,
        messages
      });

      if (resp.stop_reason === "end_turn") return { messages, final: resp };
      if (resp.stop_reason !== "tool_use") throw new Error(`unexpected stop: ${resp.stop_reason}`);

      const toolResults = await Promise.all(
        resp.content.filter(c => c.type === "tool_use").map(async (tu) => ({
          type: "tool_result" as const,
          tool_use_id: tu.id,
          content: JSON.stringify(await this.callTool(tu.name, tu.input))
        }))
      );

      messages.push({ role: "assistant", content: resp.content });
      messages.push({ role: "user", content: toolResults });
    }
    throw new Error("max turns exceeded");
  }
}
```

That's the entire Guild SDK replacement.

---

## 10. Deployment story

| Component | Where | How |
|---|---|---|
| `@pcc/agent-onboarder` (HTTP) | Spark or Railway | Same Dockerfile pattern as v1 (Chainguard image), promoted via build-once retag-many CI |
| `@pcc/voice-onboarder` (Pipecat) | Spark behind cloudflared | systemd service · listens for Twilio media-stream websockets |
| `@pcc/connectors-runtime` (Python sidecar) | Spark | systemd, REST API on localhost, gateway proxies |
| `@pcc/web-extract` (camoufox + Claude) | Spark | invoked synchronously by agent-onboarder over HTTP |
| `@pcc/agent-onboarder-ui` | apps/dashboard (existing PCC dashboard) | New routes: `/onboard/chat`, `/onboard/voice-pair` |
| Discovery static mirror | GitHub Pages (capability.network/operators) | Nightly cron from gateway DB |

**No more Railway lock**: voice + agent backend can run on Spark (free, 119 GB RAM) once we move out of the hackathon Railway project. Keep Railway for the public demo (LamaSu/navi) for marketing.

---

## 11. What this unlocks

- **Zero ongoing vendor cost** beyond Twilio (~$50/mo at 1k min) + Deepgram + Cartesia + Anthropic + GitHub. **No SaaS subscriptions.**
- **Self-host everything on Spark** when we cross sponsor free tiers (Whisper.cpp + Kokoro local).
- **Operator's data lives in PCC** — discoverable, attested, monetized via existing on-chain primitives.
- **One architecture covers chat / voice / MCP / API** — same `@pcc/agent-onboarder` brain behind all four doorways.
- **Dogfooding**: Claude Code in this very session can talk to `@pcc/mcp-server` directly to drive onboarding flows (pcc_chat_send, setup_*, etc.).

---

## 12. The honest tradeoffs

| Concern | Reality |
|---|---|
| Setup cost | ~2-3 weeks of focused work to port v1 → v2 (golf estimated 1-2 weeks; safer 2-3) |
| Pipecat is Python; rest of PCC is TS | Voice runs as a separate process; HTTP boundary is clean. Acceptable |
| dlt is Python | Same answer — sidecar with REST surface |
| camoufox upstream dormant since March 2025 | Track community fork. Fall back to Patchright/Nodriver post-Q3 2026 |
| Self-hosted Whisper at scale | Phase 2; start with Deepgram cloud STT |
| RLS migration risk on existing PCC data | Apply per-table behind feature flag; backfill `tenant_id` from existing operator IDs |
| Anthropic-only LLM lock | Easy to swap (LiteLLM proxy) but no need today |

---

## 13. Open questions

1. **Should Navi v1 stay public on `LamaSu/navi`?** Recommended: yes, frozen as-is, README points at `physical-capability-cloud/packages/agent-onboarder/` for production code.
2. **Single `@pcc/agent-onboarder` agent or split per persona** (machine-shop / fleet / lab / warehouse)? Probably one agent with personas as configuration, not packages.
3. **Do we need `@pcc/agent-onboarder-ui` as new code or extend the existing 7-step wizard?** Recommend: new routes that *render the same wizard data* but in a chat UI. Wizard stays for ops who want forms.
4. **CVP fast-track UX**: do we want the agent to drive `prove_registration` automatically on first job, or require operator opt-in? Default to opt-in for trust.

See `NAVI-V2-MIGRATION-PLAN.md` for the sequenced execution.
