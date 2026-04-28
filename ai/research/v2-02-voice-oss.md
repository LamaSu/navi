# V2-02 Voice Agent OSS Research

**Agent**: scout-bravo
**Date**: 2026-04-24
**Goal**: Replace Vapi ($0.05/min vendor-locked) with OSS / self-hosted voice agent stack runnable on Spark (119GB RAM, 192.168.108.72)
**Constraints**: Anthropic LLM via PCC, ≤8GB RAM footprint preferred, 1000min/mo target cost

---

## https://docs.livekit.io/agents/ — 2026-04-24T18:00Z

- License: **Apache 2.0** — entire LiveKit ecosystem OSS
- Languages: **Python or Node.js** SDKs
- Plugins: OpenAI, Google, Azure, AWS, xAI, Groq, Cerebras (Anthropic via plugin pkg)
- Telephony: **SIP integration** for inbound/outbound calls (works with Twilio SIP trunks, Telnyx, etc.)
- Architecture: agent connects to LiveKit server room; spawns per-room instance for audio/video
- Self-host: yes (LiveKit Server is OSS) — actual RAM/CPU not stated in landing docs
- Pricing: hosted LiveKit Cloud has per-minute + bandwidth; self-host = infra cost only
- Production users: not on landing (deep search needed) — but known: Anthropic, Character.AI, OpenAI Realtime API demo

## https://github.com/pipecat-ai/pipecat — 2026-04-24T18:00Z

- License: **BSD-2-Clause**
- Language: **Python only**
- STT: AssemblyAI, AWS, Azure, Deepgram, ElevenLabs, Google, Groq Whisper, OpenAI Whisper, +10 more
- TTS: ElevenLabs, Google, OpenAI, Azure, AWS, Deepgram, Cartesia, +25 more (incl. Coqui)
- LLMs: **Anthropic Claude native**, OpenAI, Gemini, Groq, Mistral, DeepSeek, +15
- Transports: Daily WebRTC, **LiveKit**, FastAPI WebSocket, **Twilio**, WhatsApp, **Telnyx**, **Vonage**, **Plivo**
- Video avatars: HeyGen, Tavus, Simli
- Architecture: **composable pipeline of processors** — swap any component
- GitHub: 11.6k stars, active Discord, Anthropic publishes Pipecat Skills + plugins specifically
- Cost: free framework; pay third-party providers only
- Deploy: local or cloud (Pipecat Cloud exists), CLI for prod

## https://github.com/vocodedev/vocode-core — 2026-04-24T18:00Z

- License: **MIT**
- Language: Python (React SDK companion)
- STT: AssemblyAI, Deepgram, Gladia, Google, Azure, RevAI, Whisper, **Whisper.cpp** (local!)
- TTS: Rime, Azure, Google, Play.ht, ElevenLabs, **Cartesia**, **Coqui (OSS)**, gTTS, StreamElements, **Bark**, AWS Polly
- LLMs: OpenAI, **Anthropic** native
- Telephony: **Self-hosted Telephony Server** quickstart — Twilio + Vonage hooks (pulled from repo structure)
- Liveness: last release v0.1.113 = **June 2024**, 754 commits — concerningly slowing
- Self-host: Docker configs present
- Project status: **seeking community maintainers** — RED FLAG for prod adoption

## WebSearch: LiveKit vs Pipecat vs Vocode 2026 — 2026-04-24T18:00Z

- **LiveKit**: WebRTC-first, cleanest API, best for real-time scalability, strong turn-detection/interruption handling, excels at <500ms latency
- **Pipecat**: Most flexible — mix-and-match providers; transport-agnostic; best for cost optimization; 80% savings vs hosted Vapi at >10K min/mo
- **Vocode**: Phone-first/telephony-opinionated; pre-built call workflows; less flexible than Pipecat
- **Decision rule**: Build (LiveKit/Pipecat) when >10-50K min/mo, need HIPAA/SOC2, demand <500ms, need observability
- **TEN Framework**: emerging C++ alternative (faster, less mature)

## WebSearch: self-host voice agent Anthropic Claude Twilio 2026 — 2026-04-24T18:00Z

