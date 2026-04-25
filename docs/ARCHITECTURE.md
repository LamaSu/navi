# Navi — System Architecture (Ship to Prod, April 24 2026)

GitHub-flavored Mermaid renders these inline. To export PNGs, paste a single block at https://mermaid.live and click **Export**.

---

## 1. End-to-end flow — what happens when an enterprise dials in

```mermaid
flowchart TB
    subgraph "POINTMAN (the human at the enterprise)"
        P1["📞 dials +1 (650) 448-0770"]
        P2["💬 opens chat console<br/>railway.app/"]
        P3["paste docs / DB connection strings<br/>during the call"]
    end

    subgraph "CHANNELS (3 parallel doorways into the same backend)"
        V["Vapi voice agent<br/>(claude-opus-4.5 + ElevenLabs + Deepgram)"]
        C["Chat UI (Next.js-style HTML)"]
        G["Guild llmAgent<br/>(published v1.0.1, public)"]
    end

    subgraph "NAVI BACKEND (Express on Railway · Chainguard image)"
        B1["/onboard/start"]
        B2["/onboard/:id/scrape"]
        B3["/onboard/:id/ingest-docs"]
        B4["/onboard/:id/build-agent"]
        B5["/op?id=:id (live operator dashboard)"]
        VR["/vapi/task-runner (polls Vapi<br/>for structured tasks)"]
    end

    subgraph "DISCOVERY (parallel scrape + connect)"
        D1["TinyFish<br/>website → JSON"]
        D2["Nexla<br/>postgres / sharepoint /<br/>salesforce / sap → pipeline"]
        D3["Ghost (Tiger Data)<br/>per-capture Postgres fork<br/>SOPs as pgvectorscale + BM25"]
    end

    subgraph "BUILD (sequential after discovery)"
        BU1["InsForge signup<br/>fresh Postgres in 60s"]
        BU2["Redis index<br/>HSET caps + XADD a2a stream"]
        BU3["CDP wallet<br/>fresh address on Base Sepolia"]
        BU4["x402 middleware<br/>on /jobs endpoint"]
        BU5["agentic.market POST<br/>service listing"]
        BU6["Senso publish<br/>profile → cited.md"]
        BU7["Guild deploy<br/>operator-specific agent"]
    end

    subgraph "RESULT — operator is live"
        R1["📡 a2a stream open in Redis"]
        R2["🤖 operator agent on Guild"]
        R3["💸 x402 quotes on /jobs"]
        R4["🌐 listed on agentic.market"]
        R5["📰 profile on cited.md"]
        R6["🗄️ ops books in InsForge"]
    end

    P1 --> V
    P2 --> C
    P3 --> C
    V -->|webhook + task-runner| VR
    VR --> B2
    VR --> B3
    VR --> B4
    C --> B1
    C --> B2
    C --> B3
    C --> B4
    G --> B1
    G --> B2
    G --> B3
    G --> B4

    B1 --> BU1
    B2 --> D1
    B2 --> D2
    B3 --> D3
    B4 --> BU1
    BU1 --> BU2
    BU2 --> BU3
    BU3 --> BU4
    BU4 --> BU5
    BU5 --> BU6
    BU6 --> BU7

    BU7 --> R1
    BU7 --> R2
    BU7 --> R3
    BU7 --> R4
    BU7 --> R5
    BU7 --> R6

    B5 -.reads.-> R1
    B5 -.reads.-> R2
    B5 -.reads.-> R3
    B5 -.reads.-> R6
```

---

## 2. Integration map — every sponsor and its role

