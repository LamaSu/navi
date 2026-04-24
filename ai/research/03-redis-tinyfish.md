# Redis + TinyFish Research — scout-charlie
Started: 2026-04-24

OUTPUT_FILE: C:\Users\globa\shiptoprod-agent\ai\research\03-redis-tinyfish.md

---

## chrome-tokens cloud.redis.io — 2026-04-24
No tokens found. We do NOT have a Redis Cloud account authenticated in Chrome. Need to sign up at https://redis.io/try-free/ manually or on a registration flow.

---

## https://redis.io/ai-incubator/ — 2026-04-24
The page is the Redis AI Incubator landing page. It is a tool/project catalog, NOT a hackathon application page. No prize money, deadline, or explicit "track eligibility" on this URL. Instead it showcases 16 Redis-built or Redis-endorsed AI projects:

**Production-Ready:**
1. **RedisVL** — Python/Java vector DB client library. Primary vector-search SDK.
2. **Redis MCP server** (https://github.com/redis/mcp-redis) — Natural-language interface to Redis for agentic apps. Exposes strings/hashes/lists/sets/zsets/pubsub/streams/json/vector/docs as MCP tools.
3. **Redis Agent Skills** (https://github.com/redis/agent-skills) — Claude Code skill pack for building Redis apps.
4. **Redis Agent Memory** = agent-memory-server (https://github.com/redis/agent-memory-server) — REST + MCP memory service, working + long-term memory, semantic search, LangChain compatible.
5. **langgraph-redis** — Redis checkpointers/stores for LangGraph (short-term state + long-term memory + RAG).

**Experimental:**
6. Redis agent filesystem — filesystem-in-Redis-hashes.
7. redisctl — unified CLI for Redis Cloud/Enterprise.
8. redisctl MCP — MCP server wrapping redisctl for infra management.
9. **a2a-redis** (https://github.com/redis-developer/a2a-redis) — Redis task store + Streams/PubSub queues for A2A (Agent-to-Agent) Python SDK.
10. adk-redis — Redis + Google ADK integration.
11. claude-mcp-redis — Example wiring Claude Agents SDK to Redis memory+retrieval.
12. Microsoft Agent Framework Redis package.

**Reference agents:**
13. context-engine-demos — agentic chat with Redis context retriever + checkpointing + memory.
14. redis-ai-resources (https://github.com/redis-developer/redis-ai-resources) — curated awesome list.
15. redis-sre-agent — LangGraph-based Redis SRE triage agent.
16. redis-slack-worker-agent — production-ish Slack worker using Agent Kit + AMS + LangGraph.

---

## https://redis.io/docs/latest/develop/ai/ — 2026-04-24
Core AI features listed:
- **Vector Search** — FLAT + HNSW index, KNN + range + metadata filters.
- **Semantic Cache** — store + retrieve semantically-similar LLM responses.
- **LangCache** — managed semantic caching service (70% cost reduction, 15x faster on cache hits).
- **Vector DB** — vectors in hashes or JSON docs.
- **Agent Memory** — short + long-term memory for LLMs.
- **RAG** — retrieval-augmented generation via RediSearch + RedisVL.

**Clients:**
- Python: `redis-py`, `redisvl`
- Node: `node-redis`
- Java: `Jedis` / `redis-vl-java`
- Go: `go-redis`
- .NET: `NRedisStack`

**Framework integrations:** LangChain, LangGraph, LlamaIndex, Amazon Bedrock, NVIDIA NIM/Merlin, Microsoft Semantic Kernel, Vertex AI, Google ADK, Claude Agents SDK, Microsoft Agent Framework.

---

## Redis Hackathon history — 2026-04-24
The "Build on Redis" hackathon (2021) awarded $100K across 52 prizes with a single **must-use-at-least-one-Redis-module** eligibility rule. Winners clustered on multi-module complexity (60%+ used 2+ modules). Top patterns: real-time tracking, event streaming, advanced search (RediSearch 4-100x faster than ES), graph queries, geospatial. More recent "Redis AI Challenge" ran on dev.to with $3,000 pool. **The current AI Incubator itself does not appear to be a fixed-prize hackathon** — it's Redis's early-access developer program for AI tools. The "Feature Form" link may collect applications for a separate event.

**Implication for us:** to "win" the Redis track at the hackathon we're competing in, we need to show multi-feature usage (e.g., RedisVL vector search + Streams for a2a + LangCache semantic caching + Agent Memory Server for session state). Redis loves production-grade, multi-module demos.

---

## Redis Agent Memory Server (AMS) — 2026-04-24
- REST API + MCP server + Python SDK (`pip install agent-memory-client`).
- **Two-tier memory:** Working memory (session-scoped, messages + structured data + summaries), Long-term memory (persistent, semantic + keyword + hybrid search, auto topic extraction + entity recognition + dedup).
- Auto-converts memory tools → LangChain-compatible @tools.
- Provider config via env: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, AWS Bedrock.
- Docker compose for quickest start: `docker compose up api redis`.

---

## https://docs.tinyfish.ai/ — 2026-04-24
TinyFish is **enterprise web-agent infrastructure** — four products under one API key:

| Endpoint | Base URL | Purpose | Speed |
|---|---|---|---|
| **Agent** | `https://agent.tinyfish.ai/v1/automation/run` `/run-async` `/run-sse` | Natural-language goal + URL → structured JSON. Navigates, clicks, fills, extracts. | ~10s to minutes |
| **Search** | `https://api.search.tinyfish.ai` (GET) | Google-like indexed search. | <1s |
| **Fetch** | `https://api.fetch.tinyfish.ai` (POST) | URL → clean Markdown/JSON/HTML. | few seconds |
| **Browser** | `https://api.browser.tinyfish.ai` (POST) | Remote stealth Chromium with CDP WebSocket for Playwright/Puppeteer. | real-time |

**Auth:** `X-API-Key` header. Keys at https://agent.tinyfish.ai/api-keys.

**MCP server:** `https://agent.tinyfish.ai/mcp` — drop-in for Claude Desktop / Cursor / Claude Code. Install via `claude mcp add --transport http tinyfish https://agent.tinyfish.ai/mcp` (OAuth).

**CLI:** `npm install -g @tiny-fish/cli` → `tinyfish auth login` → `tinyfish agent run --url X "goal"`.

---

## https://www.tinyfish.ai/ — 2026-04-24
Positioning: "enterprise infrastructure for AI web agents." Customers named: Google, DoorDash, Amazon, Grubhub.
- **Benchmarks:** 89.9% Mind2Web accuracy. <250ms cold starts. 85% anti-bot pass rate.
- **Pricing:** 100 tasks/month for $1.50 on Basic (vs ~$240 for competing stacks). Free tier: **500 credits/month, no credit card**.
- **Semantic element finding** (replaces brittle CSS selectors) — "one API key, one credit pool, zero routing code."
- **Concurrency:** up to 50 parallel agents on Pro.

---

## https://www.hackerearth.com/challenges/hackathon/the-tiny-fish-hackathon-2026/ — 2026-04-24
**TinyFish $2M Pre-Accelerator Hackathon** (prototype phase Feb 25 – Mar 29, 2026). **This already ended** before our event. Prizes: $2500 / $1500 / $1000 + Golden Ticket to Accelerator Phase 2.

However, TinyFish is actively sponsoring other events (LotusHacks Vietnam winners listed). Our hackathon is one of those sponsorships — **track-winning criterion**: "Best Use of TinyFish API" with prizes like Mac Minis + Accelerator entry. Must demonstrate mandatory **use of the TinyFish Web Agent API** on a real multi-step workflow that genuinely needs browser infrastructure.

---

## TinyFish vs Browser Use (cloud vs local agents) — 2026-04-24
- **Browser Use** = Python framework you orchestrate yourself. ~$0.002/step but needs your own infra.
- **TinyFish** = managed SaaS. $0.012-0.015/step but includes LLM reasoning + proxy rotation + anti-bot + output formatting. Time-to-prod in minutes, not days.
- **Differentiator:** bundled residential proxies + stealth + managed LLM + 50 parallel + auto-reconfig-on-block — none of which you get from Playwright, camoufox, or Browserbase. **For a hackathon where demo reliability matters, TinyFish removes an entire failure surface.**

---

## TinyFish Cookbook patterns — 2026-04-24
Clone at `C:\Users\globa\shiptoprod-agent\research-clones\tinyfish-cookbook\`. ~30 recipes + 17 skills + n8n workflows.

**Call pattern (most common, from `competitor-scout-cli/lib/tinyfish.ts`):**
```typescript
POST https://agent.tinyfish.ai/v1/automation/run-async
Headers: X-API-Key: $TINYFISH_API_KEY, Content-Type: application/json
Body: { url: "...", goal: "natural language goal, specify JSON shape" }
→ returns { run_id }
Then poll GET https://agent.tinyfish.ai/v1/runs/{run_id} for { status, result }
```

**SSE variant (from `bestbet/app/webagent.ts`):**
```typescript
POST https://agent.tinyfish.ai/v1/automation/run-sse
→ stream data: lines. Final event type=="COMPLETE", data in resultJson.
```

**Top 5 cookbook patterns:**
1. **Parallel price comparison** (viet-bike-scout, game-buying-guide, openbox-deals, lego-hunter) — fire N `tinyfish agent run` calls to N retailer sites in parallel, merge into one dashboard.
2. **Discovery then extraction** (concept-discovery-system, competitor-scout-cli) — search → agent chain: TinyFish search finds URLs, agent extracts structured data.
3. **Research + enrichment** (research-sentry, stay-scout-hub) — fetch clean markdown from N sources, LLM synthesizes.
4. **Form filling for decision copilots** (loan-decision-copilot, scholarship-finder, tenders-finder) — agent fills applicant-data forms on third-party portals.
5. **Scheduled / recurring ingestion** (n8n workflows: Daily Product Hunt Tracker, Competitor Scout, Web Research Agent) — cron-triggered TinyFish runs → database/Notion/Telegram.

**CLI skill (`plugins/tinyfish/skills/use-tinyfish/SKILL.md`):** teaches search→fetch→agent→browser escalation order. Tunneling skill (`tunneling/SKILL.md`) exposes `tinyfi.sh` SSH tunnel for localhost→public HTTPS (free, no signup).

---

## SUMMARY — scout-charlie

### Redis AI Incubator
**One-paragraph:** Redis pitches itself in 2026 as the "real-time context engine for AI" — an in-memory data plane covering vector DB (RedisVL), semantic cache (LangCache), agent memory (Agent Memory Server REST+MCP), A2A coordination (streams + pubsub), and LangGraph checkpointing. The "AI Incubator" is its early-access developer program with 16 tools/repos — not a standalone hackathon. To win a Redis track we should showcase **multi-feature Redis usage in a production-grade, agentic workflow**, not a basic cache.

**Three features we'll use:**
1. **Agent Memory Server (AMS)** — drop in via Docker + Python SDK for short-term session + long-term semantic memory of every enterprise-operator run. Gives Redis their "agent memory" story AND we get real memory for free.
2. **Redis Streams + a2a-redis** — event log of every agent action (goal → fetch → plan → execute → verify), plus task queue between orchestrator and worker agents. Track-winning because it uses 2+ modules AND solves a real multi-agent problem.
3. **LangCache / Semantic Cache** — cache repeated enterprise queries ("what's the SLA for acct X") with 70% cost + 15x latency wins. Demoable metric.

**Track-winning angle:** "The Enterprise-Operator Agent uses Redis as its entire runtime context engine — memory + a2a + cache + vector retrieval — so adding a new operator takes minutes, not days." Sub-second demo. Show Redis dashboard live.

### TinyFish
**One-paragraph:** TinyFish is a managed cloud web-agent platform — four endpoints (agent, search, fetch, browser) under one API key, semantic-element-finding (no brittle selectors), built-in stealth + proxies + 50-parallel. Used by Google / DoorDash / Amazon. Free tier = 500 credits/month, no card. The hackathon track rewards a **real multi-step workflow that genuinely needs browser infrastructure**.

**Three features we'll use:**
1. **`agent run` with JSON-shaped goals** — the enterprise-operator's core: give it a supplier/partner URL + "extract risk signals as {...}", returns structured JSON ready for ingestion. 1 line of code per new data source.
2. **Parallel batch runs** (`tinyfish agent batch run --input runs.csv`) — hit 50 supplier/competitor URLs at once. Demo number: "we monitored 5,000 vendors in 10 minutes."
3. **`browser session create` with CDP** — escalate to full Playwright when agent isn't enough. Lets us show **progressive enhancement** to judges: same product handles easy sites cheaply AND hardcore flows reliably.

**Track-winning angle:** "Enterprise-Operator replaces 4 internal scraping stacks with one API. Zero CSS selector maintenance. Every supplier monitored in parallel. Real business outcome demoed live on 10 real vendor sites in 60 seconds."

### How both combine
**Redis = memory layer. TinyFish = action layer.**
- Orchestrator Claude agent receives "monitor vendor X" → queries AMS (Redis) for last-known state → if stale, fires TinyFish `agent run` on vendor site → writes new snapshot to Redis as long-term memory + publishes event to Redis Stream → A2A (Redis pubsub) notifies dependent sub-agents → LangCache prevents re-running identical goals. One demo flows through **both sponsors in a single user story**, checking the "multi-sponsor integration" box judges love.

### Unknowns / credential gaps
- **TinyFish API key** — need to sign up at `https://agent.tinyfish.ai/api-keys` (free tier: 500 credits/month, no card). Set as `TINYFISH_API_KEY` env.
- **Redis Cloud account** — need to sign up at `https://redis.io/try-free/` (30 MB free per the user's screenshot). No Chrome tokens exist yet. Get `REDIS_URL` or `REDIS_HOST/PORT/PASSWORD` env after signup.
- **AMS deployment target** — decide: local Docker on laptop vs Spark vs Railway. Spark probably best (119 GB RAM, no OOM risk).
- **Hackathon track name + rubric** — need to confirm exact "Redis AI Incubator" track criteria and "Best Use of TinyFish API" judging rubric for our specific event (not the HackerEarth one which ended).
- **No TinyFish MCP URL configured** yet in our `.mcp.json` — one-liner to add: `claude mcp add --transport http tinyfish https://agent.tinyfish.ai/mcp`.

End of research — scout-charlie
