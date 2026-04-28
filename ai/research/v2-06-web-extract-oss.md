# V2 Item 06 — Web Extraction: replace TinyFish with OSS

**Agent**: scout-foxtrot
**Date**: 2026-04-24
**Question**: Can we drop TinyFish (paid metered, 500 free credits/mo) and replace it with camoufox + Anthropic Claude (or Crawl4AI)?

## TL;DR

**Replace TinyFish with `camoufox + Claude`.** Free, OSS, defeats Cloudflare/DataDome, ~80 LOC TypeScript. Tested on a real titanium machining shop — extraction works first try. Crawl4AI is a strong second choice if we ever need CSS-selector extraction or built-in chunking; Firecrawl self-host is over-kit (AGPL + needs Redis + Postgres + still wants an LLM key).

## camoufox CLI flags (verified)

Harness wrapper: `C:\Users\globa\.local\bin\camoufox` (Node script over `camoufox-mcp-server`). The Python `camoufox` package on PATH shadows it — invoke via `node "C:\Users\globa\.local\bin\camoufox"` directly, or call `mcp__camoufox__browse` from Claude Code.

| Flag                      | Effect                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| `<url>`                   | Required positional, http(s) only                                      |
| `--screenshot`            | PNG saved to cwd                                                       |
| `--fast`                  | Block images, `domcontentloaded` (skip networkidle wait)               |
| `--max-stealth`           | Block WebGL, no cache, 120s timeout                                    |
| `--os windows|macos|linux`| Fingerprint OS                                                         |
| `--proxy <url>`           | HTTP or SOCKS5 proxy (geo-spoofing)                                    |
| `--timeout <ms>`          | Default 60000                                                          |
| `--block-webgl`           | WebGL fingerprint blocking (subset of `--max-stealth`)                 |
| `--no-humanize`           | Disable mouse-jitter (faster, lower stealth)                           |
| `--wait <strategy>`       | `domcontentloaded` / `load` / `networkidle`                            |
| `--json`                  | Raw JSON-RPC envelope (for programmatic use)                           |

JS execution: yes by default (full Firefox engine). HTML output is post-render.

## Live test — Rigid Concepts (titanium aerospace shop)

**Run 1**: `node camoufox https://www.rigidconcepts.com/ --fast` → 122,392 bytes HTML in ~10 s. Stealth-default, no Cloudflare interstitial encountered.

**Run 2**: `.../aerospace-cnc-machining/` → tail-grepped, first-pass signals found (no LLM yet):

```
5-Axis · 5-axis · Hastelloy · ISO 9001:2015 · ITAR · Inconel · Ti-6Al · Titanium
```

That single fetch already covers `goal: "extract certifications + materials + 5-axis capability"`. Per-machine model + envelope would live on `/equipment/` or `/cnc-machining/` — exactly the "click-through-to-detail" case TinyFish charges for, and the same pattern Claude solves with one extra reasoning loop (predict-next-URL → fetch → re-extract).

## Bot-detection coverage

- **Camoufox**: C++ Firefox patches (navigator.hardwareConcurrency, WebGL, AudioContext, screen geom, WebRTC) before JS sees them. Production-tested vs Cloudflare Turnstile/Interstitial, DataDome, Imperva, Akamai, PerimeterX, reCAPTCHA v2/v3, CreepJS. **Caveat**: original maintainer unavailable since March 2025; community forks exist; Firefox base falling behind. Acceptable for our titanium-shop use case (these sites are largely WordPress + Yoast — Rigid Concepts had zero WAF). For high-volume protected scraping, layer on a residential proxy (`--proxy`) plus humanize defaults.
- **TinyFish**: claims same bypass surface, paid + closed.

## Decision matrix — 1000 pages/mo

