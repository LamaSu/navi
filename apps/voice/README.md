# apps/voice — Vapi voice assistant

Hands-free onboarding: the pointman calls a phone number and the Vapi assistant
runs the same six-step flow as the Guild chat agent, hitting the same backend
webhook at `/vapi/webhook`.

## Setup

```bash
# 1. Sign up at vapi.ai → dashboard → Phone Numbers → import or buy a number
#    Paste the API key + phone number into root .env

# 2. Create the assistant
curl -X POST https://api.vapi.ai/assistant \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d @assistant.json

# 3. Attach the assistant to the phone number
# (do this in the Vapi dashboard; not straightforward via API alone)

# 4. Ensure the backend is publicly reachable — either
#    deploy with `fly deploy` or expose localhost:3000 via `ngrok http 3000`
#    and update `serverUrl` in assistant.json before re-posting.
```

## Test

Call the phone number. You should hear:

> "Hi, this is PCC — the Physical Capability Cloud. I help enterprises get online in about five minutes. What's your company name?"

## Demo flow (3 min)

```
[0:00] Dial number on stage → Vapi answers
[0:05] "Hi, this is PCC..."
[0:10] "Oakland Titanium Mills"
[0:14] "Drop your website in the chat? Or say it."
[0:18] stage types URL into the companion chat (TinyFish scraper, not shown)
[0:25] "Got 5 mills. Standard 48hr turnaround?"
[0:30] "Yes. 4 by 4 by 6 max part."
[0:35] "Locking that in. Building your agent now..."
[0:50] (backend fans out: Nexla + InsForge + Ghost + Redis + CDP + x402 + PCC)
[1:30] "You're live. Agent URL in your email. Thanks, bye."
[1:35] stage flips to dashboard showing Guild agent, agentic.market listing, escrow address
```

## Why this earns the Vapi track (Dev Seth + Eva Zheng judges)

1. **Real B2B use** — not a toy voice assistant.
2. **Tool-calling is the core interaction** — Vapi isn't a chatbot wrapper; it's driving a real workflow.
3. **Live demo with a live phone call on stage** — judges hear it, not read a pitch.
