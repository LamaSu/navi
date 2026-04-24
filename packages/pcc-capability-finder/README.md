# PCC Enterprise Onboarder

**Turn any enterprise into a live PCC operator in 90 seconds — from chat, phone, or web.**

### Live link
https://pcc-enterprise-onboarder.vercel.app *(deploy target; placeholder until domain resolved)*

### What this app is
The **PCC Enterprise Onboarder** is a meta-agent that walks an enterprise (machining shops, fleets, labs, warehouses) through getting live on the Physical Capability Cloud — declaring capabilities, wiring a wallet, locking on-chain escrow, and joining the a2a network. **The TinyFish agent API is the bootstrap layer**: given an enterprise URL, a TinyFish agent run extracts machines, hours, services, and contact details from the enterprise's public site, producing the first draft of their PCC capability manifest. Structured data sources (ERP / CMMS / Salesforce / SharePoint) are then layered in via Nexla; unstructured SOPs/MOPs via Ghost (Tiger Data) + pgvectorscale.

The agent then generates a custom enterprise-agent, deploys it to Guild, registers it with PCC's agent-package, creates a CDP wallet on Base Sepolia, wraps `/jobs` with x402 middleware, and lists on agentic.market. One chat, seven sponsors, one live operator.

### Demo video
*(embed `./assets/demo.mp4` — recorded at 5 PM stage demo, Ship to Prod SF, 2026-04-24)*

### TinyFish API snippet
The core call the cookbook cares about — scraping the enterprise's site to draft a capability manifest:

```ts
// packages/tinyfish-recipe/src/app/api/onboard/route.ts
async function scrapeEnterprise(url: string): Promise<EnterpriseDraft> {
  const res = await fetch("https://agent.tinyfish.ai/v1/automation/run-sse", {
    method: "POST",
    headers: {
      "X-API-Key": process.env.TINYFISH_API_KEY!,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url,
      goal: "Extract the company name, all production/machine equipment with model + kind + size envelope, operating hours, services, certifications, and primary contact email. Return structured JSON matching the EnterpriseDraft schema."
    })
  });

  // Consume the SSE stream — the final event has type==="COMPLETE" with resultJson
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let final: EnterpriseDraft | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value);
    for (const ev of parseSSE(buffer)) {
      if (ev.type === "COMPLETE") final = ev.resultJson as EnterpriseDraft;
    }
  }
  if (!final) throw new Error("no final COMPLETE event");
  return final;
}
```

After the scrape returns, we fan out in parallel — Nexla structured sources, Ghost doc fork, Redis vector index, CDP wallet create, InsForge backend signup — then generate + deploy the enterprise's own agent. See `./src/app/api/onboard/route.ts` for the full flow.

### How to run

```bash
git clone https://github.com/<you>/TinyFish-cookbook.git
cd TinyFish-cookbook/pcc-enterprise-onboarder
cp .env.example .env.local
# edit .env.local — see below
pnpm install
pnpm dev
```

#### Required env vars
```bash
TINYFISH_API_KEY=         # from agent.tinyfish.ai/sign-up (500 free credits/mo)
NEXLA_API_KEY=            # from nexla.com (15-day trial, 5 sources, 1M records/day)
REDIS_URL=                # from cloud.redis.io (30 MB free)
CDP_API_KEY_ID=           # from portal.cdp.coinbase.com
CDP_API_KEY_SECRET=
ANTHROPIC_API_KEY=        # the LLM powering the interview
PCC_AGENT_PACKAGE_URL=https://capability.network/agent-package.json
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000  # the express backend in packages/backend
```

### Architecture

```
┌─────────────────────┐        ┌──────────────────────────────┐
│  POINTMAN           │        │  META-AGENT (Guild llmAgent) │
│  chat / Vapi phone  │◀───────▶                              │
└─────────────────────┘        └──────────┬───────────────────┘
                                          │
                            ┌─────────────┴────────────────┐
                            │  THIS APP — Next.js          │
                            │  onboard/* routes            │
                            └─────────────┬────────────────┘
                                          │
   ┌──────────┬──────────┬──────────┬─────┴────┬──────────┬──────────┐
   ▼          ▼          ▼          ▼          ▼          ▼          ▼
┌───────┐ ┌────────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌──────────┐ ┌─────┐
│TinyFsh│ │ Nexla  │ │InsForge│ │ Ghost │ │ Redis  │ │ CDP+x402 │ │ PCC │
│scrape │ │ connect│ │backend │ │ fork  │ │vectors │ │wallet    │ │a2a  │
│site   │ │ sources│ │Postgres│ │verify │ │memory  │ │market    │ │regst│
└───────┘ └────────┘ └────────┘ └───────┘ └────────┘ └──────────┘ └─────┘
```

First action in the flow is TinyFish — everything else layers on top of the enterprise draft it produces.

---

*Built at the Ship to Prod AI Hackathon · SF · 2026-04-24 · Demo 5 PM PDT*
