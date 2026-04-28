# V2-05 — OSS / PCC-Native Replacements for InsForge, Senso, agentic.market

**Agent**: scout-echo
**Date**: 2026-04-24
**Inputs**: scout-golf PCC enterprise audit (07-pcc-enterprise-side.md), capability.network/agent-package.json (live), web research

---

## Q1 — Operator Backend

### Decision Matrix

| Approach | RAM/op idle | Multi-tenant story | Auth | REST auto-gen | Functions | DX | Verdict |
|----------|-------------|-------------------|------|---------------|-----------|-----|---------|
| **PCC-managed (RLS)** | 0 (shared) | Native — `tenant_id` + RLS policies in `@pcc/db` | PCC identity (Ed25519 + ERC-8004) | Existing 130+ gateway routes | `@pcc/gateway` Fastify routes | Best — operator gets URL, no infra | **PRIMARY** |
| Supabase self-host | ~1-2 GB (17 containers, Kong+Realtime+GoTrue) | Not native — 1 stack per project, no built-in org model | GoTrue (JWT) | PostgREST built-in | Edge Functions (Deno) | Heavy, multi-container | Skip |
| Pocketbase | ~10 MB | Single-tenant by design (1 binary = 1 db) — needs PocketHost to multi-tenant | Built-in JWT | Built-in REST | JS hooks | Single binary, but SQLite-only | Skip — wrong DB |
| Plain PG + PostgREST | ~70 MB | Need to BUILD RLS yourself | Roll-your-own JWT | PostgREST | None | Lean | Fallback if PCC RLS rejected |
| Neon (free) | 0 (serverless) | 100 projects × 0.5 GB/each free, scales 5K | Bring your own | Bring your own | None | Great for prototypes | Bridge only |
| InsForge | 0 (their cloud) | Yes | Yes | Yes | Yes | Will charge (YC) | Replace |
| Operator-self-hosted | N/A | N/A | Operator's existing system | N/A | N/A | Zero work for us | For ENTERPRISE tier only |

### Recommendation (1 paragraph)

**Operators do NOT need their own Postgres.** PCC already has `@pcc/db`, `@pcc/gateway` (130+ routes), and a 219-tool agent-package with auth via Ed25519 + ERC-8004 reputation. Add a `tenant_id` column + RLS policies to existing tables, set `app.current_tenant` per request from the operator's signed session, and every operator gets isolated data on shared infrastructure at zero marginal RAM cost. RLS is the canonical pooled-multi-tenant pattern (AWS, Nile, Logto, OneUptime all converge here in 2026). The killer fact: PCC's gateway already generates the REST surface — adding RLS is ~200 LOC of migrations, not a new stack. **Fallback bridge** for the hackathon window: Neon free tier (100 projects × 0.5 GB) — one project per operator, points at PCC for everything except their private custom data.

---

## Q2 — Discovery Surface

### PCC ALREADY HAS IT

`https://capability.network/agent-package.json` exposes a `discovery` category with these endpoints (verified live):

- **`pcc_dht_query`** — DHT capability lookup (no auth, P2P)
- **`search_capabilities`** → `GET /api/capabilities/templates?type=&keyword=` — keyword + type filter with **pricing + assurance tiers attached**
- **`list_capability_types`** → `GET /api/capabilities/types` — taxonomy (FDM, SLA, CNC, HPLC, ...)
- **`list_kernels`** / **`get_kernel`** / **`get_kernel_devices`** → `GET /api/kernels[...]` — operator+device drill-down
- **`search_spaces`** / **`match_spaces`** → physical/logistics filter
- **`get_marketplace_overview`** → demand/supply snapshots
- **`pcc_dht_announce`** — operators broadcast capabilities P2P

### API Contract for "find operators matching X"

```http
POST /api/capabilities/templates/match
Authorization: Bearer <buyer-agent-jwt>
Content-Type: application/json

{
  "spec": {
    "capability_type": "CNC_5AXIS",
    "material": "Ti-6Al-4V",
    "tolerance_mm": 0.15,
    "quantity": 12,
    "deadline": "2026-05-15",
    "geo": {"country": "US", "max_distance_km": 800}
  },
  "filters": {
    "min_assurance_tier": "ALCOA_PLUS",
    "min_reputation_score": 0.85,
    "require_cvp_attestation": true
  }
}
→ 200 OK
{
  "matches": [
    {
      "operator_id": "did:pcc:0xAaB3...",
      "kernel_id": "shop-kernel-7",
      "capability_template_id": "tpl_cnc5_ti_001",
      "price_quote_usdc": "1840.00",
      "assurance_tier": "ALCOA_PLUS",
      "cvp_attestation_uri": "ipfs://bafy...",
      "erc8004_reputation": 0.92,
      "milestone_escrow_ready": true
    }
  ]
}
```

### Recommendation (1 paragraph)

**Use PCC's existing `/api/capabilities/templates` + DHT.** It already returns pricing, assurance tiers, kernel+device metadata, and ERC-8004 reputation; we just need a `/match` extension that takes a structured job spec and ranks results. Drop Senso entirely (it's just a CMS wrapper around static markdown — PCC's registry IS the canonical source of truth). For human/SEO discovery, generate a **public read-only mirror** of `/api/capabilities/templates` rendered as static HTML+JSON-LD on GitHub Pages (cron'd nightly) — costs nothing, gets indexed, and back-links to the API for agents. **Critical**: every match response carries the `cvp_attestation_uri` — buyer agents verify ALCOA+ on-chain BEFORE ever quoting an operator. Self-reported claims are filtered out by `require_cvp_attestation: true`.

---

## Big Architectural Insight

**An operator's standalone backend has ZERO load-bearing role given PCC's substrate.** PCC already provides identity (ERC-8004), data plane (`@pcc/db` + gateway), discovery (DHT + REST), trust (CVP + ALCOA+ attestations), and settlement (MilestoneEscrow + x402). The only legitimate reason an operator needs their OWN Postgres is for **sovereign private data** they refuse to put on shared substrate (proprietary CAM files, trade-secret process parameters). That's a tier-3 enterprise feature — point at their existing on-prem Postgres via a thin adapter — NOT a default. **For 95% of operators (small/medium), the right answer is: no separate backend. Their data lives in PCC's RLS-isolated multi-tenant Postgres, and the "operator backend" is just a slice of the gateway with their `tenant_id` baked into every query.** The hackathon's InsForge dependency was solving a problem that doesn't exist when PCC is the substrate.

---

## Sources

- [Multi-tenant data isolation with PostgreSQL Row Level Security — AWS](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)
- [Shipping multi-tenant SaaS using Postgres Row-Level Security — Nile](https://www.thenile.dev/blog/multi-tenant-rls)
- [Supabase vs Pocketbase comparison — programonaut](https://www.programonaut.com/pocketbase-vs-supabase-an-in-depth-comparison-auth-dx-etc/)
- [PocketBase multi-tenancy discussion — github](https://github.com/pocketbase/pocketbase/discussions/498)
- [Neon free tier pricing 2026 — Neon](https://neon.com/pricing)
- [PostgREST GitHub repo](https://github.com/postgrest/postgrest)
- [pg_trgm trigram similarity — PostgreSQL docs](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Cited.md / Senso landing](https://cited.md/)
- [PCC agent-package.json — live](https://capability.network/agent-package.json)
- Internal: `C:\Users\globa\shiptoprod-agent\ai\research\07-pcc-enterprise-side.md` (scout-golf)
