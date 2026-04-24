# Enterprise-Operator Agent for PCC — Hackathon Plan v3 (FINAL)

**Author:** orchestrator (Claude Code /go pipeline)
**Date:** 2026-04-24 · Ship to Prod AI Hackathon
**Time check:** 1:44 PM PDT. Submissions 4:30 PM → **2h 46m remaining**. Demos 5:00 PM.
**Venue:** AWS Builder Loft SF.
**Status:** all 7 research streams complete. PLAN is final. Awaiting user confirm on strategic Qs.

---

## 1. Event reality (from scout-alpha)

- **11 sponsors**: AWS, WunderGraph, **Ghost (Tiger Data)**, Nexla, **Redis**, Akash, **TinyFish**, **Chainguard**, Vapi, **InsForge**, **Guild.ai** (bold = our targets)
- **$45K+ prize pool**; Guild has confirmed **$1K CASH**
- **25+ judges**, notably: Bryce Heltzel (Guild), Homer Wang (TinyFish), **Marie Owens + Aditi Gupta** (Redis — Marie's console shown in user's screenshot), Hang H. + Tony Chang (InsForge), Brad Bock (Chainguard), Dev Seth + Eva Zheng (Vapi), Suvij Surya (WunderGraph), James Everingham

## 2. Guild SDK constraints (from scout-bravo) — REARCHITECTURE

Guild's agent SDK DOES NOT allow external npm packages. Only `@guildai/agents-sdk`, `zod`, `@guildai-services/*`. Calls to Redis, CDP, TinyFish etc. cannot be `import`ed inside the agent file.

**Solution — 2-layer architecture:**

```
Layer 1 (Guild-native, minimal)
─────────────────────────────────
The Guild agent is a thin orchestrator. Uses:
  - llmAgent (multi-turn)
  - Custom integration pointed at OUR backend's OpenAPI
  - → Guild auto-generates ~15 tools: onboard_start, scrape_website,
    signup_insforge, index_capability, create_wallet, publish_listing, etc.

Layer 2 (our backend, does the real work)
─────────────────────────────────
Express service that:
  - holds credentials for all sponsors
  - exposes /api/* endpoints (consumed by Guild agent)
  - wraps TinyFish, InsForge, Ghost, Redis, CDP, x402
  - emits events to Redis Streams (a2a-redis)
  - publishes cited.md evidence to GitHub Pages
  - runs in cgr.dev/chainguard/node container
  - x402 middleware on /api/jobs endpoint (monetization!)
```

**Bonus prize from this design**: the backend works standalone → demoable in web chat UI OR MCP OR Guild, and also earns the **Context Engineering x402 track** because /api/jobs is a real x402-monetized service others can call.

## 3. Sponsor touchpoints (final mapping)

| Sponsor | Prize | Touchpoint | Judge bet |
|---|---|---|---|
| **Guild.ai** | **$1K CASH** | Thin Guild agent with OpenAPI integration to our backend → full onboarding workflow in chat. Published to Agent Hub. | Bryce Heltzel sees full lifecycle: build → govern → share |
| **Redis AI Incubator** | credits + judge visibility | RedisVL for capability vector search + **a2a-redis Streams** for the agent-to-agent bus between operator agent and PCC verifier | Marie/Aditi see multi-module usage + the a2a pattern Redis has been promoting |
| **TinyFish** | credits + prize | agent.tinyfish.ai scrapes enterprise website → extracts machine list, hours, contact | Homer sees "any website → programmable data source" live |
| **InsForge** | credits + prize | /agents/v1/signup in 60s → auto-REST on 5 tables (enterprises/machines/jobs/escrow/evidence) | Hang & Tony see zero-OAuth agent onboarding |
| **Ghost (Tiger Data)** | credits + prize | ghost_fork per-capture Postgres + pgvectorscale hybrid search for capability match | pgvectorscale + fork narrative lands instantly |
| **Chainguard** | credits | cgr.dev/chainguard/node base image + .npmrc Libraries + cgstart skill installed in our repo | Brad Bock sees the agent verifying its own supply chain |
| **Context Engineering** (meta) | headline prize | x402 middleware on /api/jobs + agentic.market listing + cited.md publishing convention | meets all 3 challenge requirements |
| Vapi | credits | STRETCH — add `vapi call` for phone onboarding if time permits | (low priority, cut if needed) |

## 4. The demo (3 minutes)

