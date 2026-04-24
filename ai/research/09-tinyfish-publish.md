# TinyFish — Registering Our Agent as a Web Agent

**Agent:** scout-india
**Date:** 2026-04-24
**Task:** Determine EXACT path to register PCC-onboarding agent on TinyFish's platform.

## TL;DR (verdict)

**(a) Cookbook PR is THE path.** No `publish`/`register` CLI command exists.
No Agent Directory on tinyfish.ai. MCP server exposes TinyFish's 4 endpoints
(agent/search/fetch/browser) as tools for callers — not a registry where
third parties mount agents.

Secondary reinforcement paths exist (MCP registry for our own server, X/Discord
visibility, hackathon social-sharing loop) — none are "registration" in the
traditional sense.

## Evidence

### Source 1 — docs.tinyfish.ai indexed pages
Fetched https://docs.tinyfish.ai and https://docs.tinyfish.ai/llms.txt.
Documented pages: Quick Start, Auth, Agent API, Automation endpoints, Run
management, Browser/Session APIs, Fetch API, Search API, Vault, Integrations
(Dify, n8n, MCP), CLI, Coding-agent context. **NO publish/register/deploy/
marketplace/directory pages exist.** Docs are strictly about *using* TinyFish,
not publishing on it.

### Source 2 — @tiny-fish/cli (docs.tinyfish.ai/cli)
Full command list:
- `tinyfish auth login` / `set` / `status`
- `tinyfish agent run --url ... --task "..."`
- `tinyfish --version`
- Global flag: `--pretty`

**No `tinyfish publish`, `tinyfish deploy`, `tinyfish agent create`, or
`tinyfish submit` commands exist.**

### Source 3 — tinyfish.ai homepage
Nav/CTAs: "Deploy an agent" / "Try Web Agent" / "View docs" / "Accelerator" /
"Integrations" (MCP Registry, n8n, Vercel, Python SDK). Entry is
`agent.tinyfish.ai/sign-up` → playground + API keys. **Nothing about
"submit your agent" or "agent marketplace."**

### Source 4 — Cookbook CONTRIBUTING.md (the actual path)
Path: https://github.com/tinyfish-io/tinyfish-cookbook + `CONTRIBUTING.md`.
Flow:
1. Fork `tinyfish-io/TinyFish-cookbook`
2. Clone fork, branch `git checkout -b globa/pcc-enterprise-onboarder`
3. Create folder at repo root: `pcc-enterprise-onboarder/`
4. Ship a working app that **calls** the TinyFish API (`agent.tinyfish.ai/v1/automation/run-sse`)
5. Required `README.md` sections (exact, enumerated in CONTRIBUTING.md):
   1. Title
   2. Live link (Vercel recommended — 4 featured recipes are all Vercel)
   3. 2-3 liner (what app is + where TinyFish API is used)
   4. Demo video/gif
   5. Code snippet calling TinyFish API
   6. How to Run (env vars declared)
   7. Architecture diagram (Mermaid preferred — see `silicon-signal/README.md`)
6. Push to fork, open PR to `main`
7. TinyFish engineers review, test, merge
8. If merged + live-link works + good README → PR may earn "Featured Recipe"
   promotion (table at top of cookbook README). Currently 4 featured:
   viet-bike-scout, tutor-finder, openbox-deals, summer-school-finder.

### Source 5 — MCP server `https://agent.tinyfish.ai/mcp`
Exposes TinyFish's 4 endpoints AS MCP tools. Callers use these tools, they
don't register new agents with them. (Per PulseMCP listing + docs/mcp-integration.)
**Not a registration mechanism.**

### Source 6 — TinyFish Accelerator (closed)
https://www.tinyfish.ai/accelerator. 9-week + $2M seed pool program with
Mango Capital. **Applications closed 2026-04-02.** Contact: accelerator@tinyfish.ai.
Irrelevant for Apr 24 hackathon timeline.

### Source 7 — MCP Registry (tangential reinforcement)
https://registry.modelcontextprotocol.io/. Public registry where ANY MCP
server can be published. We could publish `pcc-agent-mcp` here — doesn't
register us with TinyFish, but puts us in the same directory TinyFish
themselves use. Judge-visibility play.

