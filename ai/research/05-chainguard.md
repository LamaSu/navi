# Chainguard Research — scout-echo

**Agent**: scout-echo
**Date**: 2026-04-24
**Goal**: Evaluate Chainguard for PCC Enterprise-Operator Agent hackathon entry.

---

## Source 1 — cgstart repo (github.com/chainguardianbb/cgstart)

Cloned to `C:\Users\globa\shiptoprod-agent\research-clones\cgstart`. Repository contents:

- `README.md` (37 lines) — public-facing quickstart
- `chainguard-setup.md` (309 lines) — the actual "skill" file meant for AI agents
- `qr-code.png` — physical hackathon handout
- No LICENSE, no .gitignore, no code — this is purely a SKILL.md-style artifact

### What cgstart IS

NOT a SKILL.md in the strict Anthropic sense — it's a **plain markdown walkthrough** a developer hands to any AI coding agent (Claude Code, Cursor, Copilot, Windsurf, Aider). The canonical incantation from README.md:

```bash
curl -sL https://raw.githubusercontent.com/chainguardianbb/cgstart/main/chainguard-setup.md > chainguard-setup.md
```

Then prompt the AI:
> Follow the instructions in chainguard-setup.md to set me up with Chainguard Containers and Libraries

### What cgstart covers (8 steps)

1. Ask: Python/Java/JavaScript? Containers-only, Libraries-only, or both?
2. Create free account at `https://console.chainguard.dev/auth/login`
3. Install chainctl (brew tap or curl)
4. Pull zero-CVE containers (no auth required for `:latest`)
5. Create library entitlement for ecosystem
6. Create 30-day pull token with `chainctl auth pull-token --repository=<lang> --ttl=720h`
7. Configure `pip.conf` / `pom.xml` / `.npmrc`
8. Verify with install

### Verbatim commands worth capturing

```bash
# Install chainctl (macOS/Linux)
brew tap chainguard-dev/tap && brew install chainctl
# OR
curl -o chainctl "https://dl.enforce.dev/chainctl/latest/chainctl_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/aarch64/arm64/')"
sudo install -o $UID -g $(id -g) -m 0755 chainctl /usr/local/bin/chainctl

# Auth
chainctl auth login
chainctl auth configure-docker

# Containers — no auth for latest, or via cgr.dev
docker pull chainguard/python:latest                 # Docker Hub, no auth
docker pull cgr.dev/chainguard/python:latest         # Chainguard registry, requires configure-docker
chainctl images list --public                         # list free images

# Libraries entitlement + token
chainctl libraries entitlements create --ecosystems=JAVASCRIPT
chainctl auth pull-token --repository=javascript --ttl=720h
```

### npm config (critical for PCC pnpm monorepo)

```ini
# .npmrc at workspace root
registry=https://libraries.cgr.dev/javascript/
//libraries.cgr.dev/javascript/:_auth={BASE64_OF_USERNAME:PASSWORD}
//libraries.cgr.dev/javascript/:always-auth=true
```

Base64: `echo -n '{USERNAME}:{PASSWORD}' | base64`

pnpm/bun use the same `.npmrc`. Yarn 2+ (Berry) needs different config.

### Dockerfile templates (node example)

```dockerfile
FROM cgr.dev/chainguard/node:latest
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
CMD ["node", "index.js"]
```

Use `:latest-dev` variant when you need a shell/package manager inside the image.

### Key gotchas

- Org creation required before pull-token works: `console.chainguard.dev/org/welcome/settings/organization/join` — pick a domain-format name like `yourname-hackathon.dev`
- pip USERNAME contains `/` that breaks URLs — replace with `_` when embedding in `index-url`
- Containers are free for individuals; Libraries free for individuals

---

## Source 2 — chainguard.dev main site

Product line surfaced:
- **Chainguard Libraries** — secure OSS components. 3-month free trial link: `get.chainguard.dev/libraries-and-actions-signup`
- **Chainguard Actions** — production-ready builds for engineering teams. Same signup URL.

Positioning tagline: *"Hardened, secure, and production-ready builds that engineering teams and their agents can trust."*

Containers, VMs, OS Packages, Factory 2.0 were not surfaced on the landing page crawl (content was truncated/JS-heavy).

---

## Source 3 — chainguard.dev/agent-skills

**Chainguard Agent Skills** is a catalog of ~150+ **hardened skills** for AI coding agents. Status: **beta, contact for access**.

### Core claim

"Install a hardened skill by copying a single SKILL.md file. No new toolchain or CI integration required."

### The 4 hardening mechanisms

1. **Continuous reconciliation** — self-healing agents compare desired vs actual state and patch drift
2. **Automated auditable changes** — every fix commits as a reviewable PR
3. **Attack-vector-focused rules** — targets unrestricted shell, broad permissions, vague descriptions
4. **Upstream security** — work completes BEFORE developers access skills

### Categories in the catalog

- Code review / dev (PostgreSQL, Java, JavaScript, .NET, React)
- Deployment (Vercel, Airflow)
- GraphQL/Apollo
- Azure / Microsoft
- Frontend (Vue, Vite, Next.js, Nuxt)
- Design / content
- SEO / marketing

---

## Source 4 — Chainguard announcement blog (unchained)

From `chainguard.dev/unchained/introducing-chainguard-agent-skills`:

### The problem solved

"Community registries are growing fast, but they lack guardrails or governance. They have no built-in review process, no permission scoping, no integrity verification, and no audit trail."

**Triggering incident**: Feb 2026 supply-chain attack via OpenClaw skills distributing Atomic macOS Stealer (39 malicious skills, 2,200+ variants).

### Compatible agents

Claude Code, OpenClaw, others (not enumerated). Skills are the universal SKILL.md format.

