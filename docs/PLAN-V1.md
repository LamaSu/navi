# Enterprise-Operator Agent for PCC — Hackathon Plan v1

**Author:** orchestrator (Claude Code /go pipeline)
**Date:** 2026-04-24 (Ship to Prod AI Hackathon)
**Status:** DRAFT — 4/7 research streams complete, 3 still running (luma event page, Guild, PCC internal)
**Target:** win Context Engineering Challenge + Guild $1K + Redis AI Incubator + TinyFish + InsForge + Ghost (Tiger Data) + Chainguard tracks

---

## 1. Problem we're solving

An enterprise with real-world capabilities (machine shop with 5-axis mills, fleet company with EV vans, lab with autoclaves, warehouse with forklifts) has **no 5-minute path** to go live on the Physical Capability Cloud (PCC). Today you'd need to: stand up an operator kernel, write an a2a agent, price jobs in x402, wire escrow to Base Sepolia, declare capabilities with ALCOA+ evidence, register with agent-package, stay online for discovery.

That's a 2-week integration for a team of 3. We're building an **Enterprise-Operator Agent** that compresses it to **one chat session with one pointman** (the person at the enterprise who actually operates the equipment).

## 2. How the pointman experiences it

```
[pointman] "we run a 5-axis mill in Oakland, titanium specialty"
[agent]    reads the enterprise website via TinyFish → drafts capability manifest
[agent]    "is 48 hr standard turnaround right? $350/hr billed?"
[pointman] "yes, but only 4 x 4 x 6 in max part"
[agent]    updates manifest → creates InsForge project → inserts inventory schema
[agent]    creates Ghost fork for verification data + vectorizes capability blurb
[agent]    "I need to mint an agent wallet — use CDP test faucet?" (y/n)
[pointman] "y"
[agent]    CDP createWallet → fund from faucet → register MilestoneEscrow allowlist
[agent]    lists listing on agentic.market as x402 service
[agent]    "you're live. Go to https://enterprise-operator-agent.pcc/ops/<id>"
```

45 real minutes. No JSON editing. No Solidity. No terminal-if-you-don't-want-to.

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  POINTMAN (chat UI — web + CLI + Claude Desktop via our MCP server) │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
       ┌───────────────▼──────────────────────┐
       │  ENTERPRISE-OPERATOR AGENT           │  ← Guild-deployed
       │  (llmAgent + guildTools)             │     (meets $1K track)
       └────┬───────┬────────┬────────┬───────┘
            │       │        │        │
            ▼       ▼        ▼        ▼
    ┌──────────┐ ┌───────┐ ┌────────┐ ┌──────────┐
    │ InsForge │ │ Ghost │ │ Redis  │ │ TinyFish │
    │ (ops DB) │ │ (fork)│ │ (mem+  │ │ (scrape  │
    │ Postgres │ │ pgvec │ │  a2a)  │ │  website)│
    └──────────┘ └───────┘ └────────┘ └──────────┘
            │       │        │        │
            └───┬───┴────┬───┴────┬───┘
                ▼        ▼        ▼
         ┌──────────────────────────────┐
         │  PCC                         │
         │  - agent-package registry    │
         │  - a2a bus + intents         │
         │  - MilestoneEscrow (Base SS) │
         │  - x402 endpoints            │
         │  - CVP (ALCOA+ evidence)     │
         └──────────────────────────────┘
                        │
                        ▼
              ┌────────────────────┐
              │  CDP + agentic.mkt │
              │  (wallet + listing)│
              └────────────────────┘

    All running on: cgr.dev/chainguard/node image + Chainguard Libraries
    Monitored on: http://localhost:3457 (our /go dashboard)