### Source 8 — SG Hackathon precedent
TinyFish ran a Singapore hackathon (sg-hackathon.tinyfish.ai + luma 4n1e9si9).
Pattern: builders ship a cookbook recipe + post on X/LinkedIn = eligible.
Ship-before-you-pitch ethos is the TinyFish signature.

### Source 9 — Ship to Prod event (Homer Wang judging)
https://luma.com/shiptoprod + https://trymimetic.com/events/sf/ship-to-prod-agentic-engineering-hackathon-apr-2026.
Homer Wang = Head of Product @ TinyFish = judge. Submission deadline 4:30 PM
Apr 24. Prize pool $45k+. **If we want the "TinyFish prize," the cookbook PR +
live demo + social post is the canonical flow Homer Wang knows to evaluate.**

## Registration Path (definitive)

### PATH A — Cookbook PR (recommended; highest judge-appeal)

```bash
# 1. Fork
gh repo fork tinyfish-io/tinyfish-cookbook --clone
cd tinyfish-cookbook

# 2. Branch
git checkout -b globa/pcc-enterprise-onboarder

# 3. Scaffold — follow silicon-signal's Next.js pattern (closest match
#    to a B2B/enterprise workflow)
mkdir pcc-enterprise-onboarder
cd pcc-enterprise-onboarder
npm create next-app@latest . -- --typescript --tailwind --eslint --app

# 4. Implement
#    - Call agent.tinyfish.ai/v1/automation/run-sse to scrape target
#      company's public signals (press releases, product pages, SEC filings,
#      partner lists) with goal="Identify Physical Capability needs — robotic
#      systems, manufacturing automation, logistics bottlenecks"
#    - Feed extracted JSON into PCC's enterprise-onboarding workflow
#      (capability.network /onboard flow)
#    - Output: pre-filled PCC kernel registration form + recommended
#      MilestoneEscrow terms

# 5. Deploy live demo
vercel deploy --prod
# → https://cookbook-pcc-onboarder.vercel.app

# 6. Write README.md with ALL 7 required sections
# 7. Push + PR
git push -u origin globa/pcc-enterprise-onboarder
gh pr create --repo tinyfish-io/tinyfish-cookbook \
  --title "pcc-enterprise-onboarder: Auto-scout enterprise PCC buyers" \
  --body "..."
```

**Recipe file structure** (mirror silicon-signal — closest match):
```
pcc-enterprise-onboarder/
├── README.md              # 7-section template (Title, Live link, 2-3 liner,
│                          #   Demo, Code snippet, Run, Architecture)
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── public/
│   └── demo.gif           # Required: demo video/gif
├── screenshot.png         # Architecture diagram source
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── scout/route.ts      # Calls TinyFish run-sse per company
    │   │   └── onboard/route.ts    # Posts to capability.network /onboard
    │   └── page.tsx                # UI: enter company name → scout → onboard
    ├── components/
    │   └── scout-card.tsx
    └── lib/
        ├── tinyfish.ts             # Wrapper for run-sse (SSE parsing)
        └── pcc.ts                  # PCC capability.network client
```

### PATH B — MCP Registry (parallel; protocol-level visibility)

Not TinyFish-specific, but TinyFish's own MCP server lives in this same
registry. Publish `pcc-agent-mcp` exposing our capability discovery + kernel
registration + milestone settlement as MCP tools.

```bash
# Fork modelcontextprotocol/registry, submit server.json
# Server published at: registry.modelcontextprotocol.io/servers/pcc-agent-mcp
```

Benefits: Homer Wang + Cursor/Claude users can discover PCC alongside TinyFish.
Doesn't count as "registering with TinyFish" but fills the same functional
role for MCP-native consumers.

### PATH C — Accelerator email (closed, but Homer knows us post-hackathon)

Post-hackathon, email `accelerator@tinyfish.ai` with the cookbook PR link +
Vercel demo. Applications for next cohort may reopen.

## Token / credential needs

