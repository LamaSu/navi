# cited.md — Re-Investigation (scout-juliet, 2026-04-24)

## Headline correction
Earlier "$2,500/mo, no programmatic publish" was **wrong**. cited.md publishing IS programmatically accessible via Senso's CLI/API on a $100-free-credit dev tier (no card).

## What cited.md actually is
- A Senso-operated agent endpoint network. Per cited.md homepage: "endpoint for AI agents to retrieve verified information... payments, transactions, interactions."
- Publishing destination is called a **"publisher"** internally; "citeables" is the default publisher set for most orgs.
- No open `cited.md` standard, no `.well-known` convention, no GitHub schema. It's Senso-proprietary.
- **Senso is NOT a Ship to Prod sponsor** — no devrel at AWS Builder Loft today. Pure remote API.

## The real publishing path (verified from CLI source)
- Base URL: `https://apiv2.senso.ai/api/v1`
- Auth: header `X-API-Key: tgr_...` (env: `SENSO_API_KEY`)
- Endpoint: `POST /org/content-engine/publish`
- Payload: `{ "geo_question_id": "<uuid>", "raw_markdown": "...", "seo_title": "...", "summary": "...", "publisher_ids": ["<uuid>", ...] }`
- Omit `publisher_ids` to publish to all configured destinations (citeables by default).
- CLI equivalent: `senso engine publish --data '{...}'` (npm `@senso-ai/cli@0.11.0`).
- Free tier: $100 credits, no card. Sign up at senso.ai → API key from docs.senso.ai.

## Required prep on our side
1. Senso account + API key (one-time, ~5 min).
2. Create one Senso "geo_question" per operator capability (e.g., "What sub-100kg titanium milling operators are available in Oakland?"). Get back `geo_question_id`s.
3. Optional: list publishers (`senso destinations list`), confirm citeables ID, store in our backend.
4. Pre-flight `senso engine draft` for review before live publish.

## Backend code we need
- New worker `apps/api/jobs/publishCited.ts` triggered on operator-onboarded event:
  - Render operator profile (capabilities, location, kernel pubkey, capability.network URL) into markdown.
  - POST to Senso `/org/content-engine/publish` with the matching `geo_question_id`.
  - Persist returned `content_id` on the operator row.
- Env vars: `SENSO_API_KEY`, `SENSO_BASE_URL` (default `https://apiv2.senso.ai/api/v1`).

## SUMMARY (recommendation)
**Take the Senso API path.** It's free for the hackathon, takes ~30 min to wire, and gives genuine cited.md presence — not a self-hosted facsimile. Fallback (`/.well-known/cited.md` mirror) is unnecessary unless we hit credit cap. Need: 1 Senso API key + ~80 LOC publish worker. Oakland Titanium Mills onboards as the first proof point.

## Sources
- https://cited.md (network description)
- https://senso.ai/ ($100 free, npm CLI)
- https://www.npmjs.com/package/@senso-ai/cli (v0.11.0)
- https://github.com/AI-Template-SDK/senso-user-cli (CLI source — endpoint paths confirmed)
- CLI dist grep: `dist/cli.js:1739 path: "/org/content-engine/publish"`