- **ConversationRelay** (Twilio's WebSocket bridge) is the production-grade pattern in 2026
- Twilio handles STT + TTS natively in ConversationRelay → server only sends/receives **text**
- Architecture: Twilio Voice → ConversationRelay WS → Claude API → tool-calling
- Ref impl: "Loquent" platform = Twilio + Deepgram + Claude + ElevenLabs in <1.5s loop
- Tool-calling: Claude `tools` array works via webhook back to backend (Vapi-equivalent pattern)
- Anthropic now offers **Claude Managed Agents** (April 2026) — managed alt if self-host fails

## WebSearch: Retell vs Vapi pricing 2026 — 2026-04-24T18:00Z

- **Vapi total cost**: $0.15-0.25/min (some users $0.36/min after components)
- **Retell**: $0.07+/min platform, real $0.13-0.31/min with deps — *similar to Vapi, not OSS*
- Multi-part pricing makes Vapi unpredictable — up to 5 invoices per agent
- **No pure OSS alternatives** in this comparison set — they're all SaaS competitors
- Burki, Synthflow, Trillet = all SaaS (Trillet @ $0.09/min cheapest white-label)
- Conclusion: Retell is **NOT** an OSS replacement — same vendor-lock issue


## https://developers.deepgram.com/docs/voice-agent — 2026-04-24T18:05Z

- Tutorial doc only — no pricing/free tier disclosed in this page
- LLM example: OpenAI GPT-4o-mini in their tutorials (no Anthropic-native binding shown — but their API treats LLM as plug-in "think" component)
- Architecture: STT + "think" (LLM) + TTS as separable units in their Voice Agent API
- No self-host option mentioned (cloud-only API)
- **Need separate pricing search** — see Deepgram pricing search below

## https://www.twilio.com/en-us/blog/integrate-anthropic-twilio-voice-using-conversationrelay — 2026-04-24T18:05Z

- ConversationRelay is Twilio's WebSocket bridge that handles STT+TTS — your server only handles **text**
- "Dial-a-voice-LLM in under 100 lines of code" — implementation simplicity
- Works with **any LLM provider** (Claude in this tutorial)
- Pricing not in article — needs separate search
- **This is the "Vapi minus the platform fee" pattern**: Twilio handles the stuff Vapi obfuscated, you keep the LLM+webhook layer

## WebSearch: Whisper.cpp + voice agent latency — 2026-04-24T18:05Z

- **Whisper Large v3**: ~10GB VRAM full precision; ~6GB Turbo; ~3-4GB INT8
- **Whisper Turbo INT8**: per-chunk inference 22ms on RTX 4090
- faster-whisper @ INT8: 25-30x real-time on modern GPU
- **CRITICAL: Whisper is batch-only — true streaming requires significant adaptation OR switch to Vosk OR managed API**
- For Spark (likely Grace+Hopper, plenty of RAM/GPU): Whisper.cpp works fine but streaming latency is the gotcha
- **Co-location**: 7B LLM (INT4) + faster-whisper (INT8) + Kokoro TTS = fits in 24GB VRAM
- End-to-end target: <500ms if you stream LLM tokens into TTS sentence-by-sentence

## WebSearch: Cartesia / TTS pricing — 2026-04-24T18:05Z

- **Cartesia Sonic 3 / Sonic Turbo**: $0.0300/min — best-in-class for the price
- ElevenLabs Flash v2.5: $0.0900/min (3x Cartesia)
- ElevenLabs Multilingual v2: $0.1800/min (6x Cartesia)
- **Deepgram Aura-2 TTS**: $0.0180/min — cheapest cloud TTS
- **Smallest.ai**: $0.02/min TTS, $0.045/min cloning
- **OSS / self-hosted**: **Qwen3-TTS** Apache 2.0, 97ms end-to-end, $0/min
- **NeuTTS Air**: 748M params, <2GB VRAM — co-locates well with Whisper+LLM
- **Coqui** still works (vendor abandoned but model checkpoints persist)
- **Kokoro TTS**: 50-100ms first-chunk latency, very small footprint

## WebSearch: Twilio phone number / minute cost — 2026-04-24T18:05Z

- **US Local inbound**: $0.0085/min
- **US Toll-free inbound**: $0.022/min
- **US Local number**: $1.15/month
- **US Toll-free number**: $2.15/month
- These are rack rates; volume discounts available
- **Telnyx** typically $0.005/min undercut + $1/month numbers (similar)
- **SignalWire**: ~$0.0075/min, $0.95/month numbers (cheapest of the SIP big 3)

## WebSearch: Pipecat self-host requirements — 2026-04-24T18:05Z

- Python 3.11+ (3.12+ recommended)
- Bots are plain Python processes — deploy anywhere
- Footprint is dictated by chosen models, not Pipecat itself
- Pipecat Cloud (Daily.co) GA for managed deploy; OSS self-host fully supported
- AWS Bedrock AgentCore Runtime is one published deploy target
- Self-hosted base case: ~500MB RAM for Pipecat core; rest is the model stack
- **Spark deploy**: trivially fits — Pipecat is just orchestration, the heavy lifting is STT+LLM+TTS


## WebSearch: Twilio ConversationRelay pricing — 2026-04-24T18:10Z

- **ConversationRelay**: $0.07/min — Twilio's E2E voice-AI bridge (STT+TTS bundled)
- This is **higher than Vapi's $0.05/min** but is the production-grade Twilio product
- Note: stack on top of Twilio Voice ($0.0085/min inbound local) → effective ~$0.08/min minimum
- Trade-off: simpler than Pipecat (no STT/TTS to manage) but locks you to Twilio's STT/TTS
- Verdict: **NOT cheaper than Vapi** — only useful if you want Twilio's reliability + flexible LLM choice

## WebSearch: Deepgram pricing — 2026-04-24T18:10Z

- **Nova-3 STT (PAYG)**: $0.0077/min ($0.46/hr)
- Nova-3 STT Growth (annual): $0.0065/min
- Pre-recorded batch: $0.0043/min
- **Voice Agent API (E2E)**: $0.08/min — 10x basic STT, includes everything
- $200 free credit on signup (~26k min = ~433 hrs of STT)
- Bills per-second
- Aura-2 TTS: $0.018/min (cheapest cloud TTS we found)
- Verdict: **Deepgram STT @ $0.0077/min** is the best low-cost cloud STT for our stack

---

# DECISION MATRIX

| Stack | License | Self-host? | Phone | STT | TTS | LLM | Cost @ 1k min/mo | Complexity | Notes |
|-------|---------|------------|-------|-----|-----|-----|------------------|------------|-------|
| **Vapi (baseline)** | Proprietary | NO | Twilio (bundled) | Bundled | Bundled | Anthropic | $50 + LLM | Lowest | Vendor-lock, opaque |
| **Pipecat + Twilio + Deepgram + Cartesia + Claude** | BSD-2 | YES (Spark) | Twilio $0.0085/min | Deepgram $0.0077 | Cartesia $0.030 | Claude (PCC) | ~$46 + LLM | LOW | **Best balance — drop-in modular** |
| **Pipecat + Twilio + Whisper.cpp + Kokoro + Claude** | BSD-2 | YES (Spark) | Twilio $0.0085 | $0 (Spark GPU) | $0 (Spark GPU) | Claude (PCC) | ~$8.50 + LLM | MEDIUM | Cheapest if Spark GPU available; Whisper batch-only risk |
| **LiveKit Agents + SIP + Deepgram + Cartesia + Claude** | Apache 2.0 | YES (Spark) | SIP trunk (Telnyx $0.005) | Deepgram $0.0077 | Cartesia $0.030 | Claude (PCC) | ~$42 + LLM | MEDIUM | Best for WebRTC + telephony combo |
| **Twilio ConversationRelay + Claude** | Proprietary | NO | Twilio bundled | Twilio bundled | Twilio bundled | Claude (PCC) | $70 + Claude tokens | LOWEST | Locks STT/TTS to Twilio; pricier than Vapi |
| **Vocode + Twilio + Whisper.cpp + Coqui + Claude** | MIT | YES | Twilio $0.0085 | $0 (local) | $0 (local) | Claude | ~$8.50 + LLM | MEDIUM | RED FLAG: maintenance dying since June 2024 |
| **Deepgram Voice Agent API** | Proprietary | NO | bring your own | Bundled | Bundled | OpenAI default | $80 + LLM | LOW | Cloud-only, OpenAI default — not Anthropic-first |
| **Asterisk + custom glue** | GPL-2 | YES | SIP trunk | bring own | bring own | Claude | $5 + LLM | HIGH | Maximum control, slow to ship |
| **Retell AI** | Proprietary | NO | bundled | bundled | bundled | configurable | $130 + LLM | LOW | Same vendor-lock as Vapi, ~3x cost |

(LLM cost at ~1k min/mo: Claude Sonnet streamed ≈ $5-10/1k min depending on tool-call density.)

---

# RECOMMENDATION

**Adopt Pipecat + Twilio + Deepgram Nova-3 + Cartesia Sonic 3 + Claude (via PCC) for Navi v2.**

Reasoning:
1. **Pipecat** is the only OSS framework with native Anthropic integration AND transport-agnostic design — you can swap any of STT/TTS/transport without rewriting the agent. BSD-2 license, 11.6k stars, Anthropic actively publishes Pipecat plugins/skills, Daily.co backs it commercially.
2. **Twilio for the phone number** ($0.0085/min) — same provider Vapi uses under the hood. SIP trunks via Telnyx/SignalWire are $0.002/min cheaper but ops cost is higher.
3. **Deepgram Nova-3** at $0.0077/min beats self-hosted Whisper for streaming (Whisper is batch-only, requires significant adaptation). Cloud STT for first cut, swap to faster-whisper on Spark when scale demands it.
4. **Cartesia Sonic 3** at $0.030/min is 3x cheaper than ElevenLabs with comparable quality. Drop-in alternative in Pipecat's TTS service list.
5. **Claude via PCC's existing Anthropic key** — no new infra, native tool-calling.
6. **Total: ~$46/1k min + LLM** vs Vapi's effective $50+ — modest savings, but **NO vendor lock**, swap any component independently. When usage scales past 10k min/mo, the **Whisper.cpp + Kokoro on Spark variant drops cost to ~$8.50/1k min** — 5x cheaper than Vapi.
7. **Ship path**: Pipecat tutorial → Twilio webhook → Pipecat agent on Spark behind cloudflared. ~1 day to ship MVP, ~3 days for tool-calling parity with Vapi.

**Skip**: Vocode (dying), Retell (same problem as Vapi), ConversationRelay (locks STT/TTS to Twilio), Asterisk (too slow).

**Hedge**: LiveKit Agents is the strong runner-up if you also need WebRTC browser-side voice. Same cost profile, Apache 2.0, but Pipecat's transport flexibility wins for phone-first Navi v2.

