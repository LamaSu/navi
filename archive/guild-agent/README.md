# @shiptoprod/guild-agent

**Guild-hosted supply-side meta-agent** for the Ship to Prod hackathon.

This is the agent judges meet first. A human pointman at an enterprise chats with it; the agent onboards them onto PCC end to end — data-sources via Nexla, backend via InsForge, docs via Ghost, memory via Redis, wallet+escrow via CDP + x402, listing via agentic.market, and the new enterprise agent gets registered with PCC's agent-package.

Demand side (buyer-facing) lives at `../pcc-capability-finder/` (TinyFish cookbook recipe).

## Setup (one-time, by a human)

```bash
# 1. Guild CLI auth (opens a browser; needs human click)
guild auth login --no-browser

# 2. Skill setup + select workspace
guild setup
guild workspace select home

# 3. Register our backend as a custom integration (OpenAPI-driven)
#    This creates ~7 tools named pcc_operator_backend_*
guild integration create \
  --openapi ../backend/openapi.yaml \
  --name pcc-operator-backend \
  --base-url http://localhost:3000

# 4. Init the agent project
mkdir -p guild-project && cd guild-project
guild agent init --name pcc-enterprise-onboarder --template LLM

# 5. Copy our agent.ts in
cp ../agent.ts .
```

## Test locally

```bash
echo '{"prompt":"Hi, I run a titanium machine shop in Oakland"}' \
  | guild agent test --ephemeral --mode json
```

## Publish to Agent Hub

```bash
guild agent save --message "v1 — enterprise onboarder" --wait --publish
```

After publish, grab the shareable URL for the Devpost submission.

## How the pointman flow works

```
pointman → "I run a 5-axis titanium shop in Oakland"
  agent → onboard_start({ name: "Oakland Titanium Mills" })        [Nexla + InsForge implicit later]
  agent → "drop your website so I can pre-fill capabilities"
pointman → https://oakland-titanium-mills.example
  agent → onboard_scrape({ url: … })                               [Nexla — REST source]
  agent → "got 5 mills + hours. Share a PDF of your SOP?"
pointman → uploads URL
  agent → onboard_ingest_docs({ doc_urls: […] })                   [Ghost fork + pgvectorscale]
  ↪ interview loop for tolerances, min/max part, certifications, lead time, pricing
  agent → onboard_build_agent()                                    [InsForge signup + Redis index + CDP wallet + agentic.market + PCC register]
  agent → { agent_url, marketplace_url, escrow_wallet, next_steps }
```

All seven sponsor integrations flow through one Guild agent.

## Why this earns the Guild $1K track (Bryce Heltzel judge)

1. **Real lifecycle** — build, govern (Guild runtime mediates every external call), share (published to Agent Hub).
2. **Custom integration** — we used Guild's OpenAPI auto-tool generation, the feature Guild actively promotes.
3. **B2B depth** — enterprise onboarding is a bigger market than toy agents; the judges have been seeing a lot of chat-with-a-PDF entries.
4. **Audit trail** — every tool call is routed through Guild's governed runtime, which is their enterprise value prop made tangible.
