# Payment Rails + cited.md Research — scout-foxtrot

**AGENT_NAME**: scout-foxtrot
**START**: 2026-04-24
**TASK**: Research cited.md, x402, MPP, CDP, agentic.market for Context Engineering Challenge

---

## https://cited.md/ — 2026-04-24

**What it is**: An "agentic domain" — an endpoint designed for AI agents to
**Retrieve · Search · Transact**. Powered by **Senso** (senso.ai), positioned as
one of a growing "Open Network" of agentic domains. **Not a GitHub repo or open
protocol spec** — it's a hosted Senso destination.

**Published industries** (as of landing page): Consumer Health, Retail & E-commerce,
Software & SaaS.

**How publishers onboard**: via Senso, not directly. Senso offers three publishing
destinations: **Citeables** (agent-optimized FAQ pages), **CuCopilot** (credit unions),
**Codeables** (developers/software). Publishers "spin up a branded publish destination
on their own domain OR a Senso Community Offsite Domain" — **cited.md is a Senso
Community Offsite Domain**, not a standalone API.

**CLI**: `npm install -g @senso-ai/cli` — exists but publishing-specific commands not
surfaced publicly.

**Pricing**: Enterprise Plan **$2,500/mo** (only tier disclosed publicly). Free 7-day
audit available. For-developer docs at `docs.senso.ai`.

**Auth**: Not publicly documented. Enterprise sales-driven onboarding.

**Format**: Senso-structured content (their CMS). No public schema. Content described
as "verified, agent-ready knowledge base" with scoring for accuracy/compliance.

**For our agent**: cited.md is **NOT a programmatic "publish my agent's output"
endpoint**. Two routes to use it:
1. **Publish our capability card/artifacts** via Senso CLI + enterprise onboarding
   (slow, costly, probably overkill).
2. **Have our agent read/cite FROM cited.md** as a grounded data source (fast, free,
   fits the x402 Retrieve/Search pattern if cited.md gates with x402).

**URLs**: https://cited.md · https://www.senso.ai/narrative-control · docs.senso.ai

---

## https://x402.org/ — 2026-04-24

**What it is**: Open HTTP-native payment protocol reviving the HTTP 402 status code.
Moved to **Linux Foundation (x402 Foundation)** April 2026 with founding coalition:
**Coinbase, Stripe, Cloudflare, AWS, Google, Microsoft, Visa, Mastercard**.

**Flow**:
1. Client GETs protected resource.
2. Server returns `402 Payment Required` + `PAYMENT-REQUIRED` header (price, network, asset).
3. Client signs `PaymentPayload`, sends `PAYMENT-SIGNATURE` header.
4. Server calls facilitator `/verify` → `/settle`.
5. Server returns resource with `PAYMENT-RESPONSE` header.

**Parties**: Client · Resource Server · Facilitator.

**Packages**:
- **TypeScript/npm**: `@x402/core`, `@x402/evm`, `@x402/svm`, `@x402/stellar`,
  `@x402/express`, `@x402/fetch`, `@x402/fastify`, `@x402/hono`, `@x402/next`
- **Python**: `pip install x402`
- **Go**: `github.com/x402-foundation/x402/go`

**Networks**: EVM (Base, Polygon, Arbitrum, World), Solana (SVM), Stellar.

**Coinbase-hosted facilitator** (via CDP): **1,000 tx/mo free, then $0.001/tx**.
Supports USDC, EURC via EIP-3009; Permit2 for any ERC-20.

**Seller quickstart code** (Express on Base Sepolia):
```ts
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator"  // or CDP prod: https://api.cdp.coinbase.com/platform/v2/x402
});
const server = new x402ResourceServer(facilitatorClient)
  .register("eip155:84532", new ExactEvmScheme()); // 84532 = Base Sepolia

app.use(paymentMiddleware({
  "GET /capabilities": { accepts: [{ scheme: "exact", price: "$0.001",
    network: "eip155:84532", payTo: "0xYourAddr" }],
    description: "Enterprise-Operator capability card" }
}, server));
```

**Prod switch**: Change network to `eip155:8453`, set `CDP_API_KEY_ID` +
`CDP_API_KEY_SECRET` env vars.

