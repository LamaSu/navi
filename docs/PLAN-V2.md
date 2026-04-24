# Enterprise-Operator Agent for PCC — Hackathon Plan v2

**Author:** orchestrator (Claude Code /go pipeline)
**Date:** 2026-04-24 (Ship to Prod AI Hackathon — TODAY)
**Timeline:** Submissions 4:30pm PDT, demos 5:00pm, awards 7:00pm. ~5 hours remain at time of writing.
**Venue:** AWS Builder Loft, SF. 9:30am-7:30pm PDT. Host: Alessandro Amenta.
**Status:** 6/7 research streams complete; Guild deep-dive in progress.

---

## 1. Event reality check

- **11 sponsors** (not 6): AWS, WunderGraph, Ghost (Tiger Data), Nexla, Redis, Akash, TinyFish, Chainguard, Vapi, InsForge, Guild.ai
- **$45K+ prize pool**
- **25+ judges**, including sponsor reps we'd directly impress:
  - Guild.ai — **Bryce Heltzel**
  - TinyFish — **Homer Wang**
  - Redis — **Aditi Gupta**, **Marie Owens** ← screenshot user shared is from her console
  - InsForge — **Hang H.**, **Tony Chang**
  - Vapi — Dev Seth, Eva Zheng
  - Chainguard — Brad B. (Bock, who wrote the PDF deck)
  - WunderGraph — Suvij Surya, Nithin Kumar
  - Nexla — Mihir, Abhijit
  - Plus judges from Alacriti, Cursor, Airbyte, Tools for Humanity, Dodge AI, Story, Pointer, Bland AI, Onton, James Everingham
- **Meta-challenge**: autonomous web agent + ≥3 sponsor tools + publish to cited.md + monetize via x402/MPP/CDP/agentic.market

## 2. Ship-in-5-hours strategy

**Pick one agent → touch N sponsors → submit to N+1 tracks.**

The agent is the same code; submissions are Devpost-style forms. We target **6 tracks at once**:

| Rank | Track | Prize | Why | Integration |
|---|---|---|---|---|
| 1 | Guild.ai | $1K CASH | smallest pool, confirmed, in-house judge | llmAgent + guildTools shipped via `guild agent save --publish` |
| 2 | TinyFish | credits + prize | precedent: LotusHacks = Mac Mini+AirPods | scrape enterprise website to draft capability manifest |
| 3 | Redis AI Incubator | likely cash | Marie Owens is already in user's Redis account | RedisVL + AgentMemoryServer + a2a-redis Streams |
| 4 | InsForge | cash | `/agents/v1/signup` takes 60s — demoable | full backend scaffold from one tool call |
| 5 | Chainguard | credits | cgstart skill + zero-CVE base image | dockerfile base + Libraries entitlement |
| 6 | Context Engineering (meta) | headline | x402 + cited.md | middleware + public cited.md |
| + | Ghost (Tiger Data) | bonus | pgvectorscale + fork | verifier db forks on each capture |
| + | Vapi | bonus | add voice if time permits | `vapi call` for pointman phone onboarding |

Skip: AWS (generic), WunderGraph (federation doesn't fit narrative), Nexla (ETL doesn't fit), Akash (deploy-only).

## 3. What we're building

**The Enterprise-Operator Agent** — a conversational assistant that walks the enterprise pointman (shop floor lead at a machining company, ops manager at a fleet, lab admin) through getting their capabilities listed on PCC and earning x402 revenue in under 5 minutes of chat.

### The demo flow (3-minute pitch on stage)

