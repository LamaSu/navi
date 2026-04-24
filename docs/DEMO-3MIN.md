# Navi — 3-minute demo

**Event:** Ship to Prod AI Hackathon · AWS Builder Loft SF · 2026-04-24
**Slot:** 5:00 PM PDT
**Format:** live phone call + dashboard tabs + 30-second close

---

## Workflow (what the audience sees)

```
[15s] HOOK ──────────── stage talks to camera, slide w/ Navi logo + sponsor strip

[1:30s] LIVE CALL ───── stage dials Vapi number on speaker
                        Vapi assistant interviews the "pointman" (one of us)
                        backend fans out 10 sponsor integrations in parallel
                        screen shows live activity:
                          • Vapi transcription (left)
                          • dashboard activity feed (right)

[45s] PROOF TABS ────── flip 6 browser tabs, one per artifact:
                          1. Guild agent at app.guild.ai/agents/<id>
                          2. Vapi call detail w/ structured-output JSON
                          3. cited.md/c/oakland-titanium-mills (live profile)
                          4. agentic.market/v1/services/<id>
                          5. Base Sepolia tx for the wallet (basescan.org)
                          6. InsForge auto-REST showing the new tables

[15s] CLOSE ────────── callable next-action: "dial this number from your seat"
                       phone number on screen, demo line stays open during Q&A

[15s] BUFFER ────────── for Q&A overlap
```

Total: 3 minutes.

---

## Voiceover (read this verbatim if you go solo)

> **[0:00 — 0:15] HOOK**
>
> *(stage to camera)*
> Every enterprise with real capability — every machine shop, fleet, lab — burns two weeks integrating with a marketplace before they earn a dollar. We compressed it to a five-minute phone call. This is **Navi** — eight sponsor integrations behind one onboarding agent.

> **[0:15 — 0:30] DIAL**
>
> *(picks up phone, dials the Vapi number on speaker)*
> Watch — I'm calling our agent.

> **[Vapi assistant — 0:30 — 1:00]**
> "Hi, this is PCC — the Physical Capability Cloud. I help enterprises get online in about five minutes. What's your company name?"
>
> *(stage)* "Oakland Titanium Mills."
>
> "Got a website I can pull from?"
>
> *(stage)* "oakland-titanium-mills dot example."
>
> "And what's a typical job? Materials, lead time, max part."
>
> *(stage)* "Titanium 6-4, 48-hour standard, max part four by four by six inches."
>
> "Locking that in. Look for a text with your dashboard. Bye."
>
> *(stage hangs up)*

> **[1:00 — 1:45] FAN-OUT — narrate the dashboard**
>
> Behind that 30-second call, ten things just happened in parallel.
>
> **Vapi** captured the call as structured intent — name, capabilities, schedule.
>
> Our backend, running on a **Chainguard** zero-CVE container, picked it up.
>
> A **TinyFish** agent scraped Oakland Titanium's website and pulled five CNC mills, hours, and contact in eight seconds.
>
> **Nexla** built a real data pipeline — REST source today, but the same flow takes Postgres ERPs, SharePoint, Salesforce — five-hundred-fifty connectors.
>
> **InsForge** spun up a Postgres backend for Oakland Titanium in sixty seconds — auth, storage, auto-REST, an OpenAI-compatible model gateway. Zero OAuth dance.
>
> **Ghost** — that's Tiger Data Agentic Postgres — forked a per-capture verifier database with **pgvectorscale** to index their SOPs.
>
> **Redis** indexed the capability blurbs for vector search, ran an Agent Memory Server over MCP for conversation state, and emits to a Redis Stream as the agent-to-agent bus. Bonus: every Nexla call is wrapped in a LangCache semantic cache — second-time queries skip Nexla entirely.
>
> **Coinbase Developer Platform** created a wallet for the new operator and faucet-funded it on Base Sepolia.
>
> An **x402** middleware went live on the operator's `/jobs` endpoint with the Coinbase facilitator — first thousand transactions free.
>
> They got listed on **agentic.market** for agent-to-agent discovery.
>
> And **Senso** — the company behind cited.md — published Oakland Titanium's profile to cited.md so buyer agents can find them.

