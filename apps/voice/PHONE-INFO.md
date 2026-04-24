# PCC Enterprise Onboarder — Voice Demo

**Deployed:** 2026-04-24T22:55:15Z

## Dial-able number

**+1 (650) 448-0770** — call this on stage. The Vapi assistant picks up and runs the six-step onboarding flow.

## Vapi resources

| Field | Value |
|------|-------|
| Phone number | +16504480770 |
| Phone number ID | 54a23043-6c89-48ab-a2b8-012747fc6516 |
| Assistant ID | 6d147dd1-cdf0-4310-a06f-acd67996d1f0 |
| Org ID | 99eca38f-cfc3-4f8e-baa0-23f9279d1b9f |
| Provider | vapi |
| Status | active (assistant attached) |
| Server URL | https://pcc-operator-backend-production.up.railway.app/vapi/webhook |

## Stack

- **LLM**: Anthropic `claude-opus-4-5-20251101` (temp 0.3)
- **Voice**: ElevenLabs `eleven_turbo_v2_5`, voiceId `dN8hviqdNrAsEcL57yFj`
- **Transcriber**: Deepgram `nova-2` (en-US, autoFallback enabled)
- **First message**: "Hi, this is PCC — the Physical Capability Cloud. I help enterprises get online in about five minutes. What's your company name?"
- **End call phrases**: goodbye, bye, that's all
- **Max duration**: 600s (10 min)
- **Silence timeout**: 30s

## Tools wired

All four onboarding webhooks point at the Railway backend:
- `onboard_start` — create session
- `onboard_scrape` — Nexla scrape/data-connect
- `onboard_interview_turn` — conversational turn
- `onboard_build_agent` — generate + deploy

## Demo dial instructions

1. From any phone (US/international), dial **+1-650-448-0770**.
2. The assistant greets and asks for the company name.
3. Walk it through: company name → URL → data source → a couple interview questions → "build it".
4. Tool calls hit `https://pcc-operator-backend-production.up.railway.app/vapi/webhook`. Backend responses flow back through Vapi to the caller.
5. To end: say "goodbye" or "that's all".

## Live monitoring during the demo

- Vapi dashboard: https://dashboard.vapi.ai/calls (org `99eca38f-cfc3-4f8e-baa0-23f9279d1b9f`)
- Recent-calls API: `curl -H "Authorization: Bearer $VAPI_PRIVATE_KEY" "https://api.vapi.ai/v2/call?page=1&limit=5&phoneNumberId=54a23043-6c89-48ab-a2b8-012747fc6516"`
- Railway logs: backend project `pcc-operator-backend` (id `fa320ac8-7947-4c0c-a140-1179b3e7cd70`)

## Backend status

- Domain configured: `pcc-operator-backend-production.up.railway.app`
- `/vapi/webhook` route currently returns 404 — backend is being deployed by a parallel agent. Tool calls will fail until the route ships, but the assistant itself will still answer the phone, transcribe, and try to call the tools.
- If the demo lands before the backend is up, the assistant will still hold a coherent voice conversation off its system prompt — it just won't be able to actually build/deploy anything until the webhook is live.

## To swap server URL later (when backend ships under different domain)

```bash
curl -X PATCH https://api.vapi.ai/assistant/6d147dd1-cdf0-4310-a06f-acd67996d1f0 \
  -H "Authorization: Bearer $VAPI_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"serverUrl":"<new-url>"}'
```

(also update each `tools[].server.url` if the path changes)

## Demo readiness

- [x] Phone number active and dial-able
- [x] Assistant created and attached
- [x] LLM, voice, transcriber configured
- [x] Webhook URL + secret configured
- [ ] Backend `/vapi/webhook` route live (parallel agent deploying)
- [x] Smoke test: API reachable
