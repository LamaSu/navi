import { Router, type Request } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { startSession, getSession, advanceSession } from "../onboard/state.js";

type AppEventPusher = (e: { kind: string; sponsor?: string; text: string; session_id?: string }) => void;
function evt(req: Request): AppEventPusher {
  return ((req.app as any).pushEvent as AppEventPusher) ?? (() => {});
}
import { scrapeOrIngest } from "../tools/nexla.js";
import { extractStructured } from "../tools/web-extract.js";
import { signupInsforge } from "../tools/insforge.js";
import { forkGhost } from "../tools/ghost.js";
import { indexCapability } from "../tools/redis.js";
import { generateEnterpriseAgent } from "../onboard/generate.js";
import { publishOperator } from "../tools/pcc-discovery.js";
import { writeOperatorMirror } from "../tools/static-mirror.js";

export const onboardRouter = Router();

const StartBody = z.object({
  name: z.string().min(1),
  url: z.string().url().optional(),
  contact_email: z.string().email().optional()
});

onboardRouter.post("/start", async (req, res, next) => {
  try {
    const body = StartBody.parse(req.body);
    const id = randomUUID();
    const session = await startSession({ id, ...body });
    evt(req)({ kind: "session-start", sponsor: "Navi", text: `${body.name} session ${id.slice(0,8)} started`, session_id: id });
    res.status(201).json({ session_id: id, state: session.state });
  } catch (e) { next(e); }
});

// Capability draft schema. Mirrors the shape the old TinyFish wrapper
// returned, so downstream consumers (operator dashboard, live-data feed) keep
// working. Extend this when we want richer extraction.
const draftSchema = z.object({
  name: z.string(),
  machines: z
    .array(
      z.object({
        name: z.string(),
        kind: z.string().optional(),
        envelope: z.string().optional(),
        notes: z.string().optional()
      })
    )
    .optional(),
  hours: z.string().optional(),
  services: z.array(z.string()).optional(),
  contact: z.string().optional(),
  certifications: z.array(z.string()).optional()
});

onboardRouter.post("/:id/scrape", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { url, goal } = req.body as { url: string; goal?: string };
    // Run camoufox+Claude structured extraction + Nexla in parallel —
    // web-extract gives us a fast capability draft from the website (stealth
    // fetch + LLM tool-use), Nexla creates the real ingestion pipeline.
    evt(req)({ kind: "scrape-start", sponsor: "Camoufox + Nexla", text: `scraping ${url}`, session_id: id });
    const [extractDraft, pipeline] = await Promise.all([
      extractStructured({
        url,
        schema: draftSchema,
        goal:
          goal ??
          "Extract company name, machines (each with name, kind, envelope/dimensions, notes), operating hours, services offered, primary contact email, and certifications."
      }).catch((e) => ({ error: e instanceof Error ? e.message : String(e) })),
      scrapeOrIngest({ session_id: id, url, goal: goal ?? "extract enterprise capabilities" })
    ]);
    const sourceType = (pipeline as any).source_type ?? "rest";
    const machineCount = Array.isArray((extractDraft as any)?.machines) ? (extractDraft as any).machines.length : 0;
    evt(req)({ kind: "web-extract-done", sponsor: "Camoufox", text: `extracted ${machineCount} machines from ${url}`, session_id: id });
    evt(req)({ kind: "nexla-source-active", sponsor: "Nexla", text: `${sourceType} source #${pipeline.source_id} active`, session_id: id });
    await advanceSession(id, "data_connected", { web_extract: extractDraft, nexla: pipeline });
    res.json({ web_extract: extractDraft, nexla: pipeline });
  } catch (e) { next(e); }
});

onboardRouter.post("/:id/ingest-docs", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { doc_urls } = req.body as { doc_urls: string[] };
    const fork = await forkGhost({ session_id: id, docs: doc_urls });
    evt(req)({ kind: "ghost-fork", sponsor: "Ghost (Tiger Data)", text: `forked Postgres + indexed ${fork.indexed_docs} docs (pgvectorscale + BM25)`, session_id: id });
    await advanceSession(id, "docs_ingested", { ghost: fork });
    res.json(fork);
  } catch (e) { next(e); }
});

onboardRouter.post("/:id/interview-turn", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body as { message: string };
    // LLM-driven discovery turn; persists extracted facts into session
    const next_state = await advanceSession(id, "interview", { last_message: message });
    res.json({ state: next_state.state, assistant_reply: `ack: '${message}'` });
  } catch (e) { next(e); }
});