### Factory 2.0 link

Chainguard Factory (the existing container-hardening engine) is now extended to agent skills. Factory 2.0 = AI-native version that continuously reconciles the skills catalog via automated review + PR-based audit trail.

---

## Source 5 — chainctl CLI docs (edu.chainguard.dev)

### Core command groups

| Group | Purpose |
|-------|---------|
| `chainctl auth` | login / logout / status / configure-docker / configure-npm / pull-token |
| `chainctl iam` | orgs, roles, identities (aws/github/gitlab OIDC) |
| `chainctl images` | list / diff / advisories / repos / tags |
| `chainctl libraries` | entitlements / verify |
| `chainctl events` | subscriptions |
| `chainctl packages` | versions list |
| `chainctl config` | view / set / validate |

### Pull token commands (verbatim)

```bash
chainctl auth pull-token create                              # default TTL
chainctl auth pull-token create --ttl=24h                    # 24-hour token
chainctl auth pull-token create --parent=my-org              # scoped to org
chainctl auth pull-token create --repository=javascript --ttl=720h  # lib token
```

### GitHub Actions integration

`chainguard-dev/setup-chainctl` — installs chainctl in a GH workflow. Can use OIDC federation (no long-lived secrets).

---

## Source 6 — Cursor partnership (Axios, Apr 21 2026)

**Cursor × Chainguard**: Cursor integrates Chainguard for secure-by-default agentic coding. Dan Lorenc (CEO Chainguard): *"AI agents are making dependency decisions at a scale and speed no security team can manually review... As organizations adopt agentic development, the biggest blocker is no longer how fast code can be generated — it's whether that code can be trusted."*

---

## Source 7 — Factory 2.0 specifics

- 404 on `chainguard.dev/factory` — not a direct landing page
- Factory (original) = container-hardening engine
- Factory 2.0 = AI-native, "self-correcting" — described as the engine BEHIND the Agent Skills catalog
- SLSA L3 claim appears in sponsor PDF but not confirmed on public web (as of scrape)
- **No public API for Factory integration** — it's internal to Chainguard's build system. Consumers integrate at the output side (containers, libraries, skills).

---

## PCC Enterprise-Operator Agent fit analysis

### Q1 — Run agent in a Chainguard container?

**YES, trivial.** PCC workers can run in `cgr.dev/chainguard/node:latest`. Swap base image in `Dockerfile`, `docker build`, push to Railway. Free, no auth for `:latest`. Demonstrates "zero-CVE runtime for autonomous agents." Strong judge story.

### Q2 — Chainguard Libraries in pnpm workspace?

**YES, moderate effort.** Add `.npmrc` with base64 auth. One ecosystem entitlement (`--ecosystems=JAVASCRIPT`). 30-day pull token. pnpm natively reads `.npmrc`. BUT: not every PCC dependency will exist in the Chainguard library mirror (currently ~npm/PyPI/Maven subset). Fallback to npm public registry for unmapped pkgs. Manageable with a staged migration.

### Q3 — Use cgstart skill during our build?

**YES, lightweight.** Install cgstart's `chainguard-setup.md` as a local SKILL.md in `.claude/skills/chainguard-setup/SKILL.md`. Trigger: "set me up with Chainguard" → agent walks the 8 steps. Good for reproducibility story.

### Q4 — Chainguard + PCC verification layer?

**Partial fit, compelling angle.** Chainguard doesn't have signed agents or agent identity primitives — their security model is at the artifact layer (containers, libs, skills), not the agent runtime. BUT: PCC's Capture Verification Protocol (CVP) could consume Chainguard SBOMs as an ALCOA+ evidence source. The story: *"Chainguard proves the agent's dependencies are clean. PCC proves the agent's actions are real."* Complementary layers.

---

## SUMMARY — scout-echo

**Chainguard in 3 sentences**: Chainguard hardens every layer of the software supply chain — containers, libraries, OS packages, VMs, GitHub Actions, and (new) AI agent skills — by rebuilding artifacts from verified source with zero known CVEs. The Factory 2.0 engine is an AI-native self-correcting pipeline that continuously reconciles the Agent Skills catalog against security rules. Free tier covers individual developers for Containers (no auth) and Libraries (30-day pull token).

**3 concrete integrations for PCC hackathon entry**:
1. **Base image swap**: `FROM cgr.dev/chainguard/node:latest` in agent worker Dockerfile — zero-CVE runtime, trivial change, strong demo optics.
2. **`.npmrc` for Chainguard Libraries**: chainctl entitlement + pull token + root `.npmrc` — pnpm workspace pulls malware-resistant packages. Show the before/after SBOM diff.
3. **Install cgstart as local skill** + **bridge SBOMs into PCC CVP**: chainctl-generated SBOM becomes an ALCOA+ evidence artifact consumed by the verification protocol.

**Winning-track angle**: "Verifiable AI agents, end to end." Chainguard covers artifact provenance; PCC covers action provenance. Demo script: run the operator agent in a Chainguard container, prove `chainctl images list` shows zero CVEs on the base, then show PCC capturing/hashing every tool call made by that same agent. The judge sees two supply-chain layers fused into one story — exactly the "secure agentic coding" thesis Dan Lorenc stated.

**Gaps/unknowns**:
- SLSA L3 claim from PDF not verified on public web as of scrape
- Factory 2.0 has no public integration API — consumers use the output artifacts only
- Agent Skills catalog is beta/contact-only — can't automate evaluation
- Library ecosystem coverage limited to Python/Java/JavaScript (no Go/Rust yet)
- Unclear if "Chainguard Agent Skills" uses a signed/provenance-attested format distinct from vanilla SKILL.md
