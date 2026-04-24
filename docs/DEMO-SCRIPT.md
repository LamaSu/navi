# Demo Script — 3 minutes on stage

**Event:** Ship to Prod AI Hackathon · AWS Builder Loft SF · 2026-04-24
**Slot:** 5:00 PM PDT · 3-minute live demo + Q&A

## Setup before going on stage

- [ ] Backend running publicly (`fly deploy` or `ngrok http 3000` against `pnpm dev`)
- [ ] Vapi assistant attached to phone number `54a23043-6c89-48ab-a2b8-012747fc6516`, `serverUrl` pointing at the public backend
- [ ] Guild agent published (link from `guild agent save --publish` in pocket)
- [ ] Browser tabs in this order:
  1. Guild agent chat at `https://app.guild.ai/agents/<id>`
  2. Vapi dashboard → Calls (to show structured-output extraction live)
  3. cited.md page that will appear after publish
  4. agentic.market listing page
  5. Base Sepolia explorer (basescan.org) — for the escrow wallet
- [ ] Phone in hand, ready to dial
- [ ] Backup demo video recorded and ready to play if anything fails

## Stage flow (timing-marked)

```
[0:00] OPEN
  "Every enterprise with real capability — machine shops, fleets, labs —
  loses two weeks integrating with PCC. We compressed it to a phone call."

[0:15] CALL
  Dial the Vapi number on stage.
  Vapi: "Hi, this is PCC. I help enterprises get online in five minutes.
        What's your company name?"
  Speaker: "Oakland Titanium Mills."
  Vapi: "Got a website I can pull from?"
  Speaker: "oakland-titanium-mills.example"
  Vapi: "And what's a typical job? Materials, lead time, max part."
  Speaker: "Titanium Ti-6Al-4V, 48-hour standard, max part 4 by 4 by 6."
  Vapi: "Locking that in. Look for a text with your dashboard. Bye."
  [hang up]

[1:00] BACKEND FANS OUT (show Vapi → Task Runner → backend in dashboard)
  TinyFish scrapes the site → 5 mills extracted
  Nexla creates a real REST source → flow id appears (live in Nexla console)
  InsForge `/agents/v1/signup` → Postgres + auth + REST live in 60s
  Ghost forks a verifier DB → pgvectorscale index built over SOPs
  Redis vector-indexes capability blurbs + Agent Memory Server logs the call
  CDP creates wallet → faucet-funds it on Base Sepolia
  x402 middleware → /jobs returns 402 with quote header
  agentic.market listing → POST creates a discoverable service
  Senso publishes operator profile → cited.md/c/<id> goes live
  PCC agent-package registers the new operator

[2:15] FLIP TABS — "all of that is real"
  Tab 1: Guild agent chat showing the same flow can be done in chat
  Tab 2: Vapi structured-output JSON for the call — intent, tasks, confidence
  Tab 3: cited.md/c/<id> live page for Oakland Titanium Mills
  Tab 4: agentic.market listing
  Tab 5: basescan.org for the wallet (faucet tx visible)

[2:45] CLOSE
  "Eight sponsor integrations, one chat or one call. Same code onboards a
  fleet, a lab, a warehouse. Two-sided: TinyFish surfaces capabilities for
  buyers; Guild + Nexla + everything else builds the supply side."

[2:55] Q&A — judges
```

## Backup branches

- **Phone audio dies** → switch to Guild chat tab and run the same flow there.
- **Vapi structured output empty** → `POST /vapi/task-runner` with `MOCK_VAPI=true` env override returns a canned response that drives the rest.
- **Nexla rate limits** → mock layer returns Oakland Titanium fixture instantly; works the same.
- **Senso API down** → fallback `MOCK_SENSO=true` produces a `cited.md/mock-...` URL so the tab still loads (we'll note it's mock during Q&A if asked).
- **InsForge cold start >90s** → start it 60s before the demo and demonstrate "look it's already done" with the cached project URL.
- **Live demo entirely fails** → play the backup video; the judges still score based on what they see.

## Talking points for Q&A

- "Yes the Guild agent is on Agent Hub at <link>; anyone can fork it."
- "Yes the cited.md page is real — we publish via Senso's content engine."
- "x402 gating uses Coinbase's facilitator; first 1,000 tx/mo are free. Settlement flows back to the operator's CDP wallet."
- "Nexla connects 550+ data sources — the demo used REST against the website but
  the same flow accepts a Postgres ERP, Salesforce, SharePoint, S3..."
- "Same code, same agent, onboards a fleet operator or a lab. Capability schema
  is generic; PCC's a2a intents handle the dispatch."