```
0:00 — stage: "every enterprise with real capabilities wastes 2 weeks integrating with PCC.
       we compress it to 5 minutes of chat."

0:20 — [agent console, live]
       pointman: "we run a 5-axis mill in Oakland, titanium specialty"
       agent:    "share your website so I can pull equipment details"
       pointman: https://example-titanium-mills.vercel.app

0:35 — [agent ->TinyFish] scrape → extracts: 5 machines, hours, contact
       [agent ->InsForge] /agents/v1/signup → Postgres + auth + storage in 60s
       [agent ->Redis] RedisVL index capability blurbs
       [agent ->Ghost] fork verifier Postgres for this operator

1:35 — pointman: "standard turnaround 48hr, $350/hr, max part 4x4x6 in"
       agent:    "drafting your a2a capability manifest + MilestoneEscrow allowlist"
       [agent ->CDP] create wallet, fund from faucet
       [agent ->x402] middleware live at /jobs endpoint
       [agent ->agentic.market] listing published
       [agent ->cited.md] writes /public/cited.md with all provenance

2:25 — on-screen: "Oakland Titanium Mills is live at capability.network/ops/<id>
                    takes jobs via a2a
                    settles via MilestoneEscrow on Base Sepolia
                    listed at api.agentic.market/v1/services/<id>"

2:35 — stage: "5 sponsors in one chat. Chainguard base image, supply-chain clean.
              The same agent can onboard a fleet company or a lab with zero code change."

2:55 — Q&A
```

## 4. Architecture (final)

```
┌─────────────────────────────────────────────────────────────────────┐
│  POINTMAN                                                           │
│  (web chat → apps/web; voice → Vapi; claude desktop → apps/mcp)     │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
       ┌───────────────▼──────────────────────┐
       │  ENTERPRISE-OPERATOR AGENT           │  deployed on Guild
       │  packages/agent-core                 │  (llmAgent + guildTools)
       │  - system prompt: PCC onboarding     │
       │  - multi-turn, tool-calling          │
       └────┬───────┬────────┬────────┬──────┬┘
            │       │        │        │      │
            ▼       ▼        ▼        ▼      ▼
    ┌──────────┐ ┌───────┐ ┌────────┐ ┌─────┐ ┌──────────┐
    │ TinyFish │ │InsForge│ │  Redis │ │Ghost│ │   CDP +  │
    │  (scrape │ │ (ops DB│ │ (mem + │ │(fork│ │  x402 +  │
    │  sites)  │ │  + auth│ │  a2a)  │ │  DB)│ │ a.market)│
    └────┬─────┘ └────┬───┘ └────┬───┘ └──┬──┘ └────┬─────┘
         │            │          │         │         │
         └────────────┴──────────┼─────────┴─────────┘
                                 ▼
                        ┌────────────────────┐
                        │  PCC BRIDGE        │ packages/pcc-bridge
                        │  - agent-package   │ (calls existing
                        │  - a2a intents     │  PCC services)
                        │  - MilestoneEscrow │
                        │  - CVP evidence    │
                        └────────────────────┘

Every layer publishes a trail to /public/cited.md
Every service runs on cgr.dev/chainguard/node
Everything observable on http://localhost:3457
```

## 5. PCC internal context (from scout-golf)

Existing PCC monorepo has **27 packages, 80+ gateway routes, 219 agent-package tools, 34 a2a intents, 29 MCP tools**. It already has a form-based 7-step wizard. Our agent **replaces the form with a conversation** and **auto-discovers devices** via web scraping.

Critical existing primitives we reuse:
- `@pcc/onboard-kit` adapter templates (Octoprint, Modbus, OPC/UA, SiLA, generic-http)
- `@pcc/a2a` — `UIRenderRequestIntent` lets agent drive the wizard from chat
- `@pcc/verifier` — ALCOA+ evidence trail
- `MilestoneEscrow.sol` on Base Sepolia
- Agent package at `https://capability.network/agent-package.json`

**Hackathon approach**: stay in the new `shiptoprod-agent/` repo, call existing PCC services via their public endpoints. Post-hackathon merge to `physical-capability-cloud/packages/agent-operator-enterprise/`.

## 6. Package layout (what we actually build)

