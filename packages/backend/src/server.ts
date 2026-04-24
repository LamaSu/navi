import "dotenv/config";
import express from "express";
import cors from "cors";
import { pino } from "pino";
import { randomUUID } from "node:crypto";
import { onboardRouter } from "./routes/onboard.js";
import { jobsRouter } from "./routes/jobs.js";
import { vapiRouter } from "./routes/vapi.js";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });
const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

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
