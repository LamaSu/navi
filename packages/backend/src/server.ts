import "dotenv/config";
import express from "express";
import cors from "cors";
import { pino } from "pino";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { onboardRouter } from "./routes/onboard.js";
import { jobsRouter } from "./routes/jobs.js";
import { vapiRouter } from "./routes/vapi.js";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });
const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// In-memory event log — every meaningful integration call appends here.
// The chat console polls /events to render activity live.
interface AppEvent { t: number; kind: string; sponsor?: string; text: string; session_id?: string }
const eventLog: AppEvent[] = [];
const MAX_EVENTS = 200;
function pushEvent(e: Omit<AppEvent, "t">) {
  eventLog.push({ ...e, t: Date.now() });
  if (eventLog.length > MAX_EVENTS) eventLog.shift();
}
(app as any).pushEvent = pushEvent;
(app as any).eventLog = eventLog;

// Static console at / — the live onboarding UI the pointman uses on the phone.
// `extensions: ["html"]` makes /op resolve to /op.html (cleaner demo URLs).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.resolve(__dirname, "..", "public"), { extensions: ["html"] }));

app.use((req, _res, next) => {
  (req as any).trace_id = randomUUID();
  log.info({ trace: (req as any).trace_id, method: req.method, url: req.url });
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Live event feed — chat console polls this for the activity stream
app.get("/events", (req, res) => {
  const since = Number(req.query.since ?? 0);
  res.json({ events: eventLog.filter((e) => e.t > since) });
});

// Active Vapi calls — chat console polls to mirror the voice transcript
app.get("/calls/active", async (_req, res) => {
  try {
    const key = process.env.VAPI_PRIVATE_KEY;
    const phoneId = process.env.VAPI_PHONE_NUMBER_ID;
    if (!key) return res.json({ calls: [] });
    const r = await fetch(
      `${process.env.VAPI_BASE_URL ?? "https://api.vapi.ai"}/v2/call?page=1&limit=5&sortOrder=DESC${phoneId ? `&phoneNumberId=${phoneId}` : ""}`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    if (!r.ok) return res.json({ calls: [] });
    const data: any = await r.json();
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    const projection = list.slice(0, 5).map((c: any) => ({
      id: c.id ?? c.callId,
      status: c.status,
      startedAt: c.startedAt ?? c.createdAt,
      endedAt: c.endedAt,
      transcript: c.transcript ?? c.artifact?.transcript ?? null,
      messages: (c.messages ?? c.artifact?.messages ?? []).slice(-20)
    }));
    res.json({ calls: projection });
  } catch (e) {
    res.json({ calls: [], error: e instanceof Error ? e.message : String(e) });
  }
});

// Push text into an active Vapi call — chat input → voice mouth
app.post("/calls/:id/say", async (req, res) => {
  try {
    const key = process.env.VAPI_PRIVATE_KEY;
    if (!key) return res.status(500).json({ error: "VAPI_PRIVATE_KEY not set" });
    const { id } = req.params;
    const { message } = req.body as { message: string };
    const r = await fetch(`${process.env.VAPI_BASE_URL ?? "https://api.vapi.ai"}/call/${id}/control`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "say", message, endCallAfterSpoken: false })
    });
    const body = await r.text();
    pushEvent({ kind: "voice-inject", sponsor: "Vapi", text: `→ "${message}"` });
    res.status(r.status).type("json").send(body || "{}");
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.use("/onboard", onboardRouter);
app.use("/jobs", jobsRouter);
app.use("/vapi", vapiRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  log.error({ err: err.message, stack: err.stack });
  res.status(500).json({ error: err.message });
});

app.listen(port, () => {
  log.info(`backend listening on :${port}`);
});