```

## 4. Sponsor integration matrix (how we earn each track)

| Sponsor | Prize | Our Integration | Judges' WOW moment |
|---|---|---|---|
| **Guild AI** | $1K cash | Agent is a Guild `llmAgent` with multi-turn + `guildTools`. We use `guild workspace select`, `guild agent init --template LLM`, ship to marketplace with `--publish`. | A *real* B2B agent — not a "hello world" — shipped through full Guild lifecycle (build → govern → share). |
| **Redis AI Incubator** | Varies | RedisVL vector search over capability manifests + Agent Memory Server (short + long-term) + **a2a-redis Streams** as PCC's agent-to-agent bus. | Three Redis modules wired for one agent. Includes LangCache on hot capability lookups. |
| **TinyFish** | Credits + prize | `agent.tinyfish.ai/v1/automation/run-sse` scrapes enterprise website → extracts capability manifest (equipment names, hours, pricing hints). | Turn any enterprise site with no API into a live, discoverable PCC capability in &lt;2 min. |
| **InsForge** | Credits + prize | `/agents/v1/signup` for instant Postgres backend, then auto-REST the `enterprises`, `machines`, `jobs`, `escrow_events` tables. Model Gateway for LLM routing. | Zero-OAuth onboarding: agent → backend → live REST API in 60s. |
| **Ghost (Tiger Data)** | Credits + prize | `ghost_fork` per-capture verification DB, pgvectorscale hybrid search, `share_token` handoff to PCC's CVP verifier. | Per-capture ephemeral Postgres — capture N gets a forked DB that disappears when verification completes. |
| **Chainguard** | Credits + credit | `cgr.dev/chainguard/node` base image, `.npmrc` Libraries entitlement, **cgstart skill installed in our own agent so it scans its own deps**. Chainguard SBOM fused into PCC evidence. | Agent verifies its OWN supply chain before onboarding an enterprise. Meta. |
| **x402 / CDP / agentic.market** | Context Engineering Challenge | `@x402/express` middleware on our agent's HTTP endpoints, CDP AgentKit for wallet + faucet, listing on `api.agentic.market/v1/services`. | The enterprise gets a real revenue path from minute zero. Coinbase facilitator 1K free tx/mo. |

## 5. Gaps + questions for the team

### Credentials we need
- **Guild** — need `guild auth login --no-browser` completion in user's browser (installed CLI 0.6.0, ready to auth)
- **CDP** — `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` from portal.cdp.coinbase.com (free, 5 min)
- **Redis Cloud** — `REDIS_URL` from cloud.redis.io (30MB free tier)
- **TinyFish** — `TINYFISH_API_KEY` from console (500 credits/mo free)
- **InsForge** — no credential needed for cloud-hosted signup flow
- **Ghost** — GitHub OAuth via `ghost login` or chrome-tokens github.com
- **Chainguard** — free console.chainguard.dev account → `chainctl auth pull-token --repository=javascript --ttl=720h`

### Open strategic questions
1. **cited.md is Senso enterprise ($2.5K/mo)**. The hackathon slide says "publish agent output to cited.md." Options we see:
   - (a) It's a convention — they want us to format output *as if* for cited.md (a `.md` file with citations). We write to a local `cited.md` file in our repo + GitHub Pages.
   - (b) Senso has a hackathon free tier (check with devrel).
   - (c) We skip it and bet on the rest of the Context Engineering bundle.
   - **Recommend:** (a) for now. Every agent action writes a citation to `./public/cited.md`. Pitch: "per the rubric — every AI answer should cite real sources." Needs confirmation.
2. **Additional sponsors** discovered: AWS, WunderGraph, Nexla, Akash (confirmed by scout-delta). We need to decide if we stretch to these or stay lean.
3. **What IS the enterprise-side PCC code today?** Scout-golf still running. Outcome drives whether we drop this into `physical-capability-cloud/apps/enterprise-operator-agent/` or stay standalone.

## 6. Shipping plan (2 build waves)

### Wave A — core agent + backend (priority)
1. `packages/core` — Guild `llmAgent` + tool contracts
2. `packages/tools-tinyfish` — wrap `agent.tinyfish.ai` as `guildTool`
3. `packages/tools-insforge` — wrap `/agents/v1/signup` + auto-REST calls
4. `packages/tools-ghost` — wrap the 20+ Ghost MCP tools
5. `packages/tools-redis` — RedisVL + Agent Memory Server client
6. `packages/tools-cdp-x402` — CDP wallet ops + x402 middleware
7. `apps/agent` — main entry point (Guild-deployable + local dev)

### Wave B — PCC bridge + demo
1. `packages/pcc-bridge` — adapter to PCC's existing agent-package, a2a, MilestoneEscrow
2. `apps/web` — minimal React chat UI (for demo, since Guild marketplace may not be approved in time)
3. `apps/mcp` — MCP server exposing agent tools for Claude Desktop demo
4. `fixtures/demo-enterprise` — a fake "Oakland Titanium Machining" with website we can scrape
5. `public/cited.md` — published evidence log (auto-generated each agent run)

### Wave C — polish
1. Chainguard base image + Libraries
2. `chainctl` SBOM check in CI
3. Demo script + video
4. Listing on agentic.market

## 7. Metrics (what we say on stage)

- "Every enterprise onboarding touches **7 sponsor integrations** in a single chat."
- "Agent spins up a real Postgres backend (InsForge) + a vector DB (Redis) + a forkable verifier DB (Ghost) + a wallet (CDP) in **under 2 minutes**."
- "x402-priced, agentic.market-listed, Chainguard-sealed."
- "All observability in our dashboard at http://localhost:3457."

---

*v1 drafted while 3 research agents still running. v2 will fold in luma event tracks + Guild deep-dive + PCC internal map.*