**Docs**: https://x402.org · https://x402.org/ecosystem · https://x402.org/x402-whitepaper.pdf
· https://docs.cdp.coinbase.com/x402/welcome · https://github.com/coinbase/x402

---

## MPP — Machine Payments Protocol — 2026-04-24

**What it is**: Machine-to-machine payment protocol co-authored by **Tempo Labs +
Stripe**, launched March 18, 2026. **Backwards-compatible with x402** — MPP sessions
can use x402 as underlying payment mechanism. Submitted to IETF.

**Key distinction from x402**:
- x402 = stateless, per-request, "vending machine" (execution layer)
- MPP = session-based, streaming, "open tab" (coordination layer)
- Quote: "x402 is the execution layer, MPP is the coordination layer"

**Flow (IETF-style)**:
1. GET resource.
2. `402 Payment Required` + `WWW-Authenticate: Payment` header.
3. Client pays, gets credential.
4. Retry with `Authorization: Payment` + credential.
5. Server verifies, returns `Payment-Receipt` header.

**Four primitives**: challenges, credentials, vouchers, receipts.

**Payment methods** (payment-agnostic):
- **Tempo**: stablecoin, sub-second settlement (PROD)
- **Stripe**: cards + wallets via Shared Payment Tokens (PROD)
- **Lightning**: Bitcoin (available)
- **Card**: encrypted network token (available)
- **Custom**: via SDK

**Intents**:
- `Charge` — one-time per-request
- `Session` — streaming pay-as-you-go

**SDKs**:
- TypeScript: `mppx` (with Hono/Express/Next.js/Elysia middleware + CLI)
- Python: `pympp`
- Rust: `mpp-rs`

**Live ecosystem**: 50+ services on launch day (OpenAI, Anthropic, Google Gemini,
Dune, etc.). Tempo MPP Hackathon: **43 projects** built, including:
- AI agents starting companies for ~$0.20 USDC
- Human-in-the-loop task marketplaces
- Book summarization CLIs

**Settlement**: ~500ms on Tempo L1 vs x402's ~2s on Base. Min payment ~$0.0001.

**For our agent**: Use if we want subscription/streaming inference pricing. For
discrete "pay per API call" semantics, x402 is simpler. **Recommendation**: x402
primary, MPP later if we add session-style billing.

**Docs**: https://developers.cloudflare.com/agents/agentic-payments/mpp/

---

## CDP — Coinbase Developer Platform — 2026-04-24

**What it is**: Coinbase's developer platform — wallets, smart-contract deploy,
AgentKit, onramp, x402 facilitator. **Free tier** covers all hackathon testing.

**Portal**: https://portal.cdp.coinbase.com/ (signup with Coinbase account)

**Products relevant to us**:
- **CDP Server Wallet / Smart Wallet** — gasless USDC/EURC/cbBTC on Base Mainnet + Sepolia
- **AgentKit** — framework/wallet-agnostic agent toolkit
- **x402 Facilitator** — hosted, 1,000 tx/mo free
- **Base Sepolia Faucet** — embedded in AgentKit

**AgentKit packages**:
- TypeScript: `@coinbase/agentkit`, `@coinbase/agentkit-langchain`, `@coinbase/agentkit-vercel-ai-sdk`
- Python: `coinbase-agentkit`, `coinbase-agentkit-langchain`

**Framework integrations**: LangChain, Vercel AI SDK, OpenAI Agents SDK, Pydantic AI, AutoGen.

**Auth**:
- `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` (from CDP portal)
- + LLM API key (OpenAI/Anthropic)

**Gasless transactions**: USDC, EURC, cbBTC on Base Mainnet + Sepolia when using CDP
Server Wallet. Huge win — no ETH needed for gas.

**For our agent**: We already have MilestoneEscrow on Base Sepolia from PCC. AgentKit
gives us:
1. Instant programmatic wallet (no manual setup)
2. Built-in faucet for Sepolia
3. Tool bindings for LangChain/Vercel AI SDK
4. Gasless USDC transfers

**Docs**: https://docs.cdp.coinbase.com · https://github.com/coinbase/agentkit

---

## https://agentic.market/ — 2026-04-24

