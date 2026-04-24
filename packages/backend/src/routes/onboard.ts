import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { startSession, getSession, advanceSession } from "../onboard/state.js";
import { scrapeOrIngest } from "../tools/nexla.js";
import { scrapeEnterpriseSite } from "../tools/tinyfish.js";
import { signupInsforge } from "../tools/insforge.js";
import { forkGhost } from "../tools/ghost.js";
import { indexCapability } from "../tools/redis.js";
import { generateEnterpriseAgent } from "../onboard/generate.js";
import { publishToCited, geoQuestionFor } from "../tools/senso.js";

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
    res.status(201).json({ session_id: id, state: session.state });
  } catch (e) { next(e); }
});

onboardRouter.post("/:id/scrape", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { url, goal } = req.body as { url: string; goal?: string };
    // Run TinyFish + Nexla in parallel — TinyFish gives us a fast capability
    // draft from the website, Nexla creates a real ingestion pipeline.
    const [draft, pipeline] = await Promise.all([
      scrapeEnterpriseSite(url).catch((e) => ({ error: String(e) })),
      scrapeOrIngest({ session_id: id, url, goal: goal ?? "extract enterprise capabilities" })
    ]);
    await advanceSession(id, "data_connected", { tinyfish_draft: draft, nexla: pipeline });
    res.json({ tinyfish_draft: draft, nexla: pipeline });
  } catch (e) { next(e); }
});

onboardRouter.post("/:id/ingest-docs", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { doc_urls } = req.body as { doc_urls: string[] };
    const fork = await forkGhost({ session_id: id, docs: doc_urls });
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

    const backend = await signupInsforge({ name: session.name });
    await indexCapability({ session_id: id, capabilities: session.capabilities ?? [] });
    const agent = await generateEnterpriseAgent({ session, backend });

    // Publish operator profile to cited.md (Senso). Best-effort — failure here
    // shouldn't block the rest of the build.
    let cited: { content_id: string; url?: string } | { error: string };
    try {
      const profile = {
        enterprise_id: session.id,
        name: session.name,
        url: session.url,
        capabilities: (session.capabilities ?? []).map((c) => c.label),
        agent_url: agent.url,
        marketplace_url: agent.marketplace_url,
        contact_email: session.contact_email
      };
      cited = await publishToCited({ geo_question_id: geoQuestionFor(profile), profile });
    } catch (e) {
      cited = { error: e instanceof Error ? e.message : String(e) };
    }

    await advanceSession(id, "built", { agent, backend, cited });
    res.json({ agent, backend, cited });
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
