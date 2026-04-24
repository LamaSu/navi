# Enterprise-Operator Agent for PCC
**Ship to Prod AI Hackathon entry — April 24, 2026**

An autonomous agent that walks the **pointman** at any enterprise (machining shop, fleet operator, manufacturing plant, lab) through getting online on the Physical Capability Cloud (PCC), declaring their capabilities, locking escrow-backed jobs, and fulfilling them via a2a + x402.

## The Context Engineering Challenge angle

Per the hackathon rubric, our agent:
- Takes **real action** on the open web: scrapes the enterprise's own website + docs to context-engineer their capability declaration; writes on-chain to Base Sepolia for escrow; publishes capability provenance to `cited.md`.
- Is grounded in **real sources** — the enterprise's own CMMS/ERP/SCADA or website inventory, not LLM hallucination.
- Uses **≥3 sponsor tools** (see below).
- **Monetizes via x402** — the enterprise gets paid when jobs settle.

## Sponsor tool matrix

| Sponsor | Integration | Track-win angle |
|---|---|---|
| **Guild AI** ($1K) | Deploy the pointman-facing onboarding agent on Guild; uses `llmAgent` + `guildTools` | Non-trivial agent lifecycle: build → govern → share a *real* enterprise-grade agent |
| **Redis AI Incubator** | RedisVL vector search + Agent Memory Server + a2a-redis Streams for a2a coordination | "Multi-module usage + a2a layer" — Redis historically rewards this |
| **TinyFish** | `agent.tinyfish.ai` to scrape enterprise websites & extract capabilities | Turns a website with no API into the first draft of a PCC capability manifest |
| **InsForge** | Backend-as-a-service for onboarding state + inventory schemas + auth | BaaS wired end-to-end: MCP-driven schema, Postgres tables for machines/jobs/escrow |
| **Chainguard** | `cgr.dev/chainguard/node` base image + Libraries `.npmrc` + cgstart skill | Supply-chain secure from day 0 — fuse Chainguard SBOM into PCC's evidence chain |
| **Ghost** | `ghost mcp install` for agent context surfaces; publish outputs to Ghost | Agent context distribution + publishing pipeline |
| **x402 / CDP / agentic.market / cited.md** | x402 for escrow settlement, CDP for wallet, agentic.market for listing, cited.md for capability evidence | Headline Context Engineering monetization requirement |

## Architecture (high level)

```
┌──────────────────────────────────────────────────────────────┐
│  POINTMAN (enterprise human operator, e.g. shop floor lead)  │
└──────────────────┬───────────────────────────────────────────┘
                   │ chat
┌──────────────────▼───────────────────────────────────────────┐
│  ENTERPRISE-OPERATOR AGENT (Guild-deployed, llmAgent)        │
│  - walks through onboarding                                  │
│  - scrapes enterprise website via TinyFish                   │
│  - drafts capability manifest (a2a intents + x402 pricing)   │
│  - registers operator with PCC agent-package                 │
│  - stores session state in InsForge                          │
│  - uses RedisVL to match incoming jobs to capabilities       │
│  - locks MilestoneEscrow on Base Sepolia via x402 + CDP      │
│  - publishes capability evidence to cited.md                 │
└──────────────────┬───────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────────────────────────┐
    │              │                                   │
    ▼              ▼                                   ▼
┌──────────┐  ┌──────────┐                     ┌──────────────┐
│ InsForge │  │  Redis   │                     │ PCC (a2a +   │
│  (state) │  │ (memory) │                     │  x402 + reg) │
└──────────┘  └──────────┘                     └──────────────┘
```

## Status

See `ai/supervisor/status.json`. Plan at `docs/PLAN.md` and in shared Google Doc.
