import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { startSession, getSession, advanceSession } from "../onboard/state.js";
import { scrapeOrIngest } from "../tools/nexla.js";
import { signupInsforge } from "../tools/insforge.js";
import { forkGhost } from "../tools/ghost.js";
import { indexCapability } from "../tools/redis.js";
import { generateEnterpriseAgent } from "../onboard/generate.js";

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
    const result = await scrapeOrIngest({ session_id: id, url, goal: goal ?? "extract enterprise capabilities" });
    await advanceSession(id, "data_connected", { nexla: result });
    res.json(result);
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
    await advanceSession(id, "built", { agent, backend });
    res.json({ agent, backend });
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