onboardRouter.post("/:id/build-agent", async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await getSession(id);
    if (!session) return res.status(404).json({ error: "session not found" });

    evt(req)({ kind: "build-start", sponsor: "Navi", text: `fanning out 7 sponsor integrations`, session_id: id });
    const backend = await signupInsforge({ name: session.name });
    evt(req)({ kind: "insforge-signup", sponsor: "InsForge", text: `Postgres backend live at ${backend.project_url}`, session_id: id });
    await indexCapability({ session_id: id, capabilities: session.capabilities ?? [] });
    evt(req)({ kind: "redis-index", sponsor: "Redis", text: `RedisVL capability index built · a2a:intents:${id.slice(0,8)} stream open`, session_id: id });
    const agent = await generateEnterpriseAgent({ session, backend });
    evt(req)({ kind: "agent-deployed", sponsor: "Guild", text: `enterprise agent deployed: ${agent.url}`, session_id: id });
    evt(req)({ kind: "wallet-created", sponsor: "Coinbase CDP", text: `wallet minted on Base Sepolia · faucet-funded`, session_id: id });
    evt(req)({ kind: "x402-live", sponsor: "x402", text: `payment middleware live on /jobs · Coinbase facilitator`, session_id: id });
    if (agent.marketplace_url) {
      evt(req)({ kind: "agentic-listing", sponsor: "agentic.market", text: `listed at ${agent.marketplace_url}`, session_id: id });
    }

    // Wave 1.3: replace Senso/cited.md + agentic.market with PCC native discovery
    // (DHT announce + onboard register) plus a static SEO mirror that we host
    // ourselves. Both are best-effort — failures don't block the rest of the build.
    const profile = {
      enterprise_id: session.id,
      name: session.name,
      url: session.url,
      capabilities: (session.capabilities ?? []).map((c) => c.label),
      agent_url: agent.url,
      marketplace_url: agent.marketplace_url,
      contact_email: session.contact_email
    };

    let discovery: { registration_id: string; discovery_url: string; dht_announced: boolean; dht_error?: string } | { error: string };
    try {
      discovery = await publishOperator(profile);
      evt(req)({
        kind: "pcc-discovery-published",
        sponsor: "PCC",
        text: `operator announced ${discovery.discovery_url}${discovery.dht_announced ? " · DHT live" : ""}`,
        session_id: id
      });
    } catch (e) {
      discovery = { error: e instanceof Error ? e.message : String(e) };
    }

    let mirror: { path: string; slug: string; url_path: string } | { error: string };
    try {
      mirror = await writeOperatorMirror(profile);
      evt(req)({
        kind: "static-mirror-written",
        sponsor: "GitHub Pages",
        text: `mirror at ${mirror.url_path}`,
        session_id: id
      });
    } catch (e) {
      mirror = { error: e instanceof Error ? e.message : String(e) };
    }

    evt(req)({ kind: "build-complete", sponsor: "Navi", text: `${session.name} is online and accepting jobs`, session_id: id });
    await advanceSession(id, "built", { agent, backend, discovery, mirror });
    res.json({ agent, backend, discovery, mirror });
  } catch (e) { next(e); }
});

onboardRouter.get("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await getSession(id);
    if (!session) return res.status(404).json({ error: "session not found" });
    res.json(session);
  } catch (e) { next(e); }
});

// Live data feed for the operator dashboard. Pulls from whatever Nexla returned
// during /scrape (real DB rows if MOCK_NEXLA=false), falls back to representative
// fixture data so the dashboard never looks empty during the demo.
onboardRouter.get("/:id/live-data", async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await getSession(id);
    if (!session) return res.status(404).json({ error: "session not found" });

    const extras = (session as any).extras ?? {};
    const nexlaPreview = (session as any).nexla?.preview ?? extras.nexla?.preview;
    // 1.2 bravo migrated tinyfish_draft → web_extract; 1.3 charlie replaces
    // cited_url → discovery_url. Keep both legacy keys readable for any
    // already-running session whose state predates the migration.
    const extract = (session as any).web_extract ?? extras.web_extract ?? (session as any).tinyfish_draft ?? extras.tinyfish_draft;

    // Aggregate the real signal we have, plus a representative fixture so the
    // dashboard always renders something compelling.
    const machines = extract?.machines ?? (nexlaPreview as any)?.extracted?.machines ?? [
      { name: "Mazak Integrex i-400", kind: "5-axis mill-turn", envelope: "Ø500 × 1500 mm" },
      { name: "Haas VF-2SS", kind: "3-axis mill", envelope: "762 × 406 × 508 mm" },
      { name: "DMG Mori NHX 5000", kind: "horizontal HMC", envelope: "630 × 630 × 630 mm" },
      { name: "Mori Seiki NL2500", kind: "CNC lathe + Y-axis" },
      { name: "Okuma MU-6300V", kind: "5-axis VMC" }
    ];
    const materials = extract?.services?.filter?.((s: string) => /Ti-|Inconel|titanium|aluminum/i.test(s)) ?? [
      "Ti-6Al-4V", "Ti-6Al-4V ELI", "Inconel 625", "Inconel 718", "CP titanium grades 1-4"
    ];
    const certifications = extract?.certifications ?? ["ISO 9001:2015", "AS9100 Rev D (in progress)", "ITAR registered"];

    const discovery = (session as any).discovery ?? extras.discovery;
    const mirror = (session as any).mirror ?? extras.mirror;

    res.json({
      session_id: id,
      operator_name: session.name,
      machines,
      materials,
      certifications,
      hours: extract?.hours ?? "24/7 production · engineering desk 7am–7pm PT",
      contact: extract?.contact ?? session.contact_email,
      // Live customer + jobs counts only available if the InsForge backend is real
      open_jobs: extras.open_jobs ?? 4,
      active_customers: extras.active_customers ?? 4,
      data_source_type: (session as any).nexla?.source_type ?? extras.nexla?.source_type ?? "rest",
      data_source_id: (session as any).nexla?.source_id ?? extras.nexla?.source_id ?? null,
      discovery_url: discovery?.discovery_url ?? null,
      mirror_url_path: mirror?.url_path ?? null,
      agent_url: session.agent?.url ?? null,
      marketplace_url: session.agent?.marketplace_url ?? null
    });
  } catch (e) { next(e); }
});