```mermaid
graph LR
    subgraph "ENTRY"
        E1[📞 Vapi]
        E2[💬 Chat UI]
        E3[🤖 Guild]
    end

    subgraph "DATA PLANE"
        D1[TinyFish<br/>website extract]
        D2[Nexla<br/>550+ connectors]
        D3[Ghost<br/>per-capture fork]
    end

    subgraph "STORAGE × LATENCY"
        S1["📚 InsForge<br/>(books — durable)"]
        S2["📓 Ghost<br/>(scratchpad — ephemeral)"]
        S3["⚡ Redis<br/>(nervous system — µs)"]
    end

    subgraph "MONEY"
        M1[CDP wallet<br/>Base Sepolia]
        M2[x402<br/>Coinbase facilitator]
        M3[agentic.market<br/>discovery]
    end

    subgraph "PUBLISH"
        P1[Senso<br/>→ cited.md]
        P2[Guild Agent Hub<br/>fork-able]
    end

    subgraph "PLATFORM"
        PL1[Chainguard<br/>cgr.dev/chainguard/node]
        PL2[Railway<br/>hosted runtime]
    end

    E1 --> D1
    E1 --> D2
    E2 --> D1
    E2 --> D2
    E2 --> D3
    E3 --> D1

    D1 --> S1
    D2 --> S1
    D3 --> S2
    D1 --> S3

    S1 --> M1
    M1 --> M2
    M2 --> M3

    S1 --> P1
    E3 --> P2

    PL1 -.runs.-> S1
    PL2 -.hosts.-> S1
```

---

## 3. Data lifespans — why three databases (the inevitable judge question)

```mermaid
graph TB
    subgraph "📚 InsForge — durable, single-tenant per operator"
        IF1["1 Postgres project<br/>per onboarded enterprise"]
        IF2["enterprises, machines, jobs,<br/>customers, evidence tables"]
        IF3["lifespan: forever<br/>auditable"]
    end

    subgraph "📓 Ghost — ephemeral, per-capture"
        GH1["1 fresh Postgres fork<br/>per capture / inspection"]
        GH2["pgvectorscale + BM25<br/>over SOPs/MOPs"]
        GH3["lifespan: minutes<br/>discarded after verification"]
    end

    subgraph "⚡ Redis — working memory"
        R1["RedisVL capability vectors"]
        R2["a2a:intents stream (the bus)"]
        R3["LangCache (semantic cache)"]
        R4["lifespan: seconds → hours<br/>TTLed"]
    end

    DECISION{"new piece<br/>of work arrives"}
    DECISION -->|persist forever| IF1
    DECISION -->|verify it once,<br/>throw away| GH1
    DECISION -->|match against open work| R1
```

---

## 4. /build-agent sequence — what fans out when the pointman says "build"

```mermaid
sequenceDiagram
    actor P as Pointman
    participant C as Chat / Voice
    participant N as Navi backend
    participant TF as TinyFish
    participant NX as Nexla
    participant GH as Ghost
    participant IF as InsForge
    participant RD as Redis
    participant CDP as Coinbase CDP
    participant AM as agentic.market
    participant SE as Senso (cited.md)
    participant GU as Guild

    P->>C: "build"
    C->>N: POST /onboard/:id/build-agent

    par discovery already happened
        N->>TF: scrape website
        N->>NX: build pipeline (real source 120400)
        N->>GH: ghost_fork + index docs
    end

    N->>IF: POST /agents/v1/signup
    IF-->>N: project_url + anon_key (real)

    N->>RD: HSET caps + XADD a2a stream
    RD-->>N: stream id

    N->>CDP: createWallet (viem real)
    CDP-->>N: 0x...address (Base Sepolia)

    N->>AM: POST /v1/services
    AM-->>N: marketplace_url

    N->>SE: POST /content-engine/publish
    SE-->>N: cited.md/c/... (when geo_question valid)

    N->>GU: deploy enterprise-specific agent
    GU-->>N: agent_url

    N-->>C: { agent, backend, cited, wallet, marketplace }
    C-->>P: "You're live. Dashboard: /op?id=..."
```

---

## 5. Voice ↔ Web ↔ Backend triangle (the live console)

```mermaid
graph LR
    subgraph "User-facing"
        Phone["📞 phone"]
        Web["💻 chat console"]
    end

    subgraph "Vapi cloud"
        VA["Assistant<br/>id: 6d147dd1-cdf0-4310-a06f-acd67996d1f0"]
        VC["Calls REST API"]
    end

    subgraph "Navi Express on Railway"
        WH["/vapi/webhook<br/>(real-time events)"]
        TR["/vapi/task-runner<br/>(post-call structured pull)"]
        EV["/events<br/>(SSE-like polling)"]
        SAY["/calls/:id/say<br/>(inject text → voice)"]
    end

    Phone <-->|speech| VA
    VA -->|tool calls| WH
    VA -->|structured output| TR
    Web -->|paste docs<br/>connection strings| WH
    Web -->|poll for transcript| VC
    Web -->|poll for activity| EV
    Web -->|"📞 Speak via voice"| SAY
    SAY --> VA
```