**What it is**: **Coinbase-backed marketplace** for x402-enabled services. Launched
April 2026. "Browse and call x402-enabled services — no API keys, no accounts, pay
per request." Semantic search, live metrics from real tx data, service profiles.

**Service discovery API**:
- `GET https://api.agentic.market/v1/services` — list all
- `GET https://api.agentic.market/v1/services/search?q={query}` — semantic search
- Schema: `{id, name, description, category, networks: ["base"], endpoints: [{url, method, description, pricing: {amount, currency}}]}`

**Connected services**: Bloomberg, AWS, CoinGecko, Exa, and more. Per-endpoint
pricing ranges **$0.001 to $500,000+ USDC**.

**Agent wallet skills** (CLI):
```bash
npx skills add coinbase/agentic-wallet-skills
```

**Provider onboarding flow (for us to list)**:
- Not fully public; key file is `https://agentic.market/llms.txt` (AI discovery)
- Likely: register an x402 endpoint, submit to their discovery, get picked up
- Path via CDP docs: `https://docs.cdp.coinbase.com/x402/welcome`

**MCP server**: Not mentioned in public docs.

**For our agent**: **LIST ourselves here**. Our Enterprise-Operator Agent becomes a
discoverable service that other agents can find + pay via x402. This is the headline
demo — monetization via real agent-to-agent economy, not just "here's a server".

**URLs**: https://agentic.market · https://api.agentic.market/v1/services · https://agentic.market/llms.txt

---

## SUMMARY — scout-foxtrot

**cited.md**: Senso-hosted "agentic domain" ([cited.md](https://cited.md)) for
AI-agent retrieval/search/transact. Publisher onboarding via Senso enterprise sales
($2,500/mo); not a programmatic publish API. Use as a **grounded citation source our
agent reads**, not a publish target. CLI: `@senso-ai/cli` (publishing commands
undisclosed).

**x402**: Linux Foundation HTTP-native payment standard ([x402.org](https://x402.org/),
[github.com/coinbase/x402](https://github.com/coinbase/x402)). Install `@x402/express`
+ `@x402/evm` + `@x402/core`, call `paymentMiddleware()`, point at Coinbase-hosted
facilitator (1k tx/mo free). Already matches our PCC MilestoneEscrow on Base Sepolia
(`eip155:84532`). **Primary pick.**

**MPP**: Stripe+Tempo session-based sibling ([docs](https://developers.cloudflare.com/agents/agentic-payments/mpp/)).
npm `mppx`, pip `pympp`. Supports fiat via Stripe — advantage if we need card
payments. Backwards-compatible with x402. **Defer to V2** unless we add streaming
inference billing.

**CDP**: Coinbase Developer Platform ([portal](https://portal.cdp.coinbase.com/),
[docs](https://docs.cdp.coinbase.com/)). Provides wallet, gasless USDC, faucet,
AgentKit (`@coinbase/agentkit`), and x402 facilitator. Auth: `CDP_API_KEY_ID` +
`CDP_API_KEY_SECRET`. Free tier is enough for demo. **Required infra for x402.**

**agentic.market**: x402 service marketplace ([agentic.market](https://agentic.market),
[api](https://api.agentic.market/v1/services)). No API keys, pay per request in USDC.
List our agent's capabilities as a discoverable service. **Primary monetization
surface for the headline track.**

### Recommended combination for Enterprise-Operator Agent
1. **CDP AgentKit** → agent wallet + Base Sepolia faucet + gasless USDC
2. **x402 middleware** on our agent's HTTP endpoints (pricing per capability)
3. **List on agentic.market** → other agents discover + pay us
4. **Read from cited.md** for grounded enterprise knowledge citations (not publish)
5. **MPP** deferred — add if we want streaming session billing

### Credential / key gaps
- **CDP**: Need `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` from https://portal.cdp.coinbase.com/ (free signup, ~5 min)
- **Base Sepolia wallet**: AgentKit provisions auto; fund via CDP faucet
- **Senso cited.md publish**: BLOCKED (enterprise sales, $2,500/mo). Use as reader, not publisher.
- **agentic.market listing**: No documented self-serve flow yet — need to submit via CDP x402 onboarding (confirm with Coinbase devrel at hackathon).
- **LLM**: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (we already have Anthropic in .credentials.json).

**END** — word count of this summary section: ~290 words.