```
shiptoprod-agent/
├── packages/
│   ├── agent-core/           # Guild llmAgent definition
│   ├── tools-tinyfish/       # guildTool wrapper for TinyFish API
│   ├── tools-insforge/       # guildTool wrapper for InsForge signup + REST
│   ├── tools-ghost/          # guildTool wrapper for Ghost MCP
│   ├── tools-redis/          # RedisVL + AMS client
│   ├── tools-cdp-x402/       # CDP wallet + x402 middleware
│   └── pcc-bridge/           # calls PCC endpoints (agent-package, a2a, escrow)
├── apps/
│   ├── web/                  # chat UI (Next.js, minimal)
│   ├── mcp/                  # MCP server for Claude Desktop demo
│   └── agent/                # dev server + entrypoint for Guild deploy
├── public/
│   └── cited.md              # auto-generated evidence log
├── docs/
│   ├── PLAN-V2.md            # this file
│   ├── DEMO-SCRIPT.md        # stage script
│   └── SUBMISSIONS.md        # per-track submission copy
├── fixtures/
│   └── oakland-titanium-mills/  # fake-enterprise website we scrape on stage
├── Dockerfile                # cgr.dev/chainguard/node
└── .npmrc                    # Chainguard Libraries
```

## 7. Credentials and ACTIVE BLOCKERS

Need from user before we can fully execute:

| Blocker | Urgency | Resolution |
|---|---|---|
| **Google Docs write access** | MED | User runs `/mcp` and authenticates "claude.ai Google Drive" — 30 seconds |
| **Guild CLI auth** | HIGH | `guild auth login --no-browser` needs user to click a URL |
| **CDP API keys** | HIGH | User creates at portal.cdp.coinbase.com (5-min signup, free) → `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` |
| **Redis Cloud URL** | HIGH | User signs up at cloud.redis.io free tier (30MB) → `REDIS_URL` |
| **TinyFish API key** | HIGH | User signs up at tinyfish.ai (500 credits/mo free) → `TINYFISH_API_KEY` |
| **Chainguard org** | MED | User creates at console.chainguard.dev → `chainctl auth pull-token` |
| **cited.md strategy** | CRITICAL | **Decision needed** — Senso charges $2.5K/mo to publish. Options: (a) treat cited.md as a *file convention* (write to `./public/cited.md` served via GitHub Pages), (b) reach Senso devrel at the event, (c) skip and bet on other integrations. **We recommend (a)**. |
| **InsForge** | — | No credential needed; signup via tool call |
| **Ghost** | MED | GitHub OAuth via `ghost login` — user opens URL |

## 8. Questions for the team

1. **Scope confirmation**: do we stay standalone or merge into `physical-capability-cloud/packages/agent-operator-enterprise/`? (Recommend standalone for the 4-hour window.)
2. **cited.md**: OK with (a) file-convention approach?
3. **Voice (Vapi)**: worth adding for the demo, or cut? (Recommend CUT — time pressure.)
4. **Ghost integration depth**: just enough for judge-checkbox, or fully fork per capture? (Recommend: fork per capture since it's the winning demo moment.)

## 9. Parallel-work allocation (for the team)

- **Backend person A**: `packages/tools-insforge` + `packages/tools-redis`
- **Backend person B**: `packages/tools-tinyfish` + `packages/tools-ghost`
- **Backend person C**: `packages/tools-cdp-x402` + `packages/pcc-bridge`
- **Backend person D**: `packages/agent-core` (Guild agent + prompt)
- **UI person**: `apps/web` (chat UI)
- **Demo person**: `fixtures/oakland-titanium-mills/` website + `docs/DEMO-SCRIPT.md` + slides
- **Submission person**: `docs/SUBMISSIONS.md` (1 paragraph per track) + cited.md content

## 10. Submission checklist

- [ ] Devpost/event-form submission for each of 6 targeted tracks
- [ ] Public repo (push to github)
- [ ] Live demo URL (Vercel / Railway)
- [ ] Listing on agentic.market
- [ ] Guild agent published
- [ ] cited.md served from GitHub Pages
- [ ] 3-minute demo video (record as backup)
- [ ] One-paragraph summary + sponsor tags per submission form

---

*Agent bravo (Guild deep-dive) still running; v3 of the plan will fold in exact Guild CLI command chain once its report lands.*