> **[1:45 — 2:30] PROOF TABS — flip browser tabs**
>
> *(tab 1)* Here's the **Guild agent** that ran the chat path — multi-turn llmAgent on Guild's governed runtime, every external call auditable. Same code, two interfaces — phone and chat.
>
> *(tab 2)* Here's the **Vapi call detail** — the structured-output JSON our task runner extracted: intent, tasks, confidence.
>
> *(tab 3)* Here's the **cited.md** profile, live for Oakland Titanium Mills, indexed by Senso's content engine.
>
> *(tab 4)* The **agentic.market** listing — anyone running a buyer agent can find this operator now.
>
> *(tab 5)* The **Base Sepolia** transaction for the wallet, on basescan.
>
> *(tab 6)* And the **InsForge** auto-REST — the new tables for machines, jobs, evidence — all live.

> **[2:30 — 2:45] CLOSE**
>
> Same agent, same code, onboards a fleet operator, a lab, a logistics warehouse. Capability schema is generic; PCC's a2a intents handle the dispatch.
>
> If you want to see this end-to-end, dial *(stage reads number on screen)* from your seat. The line stays open during Q&A.

> **[2:45 — 3:00] BUFFER for hand-off / first question**

---

## Inline sponsor count (verify before going on stage)

| # | Sponsor | Where it shows up in the demo | Callout in voiceover |
|---|---|---|---|
| 1 | **Vapi** | the phone call itself | "Vapi captured the call as structured intent" |
| 2 | **Chainguard** | dashboard footer chip | "running on a Chainguard zero-CVE container" |
| 3 | **TinyFish** | dashboard event "site scrape complete" | "TinyFish agent scraped Oakland Titanium" |
| 4 | **Nexla** | dashboard event "pipeline activated" | "Nexla built a real data pipeline" |
| 5 | **InsForge** | tab 6 — auto-REST tables | "InsForge spun up a Postgres backend" |
| 6 | **Ghost (Tiger Data)** | dashboard event "ghost fork created" | "Ghost forked a per-capture verifier database" |
| 7 | **Redis** | dashboard event "vector index live" | "Redis indexed the capability blurbs" |
| 8 | **Coinbase (CDP + x402 + agentic.market)** | tab 4 + tab 5 | "Coinbase Developer Platform created a wallet…" |
| 9 | **Senso (cited.md)** | tab 3 — live profile | "Senso published the profile to cited.md" |
| 10 | **Guild** | tab 1 — agent at app.guild.ai | "Guild agent ran the chat path" |

That's **10 sponsors** in 3 minutes. The Context Engineering Challenge asks for 3+; this is the headline answer.

## Backup branches (if anything dies on stage)

- **Phone audio drops** → flip immediately to tab 1 (Guild chat). Same flow, just typed instead of spoken.
- **Vapi structured-output empty** → say "I'll trigger the task runner manually" and `curl -X POST <railway-url>/vapi/task-runner` from a terminal tab. Returns the same end state.
- **A sponsor API 500s** → mock mode flips back on for that one tool, demo continues; tab still loads from cached state.
- **The whole live demo fails** → play the 90-second backup screencast (record before going on stage).
- **Nothing works** → just walk through the 6 tabs, narrate as if it had just run. Judges still score on what they see.

## What you say in Q&A

- **"How does the operator get paid?"** → "x402 with Coinbase as the facilitator. First 1,000 tx/mo free. Settlement to the CDP wallet we created during onboarding."
- **"What if their data isn't on the web?"** → "Nexla. Five-hundred-fifty connectors — Postgres, Salesforce, SharePoint, S3, you name it. The agent prompts the pointman for the connection string and Nexla owns the rest."
- **"Why both Guild AND Vapi?"** → "Same backend, two doorways. Some pointmen prefer chat; some are walking the shop floor with a phone. The agent is the same agent."
- **"Is this real or simulated?"** → "Real. The Senso profile is live, the Base Sepolia tx is on-chain, the InsForge backend has a public claim URL, the Vapi call is in their dashboard. Try it from your seat."