- `TINYFISH_API_KEY` — sign up `agent.tinyfish.ai/sign-up`, 500 free credits.
  Store in Vercel env + `.env.local`. Auth header: `X-API-Key: $TINYFISH_API_KEY`.
- `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY` — for our LLM synthesis step
  (several cookbook recipes use OpenRouter — tinyskills, scholarship-finder).
- `PCC_API_KEY` — capability.network — for the onboarding handoff.
- Vercel account — for the live-demo link (non-negotiable; 4/4 featured
  recipes are Vercel-hosted).
- GitHub account — for the PR. Globa is `globalmysterysnailrevolution` —
  SUSPENDED. Use LamaSu remote equivalent, or personal fork branded "LamaSu."

## Judge-appeal — what makes Homer Wang click "cool"

1. **Real B2B workflow, not a toy.** Cookbook is 80% consumer
   (anime/wings/LEGOs/loans). "pcc-enterprise-onboarder" = first enterprise
   SaaS pattern — rare air, stands out.
2. **Recursive: agent calls agent.** PCC is a capability network. Using
   TinyFish's agent to discover enterprise PCC *buyers* then handing them to
   PCC's onboarding = two agent systems composed. Demonstrates the "agents
   calling agents" thesis Homer tweets about.
3. **Tangible outcome on-chain.** End of flow = a real MilestoneEscrow on
   Base Sepolia (0xAaB3F94f...A66 registry). Not just JSON — a settled
   transaction. The only cookbook recipe with on-chain primitives.
4. **Parallel scraping pattern.** Match silicon-signal's Mermaid sequence
   diagram — parallel TinyFish agents for 5-10 targets simultaneously. Homer
   has tweeted about "parallel agent" being the TinyFish signature.
5. **Live demo works during judging.** 4:30 PM submission → 5 PM judging →
   demo must run. Use Vercel preview URL + fallback to recorded video.
6. **Link to capability.network with Sentry-monitored runs** so a judge can
   click and see real telemetry.

## Fallback if cookbook PR doesn't merge in time

Ship the Vercel live demo + public GitHub fork anyway. Homer can inspect the
fork, run the `npm install && npm run dev` path, hit the live URL. PR merge is
stamp-of-approval, not prerequisite for judging.

## SUMMARY (≤250 words)

**Registration path: NONE EXISTS** in the "submit agent to marketplace" sense.
No `tinyfish publish`. No Agent Directory. MCP server exposes TinyFish's
endpoints, not a registry for third parties.

**Real path: Cookbook PR** to `tinyfish-io/tinyfish-cookbook`. Fork → add
`pcc-enterprise-onboarder/` folder → working app that calls
`agent.tinyfish.ai/v1/automation/run-sse` → Vercel live demo → 7-section
README → PR to main. TinyFish engineers review, merge, potentially promote to
"Featured Recipe" top table.

**Commands:**
```bash
gh repo fork tinyfish-io/tinyfish-cookbook --clone
git checkout -b globa/pcc-enterprise-onboarder
# scaffold Next.js (mirror silicon-signal), call run-sse, deploy Vercel
gh pr create --repo tinyfish-io/tinyfish-cookbook
```

**Credentials:** `TINYFISH_API_KEY` (500 free, agent.tinyfish.ai/sign-up),
`OPENROUTER_API_KEY` (synthesis), `PCC_API_KEY` (handoff), Vercel account.

**Judge-appeal for Homer Wang:**
1. First enterprise B2B recipe in a consumer-heavy cookbook.
2. Agents-calling-agents: TinyFish scout → PCC onboarder composition.
3. On-chain settlement endpoint (MilestoneEscrow on Base Sepolia) — only
   recipe with on-chain primitives.
4. Parallel scraping (5-10 enterprises) — matches TinyFish's signature pattern.
5. Live Vercel demo running during 5 PM judging slot.

**Parallel play:** Also publish `pcc-agent-mcp` to
`registry.modelcontextprotocol.io` — TinyFish's own MCP server lives there.
Not a TinyFish registration but puts PCC in the same discovery surface
Homer's users use.