---

## 6. What's REAL vs MOCK right now

```mermaid
pie title Sponsor integrations · live status
    "Fully real (Vapi, Guild, Nexla, InsForge, Redis, CDP, TinyFish call)" : 7
    "Partial (Senso 400, Chainguard Dockerfile, agentic.market POST)" : 3
    "Skipped (Ghost — CLI quirks)" : 1
```

| Layer | Sponsor | Status | Proof |
|---|---|---|---|
| Voice | Vapi | ✅ REAL | +1 (650) 448-0770 answers |
| Chat | Guild | ✅ REAL | app.guild.ai/agents/globalmysterysnailrevolution/pcc-enterprise-onboarder |
| Web extract | TinyFish | ✅ REAL call | API hits agent.tinyfish.ai |
| Data integration | Nexla | ✅ REAL | dataops.nexla.io source 120400 |
| Operator backend | InsForge | ✅ REAL | 255ky8dh.us-east.insforge.app |
| Memory + bus | Redis | ✅ REAL | XADD a2a:intents:* verified |
| Wallet | CDP | ✅ REAL | viem-generated 0x… on Base Sepolia |
| x402 / market | agentic.market | 🟡 POST attempted | falls back gracefully |
| cited.md | Senso | 🟡 auth real, payload 400 | needs geo_question fix |
| Container | Chainguard | ✅ Dockerfile live | cgr.dev/chainguard/node:latest-dev |
| Verifier fork | Ghost | ⏭ skipped | CLI quirks; design preserved |

---

## 7. Repository layout

```
shiptoprod-agent (LamaSu/navi)
├── packages/
│   ├── backend/           ← Express + 6 sponsor wrappers + Vapi task-runner
│   │   ├── src/
│   │   │   ├── server.ts                  ← Express + /events + /calls/:id/say
│   │   │   ├── lib/event-bus.ts           ← rich telemetry
│   │   │   ├── routes/{onboard,vapi,jobs}.ts
│   │   │   ├── onboard/{state,task-runner,generate}.ts
│   │   │   └── tools/{nexla,tinyfish,insforge,ghost,redis,cdp-x402,senso,pcc}.ts
│   │   ├── public/{index.html, op.html}   ← chat console + operator dashboard
│   │   ├── Dockerfile                      ← cgr.dev/chainguard/node
│   │   └── railway.json                    ← DOCKERFILE builder
│   ├── guild-agent/       ← published Guild llmAgent (v1.0.1)
│   ├── pcc-capability-finder/  ← deferred buyer-side recipe
│   └── (tinyfish-recipe deferred)
├── apps/voice/
│   ├── assistant.json     ← Vapi assistant config
│   └── TASK-RUNNER-PROMPT.md
├── docs/
│   ├── ARCHITECTURE.md    ← this file
│   ├── DEMO-3MIN.md       ← live demo voiceover (Option B framing)
│   ├── VIDEO-2MIN.md      ← 8-scene script
│   ├── INTEGRATION-TASKS.md
│   ├── SUBMISSIONS-FINAL.md
│   └── PLAN-V3.md
├── fixtures/oakland-titanium-mills/index.html
├── ai/research/01-09          ← scout outputs
└── ai/supervisor/{intake,status,decomposition}.json
```

---

## 8. Live URLs (right now)

```
Voice:        +1 (650) 448-0770
Chat:         https://pcc-operator-backend-production.up.railway.app/
Operator:     https://pcc-operator-backend-production.up.railway.app/op?id=<session>
Health:       https://pcc-operator-backend-production.up.railway.app/health
Events feed:  https://pcc-operator-backend-production.up.railway.app/events
Guild:        https://app.guild.ai/agents/globalmysterysnailrevolution/pcc-enterprise-onboarder
Repo:         https://github.com/LamaSu/navi
Nexla:        https://dataops.nexla.io/#/flows  (sources 120398, 120399, 120400)
InsForge:     https://255ky8dh.us-east.insforge.app  (most recent test)
              https://insforge.dev/dashboard/project/04fa08d7-f838-4217-8364-4f8595e62fdf
Vapi calls:   https://dashboard.vapi.ai/calls
```