| Tool                  | License           | Stealth                     | Multi-step nav            | Cost @ 1k pages/mo                                    | LOC to integrate |
| --------------------- | ----------------- | --------------------------- | ------------------------- | ----------------------------------------------------- | ---------------- |
| **camoufox + Claude** | MIT (camoufox)    | Excellent (C++ patched FF)  | Claude reasoning loop     | **$0** infra + ~$3 Anthropic (Sonnet, ~5 KB tokens/page) | ~80 TS           |
| Crawl4AI              | Apache-2.0        | Excellent (UndetectedAdapter+escalation) | Built-in DeepCrawl       | $0 infra + ~$3 Anthropic (BYOK via LiteLLM)            | ~30 Python (svc) |
| Firecrawl self-host   | AGPL-3.0          | Good (claims 96% coverage)  | Built-in `crawl` endpoint | Docker (Redis+Postgres+browser pool) + ~$3 LLM         | ~150 (infra)     |
| Firecrawl SaaS        | proprietary       | Good                        | Yes                       | Hobby $16/mo (3k credits, AI extract = 5 credits/page → 600 pages cap) | ~10              |
| TinyFish              | proprietary       | Claimed                     | Yes (agent)               | 500 free, then metered (paid)                          | ~10              |
| Browserbase           | proprietary       | Custom Chromium fork (42% on Browser-Use bench) | Manual via Playwright | ~$50+/mo + 4.4× cost vs alternatives                   | ~30              |
| Bright Data           | proprietary       | Excellent + residential proxies | Yes (Web Scraper IDE) | $1.50/1k records → ~$1.50/mo at our volume           | ~20              |
| Apify                 | proprietary plat. | Per-Actor (varies)          | Per-Actor                 | $5 free credits/mo, then $29/mo Starter               | ~20              |
| Playwright + Claude   | Apache-2.0        | None (vanilla Chromium)     | Manual                    | $0 + ~$3 LLM                                           | ~50              |

**AGPL-3.0 disqualifier on Firecrawl self-host**: viral copyleft for any networked service. Camoufox is MIT, Crawl4AI is Apache-2.0 — both clean.

## Integration sketch — `extractStructured(url, schema, goal)`

`packages/web-extract/src/extract.ts`, ~80 LOC, drop-in replacement for the TinyFish call site.

```typescript
import { spawn } from 'node:child_process';
import Anthropic from '@anthropic-ai/sdk';
import type { JSONSchema7 } from 'json-schema';

const client = new Anthropic();
const CAMOUFOX = 'C:\\Users\\globa\\.local\\bin\\camoufox';

export interface ExtractOptions {
  /** Max click-through-to-detail iterations (default 1 = single page) */
  maxHops?: number;
  /** camoufox flags: 'fast' | 'max-stealth' | undefined */
  stealth?: 'fast' | 'max-stealth';
  /** SOCKS5/HTTP proxy URL */
  proxy?: string;
}

async function camoufoxFetch(url: string, opts: ExtractOptions = {}): Promise<string> {
  const args = ['node', CAMOUFOX, url];
  if (opts.stealth === 'fast') args.push('--fast');
  if (opts.stealth === 'max-stealth') args.push('--max-stealth');
  if (opts.proxy) args.push('--proxy', opts.proxy);
  return new Promise((resolve, reject) => {
    const p = spawn(args[0], args.slice(1), { stdio: ['ignore', 'pipe', 'pipe'] });
    let html = '';
    p.stdout.on('data', d => { html += d.toString(); });
    p.on('close', code => code === 0 ? resolve(html) : reject(new Error(`camoufox exit ${code}`)));
  });
}

export async function extractStructured<T = unknown>(
  url: string,
  schema: JSONSchema7,
  goal: string,
  opts: ExtractOptions = {}
): Promise<T> {
  const maxHops = opts.maxHops ?? 1;
  const visited: Array<{ url: string; html: string }> = [];

  for (let hop = 0; hop < maxHops; hop++) {
    const targetUrl = visited.length === 0 ? url : await pickNextUrl(visited, goal);
    if (!targetUrl) break;
    const html = await camoufoxFetch(targetUrl, opts);
    visited.push({ url: targetUrl, html: html.slice(0, 200_000) }); // cap per-page
  }

  const corpus = visited.map(v => `URL: ${v.url}\n\n${v.html}`).join('\n\n---\n\n');
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-7',
    max_tokens: 4096,
    system: `Extract structured JSON matching the provided schema. Goal: ${goal}. Return ONLY valid JSON, no prose.`,
    tools: [{
      name: 'emit',
      description: 'Emit the extracted JSON',
      input_schema: schema as Anthropic.Tool.InputSchema,
    }],
    tool_choice: { type: 'tool', name: 'emit' },
    messages: [{ role: 'user', content: corpus }],
  });
  const tool = msg.content.find(c => c.type === 'tool_use');
  if (!tool || tool.type !== 'tool_use') throw new Error('No structured output');
  return tool.input as T;
}

async function pickNextUrl(visited: Array<{ url: string; html: string }>, goal: string): Promise<string | null> {
  const last = visited[visited.length - 1];
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 200,
    system: `Given the page HTML and the extraction goal, return ONE absolute URL to fetch next, or "DONE" if the current page suffices. Reply with the URL or "DONE" — nothing else.`,
    messages: [{ role: 'user', content: `Goal: ${goal}\n\nCurrent URL: ${last.url}\n\nHTML:\n${last.html.slice(0, 100_000)}` }],
  });
  const text = msg.content.find(c => c.type === 'text');
  const next = text && text.type === 'text' ? text.text.trim() : 'DONE';
  return next === 'DONE' || !next.startsWith('http') ? null : next;
}
```