```
[0:00] "Every enterprise with real equipment — machine shops, fleets, labs —
        wastes two weeks integrating with PCC. We compressed it to 5 minutes of chat."

[0:20] POINTMAN: "We run titanium machining in Oakland."
       AGENT:    "Drop your website here."
       POINTMAN: https://fixtures/oakland-titanium.html

[0:35] AGENT:    "Scraping via TinyFish..." (live console)
                 "Found 5 CNC mills, 24/7 hours, contact james@..."
                 "Spinning Postgres via InsForge..." (60s, scripted pre-bake)
                 "Forking verifier DB via Ghost..."
                 "Indexing capability blurb in Redis vector store..."
                 "Creating wallet via CDP..."
                 "Funding from Base Sepolia faucet..."
                 "Registering MilestoneEscrow allowlist..."
                 "Publishing to agentic.market..."
                 "Writing cited.md evidence..."

[1:50] AGENT:    "You're live:
                   → capability.network/ops/oakland-titanium
                   → api.agentic.market/v1/services/<id>
                   → cited.md/evidence/oakland-titanium.md"

[2:10] STAGE:    "Same agent, same code — onboards a fleet company or a lab
                  with zero code change."
                 Shows agentic.market listing, live on real Base Sepolia.

[2:45] Q&A.
```

## 5. Final repository layout

```
shiptoprod-agent/
├── packages/
│   ├── backend/              # Express service with all sponsor wrappers
│   │   ├── src/
│   │   │   ├── server.ts     # x402 middleware + routes
│   │   │   ├── tools/
│   │   │   │   ├── tinyfish.ts
│   │   │   │   ├── insforge.ts
│   │   │   │   ├── ghost.ts
│   │   │   │   ├── redis.ts
│   │   │   │   ├── cdp.ts
│   │   │   │   └── pcc.ts     # calls capability.network
│   │   │   ├── onboard/       # the state machine
│   │   │   └── cited.ts       # writes cited.md
│   │   └── openapi.yaml      # ← what Guild consumes
│   ├── guild-agent/          # Guild-native llmAgent (thin)
│   │   └── agent.ts
│   └── mcp-server/           # for Claude Desktop demo
├── apps/
│   └── web/                  # Next.js chat UI (backup demo if Guild not approved)
├── public/
│   └── cited.md              # evidence log (GH Pages target)
├── fixtures/
│   └── oakland-titanium.html # fake enterprise website for scrape demo
├── Dockerfile                # FROM cgr.dev/chainguard/node
├── .npmrc                    # Chainguard Libraries registry
├── docs/
│   ├── PLAN-V3.md            # this file
│   ├── DEMO-SCRIPT.md
│   └── SUBMISSIONS.md        # one paragraph + links per track
└── README.md
```

## 6. BLOCKERS — what we need from the user RIGHT NOW

In priority order (we can't fully proceed without these):

1. **Google Doc auth** — run `/mcp`, select "claude.ai Google Drive", authenticate. ~30s. Lets us paste the plan into the shared doc.
2. **Guild auth** — `guild auth login --no-browser` needs user to open URL. ~1min. Installed at `/c/Users/globa/AppData/Roaming/npm/guild` v0.6.0.
3. **CDP keys** — portal.cdp.coinbase.com → API keys page → create keys → paste `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET`. ~5min.
4. **TinyFish key** — tinyfish.ai → signup (500 credits/mo free) → paste `TINYFISH_API_KEY`. ~2min.
5. **Redis Cloud** — cloud.redis.io → free 30MB → paste `REDIS_URL`. ~2min.
6. **Chainguard** — console.chainguard.dev → signup → `chainctl auth pull-token --repository=javascript --ttl=720h`. ~3min.
7. **Ghost** — after installing ghost CLI: `ghost login` (GitHub OAuth). ~2min.
8. **cited.md strategy** — confirm: treat as a `.md` file we publish via GitHub Pages? (Our interpretation — Senso's hosted service costs $2.5K/mo.)
9. **Scope** — confirm: standalone repo, we call capability.network endpoints from our backend? (Keeps time pressure manageable.)

## 7. Time allocation (next 2h 46m)

```
now ─────────────┬──────┬──────┬──────┬──────┬────── 4:30 PM submit
       T+0       T+20   T+60   T+120  T+150  T+160
       plan      scaffold impl   demo   submit buffer
       ✓ done    30 min 60 min  30 min 10 min
```

- **T+20** (by 2:04 PM): packages scaffolded (backend, guild-agent, mcp, web)
- **T+60** (by 2:44 PM): 5 sponsor wrappers implemented, basic onboard state machine
- **T+120** (by 3:44 PM): demo path works end-to-end against fixture website
- **T+150** (by 4:14 PM): record demo video (backup), submit to Devpost
- **T+160** (by 4:24 PM): buffer
- **5:00 PM**: live demo on stage

## 8. Parallel execution plan for implementation agents

Once user confirms strategy, spawn 4 parallel implementer agents:

- **implementer-alpha**: `packages/backend` — Express + x402 middleware + all 6 tool wrappers
- **implementer-bravo**: `packages/guild-agent` — Guild llmAgent with OpenAPI integration
- **implementer-charlie**: `apps/web` — chat UI (Next.js minimal) + `packages/mcp-server`
- **implementer-delta**: `fixtures/oakland-titanium.html` + `docs/DEMO-SCRIPT.md` + `docs/SUBMISSIONS.md`

All 4 agents work in parallel, 30-minute ralph loops, commit atomically, merge into main branch.

---

*End of PLAN-V3. Ready to execute on user confirmation.*
