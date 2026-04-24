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

// Static console at / — the live onboarding UI the pointman uses on the phone
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.resolve(__dirname, "..", "public")));

app.use((req, _res, next) => {
  (req as any).trace_id = randomUUID();
  log.info({ trace: (req as any).trace_id, method: req.method, url: req.url });
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

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
