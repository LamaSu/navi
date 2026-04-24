# Enterprise-Operator Agent for PCC
### Ship to Prod AI Hackathon · 2026-04-24 · SF

*Paste this into the shared Google Doc (docs.google.com/document/d/1VpQx75Z-qEGOwF77BpdpseoC1Yt9AMcEeP1nl1Lyxio).*

---

## TL;DR

We're building a **meta-agent** — an agent that helps enterprises (machining, fleets, labs, warehouses) **build their own PCC agent** from a single chat or phone call. Discovers their databases / SOPs / MOPs / APIs, ingests structured + unstructured data, generates a custom agent that speaks PCC's a2a protocol, wires it to x402 escrow on Base Sepolia, and publishes it on Guild + agentic.market. Five minutes instead of two weeks.

## Event reality

- **11 sponsors**: AWS, WunderGraph, Ghost (Tiger Data), Nexla, Redis, Akash, TinyFish, Chainguard, Vapi, InsForge, Guild.ai
- **$45K+ prize pool** · Guild has confirmed **$1K cash**
- **25+ judges** including Bryce Heltzel (Guild), Homer Wang (TinyFish), Marie Owens + Aditi Gupta (Redis), Hang H. + Tony Chang (InsForge), Brad Bock (Chainguard), Dev Seth + Eva Zheng (Vapi), Mihir + Abhijit (Nexla)
- **Clock**: submit 4:30 PM · demos 5 PM · awards 7 PM

## Tracks we're targeting (8)

| Sponsor | How our agent earns the track |
|---|---|
| **Guild** | Meta-agent IS a Guild llmAgent, wraps our backend via OpenAPI custom integration, published to Agent Hub |
| **Nexla** | Connects enterprise data sources (ERP/CMMS/SharePoint/Salesforce/CSV) via Nexla's 550+ connectors |
| **InsForge** | /agents/v1/signup in 60s → full Postgres backend for the enterprise in one tool call |
| **Ghost (Tiger Data)** | ghost_fork per-enterprise verifier Postgres, pgvectorscale hybrid search over SOPs/MOPs |
| **Redis** | RedisVL capability vector index + Agent Memory Server + a2a-redis Streams for the PCC bus |
| **TinyFish** | We **register our recipe** (pcc-enterprise-onboarder) on the TinyFish cookbook — our agent becomes a discoverable TinyFish web agent |
| **Chainguard** | cgr.dev/chainguard/node base image + .npmrc Libraries entitlement + cgstart skill installed in our repo |
| **Vapi** | Voice onboarding — pointman dials a number, Vapi assistant runs the discovery interview, hands off to our backend |
| **Context Engineering (meta)** | x402 middleware on `/jobs` endpoint + CDP wallet + listing on agentic.market |

## Architecture

```
POINTMAN (chat web OR Vapi phone call)
    ↓
META-AGENT (Guild-hosted llmAgent)
    ↓
BACKEND (Express, cgr.dev/chainguard/node, x402 on /jobs)
    ↓
  ┌────────────┬────────────┬───────────┬──────────┬────────────┐
  ↓            ↓            ↓           ↓          ↓            ↓
 NEXLA      INSFORGE      GHOST       REDIS     CDP + x402    PCC
 connect    project       fork db     vectors   wallet         a2a
 data       tables        + BM25      + memory  + listing      + escrow
            + REST        + vector    + a2a     agentic.mkt    capability.network
            from SQL                  streams
```

## Deliverables at 4:30 PM

- [ ] Public GitHub repo (shiptoprod-agent)
- [ ] Live demo URL (Vercel or Railway)
- [ ] Guild agent published (agent hub link)
- [ ] Listing on api.agentic.market/v1/services
- [ ] TinyFish cookbook PR or recipe URL
- [ ] 3-min demo video (screencast backup in case the live demo snags)
- [ ] Devpost entries for each targeted track (one paragraph + links each)

## Team split (5-6 people, 2-3 hours)

| Dev | Tasks (from INTEGRATION-TASKS.md) | Rough time |
|---|---|---|
| 1 — Backend lead | A1 Express · A3 InsForge · A7 PCC bridge | 85 min |
| 2 — Memory / DB | A4 Ghost · A5 Redis · B1 discovery SM · B2 codegen | 105 min |
| 3 — Web3 / payments | A6 CDP+x402 · B3 deploy · C1-C4 Guild · F2 chainguard libs | 90 min |
| 4 — Voice | D1-D4 Vapi assistant + webhook + demo | 65 min |
| 5 — Demo + submission | G1 fixture · G2 script · G3 subs · F1 Dockerfile · F3 cgstart skill | 90 min |
| 6 — Sponsor publishing | A2 Nexla wrapper · A2b TinyFish recipe · agentic.market listing | 80 min |

## What we need from you (team)

### Credentials (~15 min total across the team)
- **Nexla**: nexla.com → 15-day free trial → `NEXLA_API_KEY` (Dev 6 claims)
- **TinyFish**: tinyfish.ai → 500 cr/mo free → `TINYFISH_API_KEY` (Dev 6 claims)
- **Redis Cloud**: cloud.redis.io → 30 MB free → `REDIS_URL` (Dev 2 claims)
- **CDP**: portal.cdp.coinbase.com → `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` (Dev 3 claims)
- **Guild**: `guild auth login --no-browser` on the hackathon machine, click the URL (Dev 3)
- **Vapi**: vapi.ai → `VAPI_API_KEY` + phone number (Dev 4)
- **Chainguard**: console.chainguard.dev → `chainctl auth pull-token --repository=javascript --ttl=720h` (Dev 3)

InsForge + Ghost don't need pre-baked keys — they're obtained at runtime by the onboarding agent.

### Decisions (please ack in the doc)
1. Standalone `shiptoprod-agent` repo now, merge into `physical-capability-cloud/packages/agent-operator-enterprise/` post-hackathon? **Recommend yes.**
2. Drop cited.md publishing requirement (Senso charges $2.5K/mo)? **Recommend yes** — monetization story lands via x402 + agentic.market anyway.
3. Demo order: Vapi phone call → then Guild chat → then dashboard? **Recommend yes.**
4. Fixture enterprise = "Oakland Titanium Mills" (HTML at `fixtures/oakland-titanium-mills/index.html`)? **Already built.**

## Links

- Repo: `C:\Users\globa\shiptoprod-agent\` (push to github after team confirms)
- Plan history: `docs/PLAN-V1.md` → `PLAN-V2.md` → `PLAN-V3.md`
- Integration tasks: `docs/INTEGRATION-TASKS.md`
- Research findings: `ai/research/01-luma-shiptoprod.md` through `09-tinyfish-publish.md`
- Dashboard: http://localhost:3457

---

*Orchestrator: Claude Opus 4.7 via /go pipeline. Auto-generated at 2026-04-24 14:00 PDT. Team edits welcome.*
