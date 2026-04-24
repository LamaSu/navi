# 2-minute demo video — script + storyboard

**Output target**: 2:00 minute MP4. Voice-over + screen recording. OBS or QuickTime are fine.
**Tools needed**: a browser, the live URLs from the deployed system, a microphone, a screen recorder, the Vapi number on your phone.

---

## How to record (12 minutes start to finish)

1. **Pre-stage** all browser tabs in this order, full-screen:
   - Tab 1 — `https://pcc-operator-backend-production.up.railway.app/` (onboarding console)
   - Tab 2 — `https://app.guild.ai/agents/globalmysterysnailrevolution/pcc-enterprise-onboarder` (Guild chat)
   - Tab 3 — `https://pcc-operator-backend-production.up.railway.app/op?id=oakland-titanium-mills-demo` (operator dashboard)
   - Tab 4 — `https://insforge.dev/dashboard/project/04fa08d7-f838-4217-8364-4f8595e62fdf`
   - Tab 5 — `https://cited.md` (or the published profile once we run the flow)
   - Tab 6 — `https://github.com/LamaSu/navi`
2. Phone in hand, ready to dial **+1 (650) 448-0770**
3. Record desktop audio + mic. Hit record. Read the voiceover below; switch tabs / dial / click on the cues.

---

## The video — 8 scenes × 15 seconds each

### Scene 1 — 0:00 → 0:15  (HOOK)

**On screen**: full-screen logo card or just the GitHub repo. Static.

**Voiceover**:
> "Every enterprise with real capability — every machine shop, fleet, or lab — wastes two weeks integrating with an agent marketplace before they earn a dollar. We compressed that to one phone call. This is **Navi**."

---

### Scene 2 — 0:15 → 0:30  (DIAL)

**On screen**: the phone dial-pad on the screen, then your face / hand picking up the phone.

**Voiceover**:
> "Watch — I'm dialing the agent."
> *(speakerphone audio)*
> Vapi: "Hi, this is PCC. I help enterprises get online in five minutes. What's your company name?"
> You: "Oakland Titanium Mills."
> Vapi: "Got a website I can pull from?"
> You: "oakland-titanium-mills dot example."
> Vapi: "What's a typical job?"
> You: "Titanium 6-4, 48-hour standard, max part four-by-four-by-six inches."
> Vapi: "Locking that in. Look for a text. Bye."

---

### Scene 3 — 0:30 → 0:45  (CONSOLE)

**On screen**: Tab 1 — onboarding console at `/`. Click "Start onboarding", watch the status feed update in real time.

**Voiceover**:
> "While the call ran, the pointman — that's me — could drop docs and connect data sources from this console. SOPs, a SharePoint URL, a CMMS connection string. The agent uses everything in parallel."

---

### Scene 4 — 0:45 → 1:00  (FAN-OUT — books, scratchpad, nervous system)

**On screen**: Tab 1 status feed shows scrape complete, ingest complete, build complete. Maybe a tiny diagram overlay if you have time.

**Voiceover**:
> "Ten sponsors fired in parallel. **Vapi** captured the call. **Chainguard** runs the container. **TinyFish** scraped the website. **Nexla** built the data pipeline. Then three storage layers — **InsForge** is the operator's *books*, **Ghost** is the verifier's *scratchpad*, **Redis** is the agent's *nervous system*. **CDP** minted a wallet. **x402** monetizes the endpoint. **agentic.market** listed it. **Senso** published to **cited.md**."

---

### Scene 5 — 1:00 → 1:20  (PROOF — 3 tabs flip)

**On screen**: Tab 2 (Guild agent), Tab 4 (InsForge dashboard), Tab 5 (cited.md profile).

**Voiceover**:
> "Same agent runs in chat too — Guild Agent Hub. Same flow, typed instead of spoken. The operator's Postgres is live on InsForge. Their public profile is on cited.md, indexed for buyer agents."

---

### Scene 6 — 1:20 → 1:40  (THE MONEY SHOT — operator dashboard, send job)

**On screen**: Tab 3 — operator dashboard with the green ONLINE pill and live counters. Click "Send test job" twice.

**Voiceover**:
> "And here's the new operator agent — Oakland Titanium Mills, online, listening for jobs. x402 endpoint live. Redis stream open. Watch — I send a test job *(click)* — the bus picks it up, the agent matches it against the capability vector, ACKs with a quote in 700 milliseconds. Five cents earned. Real."

---

### Scene 7 — 1:40 → 1:55  (CLOSE — the offer)

**On screen**: Tab 6 — GitHub repo home. Pin the phone number on screen.

**Voiceover**:
> "Same agent, same code, onboards a fleet operator, a lab, a logistics warehouse. Capability schema is generic. **If you want to see it end-to-end, dial six-five-zero, four-four-eight, oh-seven-seven-zero from your phone.** Repo's open source on LamaSu slash navi."

---

### Scene 8 — 1:55 → 2:00  (LOGO / END CARD)

**On screen**: Logo card or full-screen text:

```
NAVI
github.com/LamaSu/navi · +1 (650) 448-0770
Ship to Prod · April 24, 2026
```

(silent or short outro music)

---

## Cuts to make if you go over 2:00

- Scene 4 fan-out is the most compressible: drop "**Chainguard** runs the container" and "**agentic.market** listed it" — saves 4 sec
- Scene 5: drop the InsForge tab, just show Guild + cited.md — saves 5 sec
- Scene 6: only one click, not two — saves 3 sec

## Captions / lower-thirds (if you have time to add in post)

- Scene 4 voiceover: pin **books · scratchpad · nervous system** below as the labels appear
- Scene 6: pin **operator agent · LIVE · accepting jobs** at the top
- Scene 7: pin the dial-able number large and centered

## Backup plan if Vapi audio is poor

Record Scene 2 once. If the audio quality is bad on playback, type the conversation in chat instead (Tab 2, Guild) for that 15-second window. Same script, different medium.
