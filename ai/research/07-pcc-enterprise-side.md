# PCC Enterprise Operator Onboarding Surface Audit — scout-golf

**Agent**: scout-golf (Explore type, read-only — report preserved from agent notification)
**Date**: 2026-04-24

## Package Architecture (27 packages)

Monorepo organized as:
- **Core agent infrastructure**: `@pcc/agent-runtime`, `@pcc/agent-broker`, `@pcc/agent-kernel`, `@pcc/agent-user`
- **Operational systems**: `@pcc/gateway`, `@pcc/kernel`, `@pcc/scheduler`, `@pcc/verifier`
- **Domain-specific tools**: `@pcc/onboard-kit`, `@pcc/contract-builder`, `@pcc/payments`
- **Infrastructure**: `@pcc/a2a`, `@pcc/dht`, `@pcc/spec`, `@pcc/contracts`

## Existing Operator Flows

**Gateway Routes (80+)**: Operators can provision API keys, auto-detect configuration, generate KERNEL_CONFIG, validate configs, register devices, submit test jobs, view earnings/certifications, manage maintenance schedules, operate under guardrail policies.

**Wizard UI (7 steps)**: React step-by-step onboarding:
1. machine identity
2. docs
3. capabilities
4. space
5. pricing
6. operator profile
7. review

**Onboarding SDK**: `@pcc/onboard-kit` provides templates for **Octoprint, Modbus, OPC/UA, SiLA, and generic-http** adapters.

**Dashboard**: Mobile PWA at `/apps/dashboard` with camera capture, job tracking, and operator metrics.

## A2A Protocol (34+ intents)

`packages/a2a/src/types.ts` defines a union of 34 intents covering:
- discovery
- negotiation
- contract building
- job lifecycle
- payment
- logistics
- verification
- setup
- anomaly detection

Messages carry Ed25519 signatures, optional NaCl encryption, W3C trace context.

**Key intent for hackathon**: `UIRenderRequestIntent` — agent can request the pointman's UI to render forms/controls. This is how our conversational onboarding agent drives the existing 7-step wizard from chat.

## x402 & Escrow

`MilestoneEscrow.sol` on Base Sepolia supports:
- multi-stablecoin
- milestone states: Unfunded → Funded → Locked → Evidenced → Attested → Released
- evidence hashing
- verifier attestation
- dispute mechanism
- 2.35% protocol fee

Other smart contracts: `ReputationRegistry`, `IdentityRegistry`, `ValidationRegistry`, `ChainlinkEvidenceVerifier`.

## Agent Package (219 tools, v2.1.0)

Publicly available at `https://capability.network/agent-package.json`. Categories:
- auth (3)
- setup/onboarding (10+)
- discovery (5)
- registration (6)
- escrow (15+)
- evidence (8+)
- protocols (14+)
- operator (4)
- bounties/pools (11+)
- more

## MCP Server (29 tools)

`@pcc/mcp-server` exposes a curated subset via MCP. Incomplete relative to 219 agent-package tools.

## Integration Points

- **Turbo** build order via `^build`
- **pnpm workspace** auto-detects `packages/*` and `apps/*`
- **CI/CD**: GH Actions (ci.yml, deploy-prod.yml manual, release.yml release-please)
- **Adding packages**: create in `packages/`, declare `workspace:*` deps, follow turbo task conventions

## Gaps — where our hackathon agent plugs in

- No automated recurring job scheduler UI/API
- No batch device import (one-at-a-time)
- No operator-facing compliance audit dashboard
- No team / multi-tenancy
- No capability versioning or update flow
- No SLA monitoring or alerts
- **No dynamic pricing agent**
- No predictive maintenance
- No integrations marketplace
- MCP server incomplete (29 vs 219 tools)
- Fiat on/off ramps not wired to operator dashboard
- Operator cannot see own ERC-8004 reputation score

## Proposed Hackathon Extension

**Package**: `@pcc/agent-operator-enterprise` (or standalone that calls PCC)

1. **Auto-discover devices** via mDNS/UPnP + device APIs — new route `/api/onboard/auto-discover`
2. **Conversational onboarding** using A2A `UIRenderRequestIntent` (guided, not form-based)
3. **Auto-generate compliance proof** (invoke `@pcc/verifier` + camera capture)
4. **Batch import** (CSV → device registration loop)
5. **SLA monitoring** — new route `/api/operator/sla-dashboard`
6. **Price suggestions** — new route `/api/operator/price-suggestions` from demand signals

**Integration effort estimate**:
- ~500 LOC core agent
- ~800 LOC gateway routes
- ~400 LOC SDK extensions
- ~300 LOC MCP wiring
- ~1000 LOC UI
- ≈ 3000 LOC total

**Key dependencies**: extend `@pcc/onboard-kit` (enterprise discovery templates), extend `@pcc/a2a` (enterprise-specific intent fields), wire 30+ missing tools from agent-package to gateway routes.

## Decision for hackathon (2026-04-24)

**Pick the STANDALONE path** for the 4-hour window:
- `C:\Users\globa\shiptoprod-agent\` stays as a NEW repo that **calls existing PCC** services (agent-package, gateway, a2a, MilestoneEscrow).
- Post-hackathon: promote the agent into `physical-capability-cloud/packages/agent-operator-enterprise/`.
- Avoids merge pain during the time crunch.