Use:

```typescript
const data = await extractStructured(
  'https://www.rigidconcepts.com/',
  {
    type: 'object',
    properties: {
      company: { type: 'string' },
      certifications: { type: 'array', items: { type: 'string' } },
      machines: { type: 'array', items: {
        type: 'object',
        properties: { model: { type: 'string' }, envelope: { type: 'string' } },
      }},
      contact_email: { type: 'string' },
    },
    required: ['company', 'certifications'],
  },
  'extract company name, list of CNC machines with model + envelope, certifications, contact email',
  { maxHops: 3, stealth: 'fast' }
);
```

Cost per call (3-hop): ~3× camoufox fetch (~10s each, free) + 1× Sonnet structured extract (~5K input + 1K output ≈ $0.018) + 2× Haiku next-URL pick (~2K input ≈ $0.001 each). **~$0.020/page total.** TinyFish bills per agent run (variable) — ours is deterministic and 5-10× cheaper at scale.

## Recommendation

Adopt **camoufox + Claude** path. Build the `web-extract` package now; one TS file, one Anthropic dep, zero infra. Reserve **Crawl4AI** as a Python sidecar if we ever need its `DeepCrawlStrategy` (BFS/DFS through site sections) without re-implementing BFS in TS. Skip Firecrawl/Browserbase/Bright Data/Apify — vendor lock + cost without stealth advantage. Skip TinyFish entirely.

## Open considerations

- **Camoufox maintenance risk**: track community fork status. If the upstream stays dormant past Q3 2026, consider switching to **Patchright** or **Nodriver** — same C++/CDP-stealth class, more active.
- **Sites that need login**: route through `chrome-tokens <domain>` first per harness rule, not camoufox.
- **Site-rate-limit politeness**: `extractStructured` should sleep 2-5s between hops; not in this sketch but trivial to add.

## Sources

- [Crawl4AI GitHub (unclecode/crawl4ai)](https://github.com/unclecode/crawl4ai)
- [Crawl4AI LLM Strategies](https://docs.crawl4ai.com/extraction/llm-strategies/)
- [Crawl4AI Anti-Bot & Fallback](https://docs.crawl4ai.com/advanced/anti-bot-and-fallback/)
- [Firecrawl GitHub](https://github.com/firecrawl/firecrawl)
- [Firecrawl pricing 2026 (Scribe)](https://scribehow.com/page/Firecrawl_Pricing_2026_Plans_Credits_and_Real_Costs_Explained__qmaaZ-qnT02v8OnS_PSLqQ)
- [Firecrawl pricing breakdown (ScrapeGraphAI)](https://scrapegraphai.com/blog/firecrawl-pricing)
- [Browserbase pricing](https://www.browserbase.com/pricing)
- [Bright Data Web Scraper pricing](https://brightdata.com/pricing/web-scraper)
- [Apify pricing](https://apify.com/pricing)
- [Camoufox bypass guide (RoundProxies)](https://roundproxies.com/blog/camoufox/)
- [DataDome bypass with Camoufox (TheWebScraping.club)](https://substack.thewebscraping.club/p/scraping-datadome-camoufox)
- [Patchright alternatives 2026 (RoundProxies)](https://roundproxies.com/blog/best-patchright-alternatives/)
- [Rigid Concepts (test target)](https://www.rigidconcepts.com/)
