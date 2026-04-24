import { Router } from "express";
import { runTaskRunner } from "../onboard/task-runner.js";

export const vapiRouter = Router();

/**
 * Real-time webhook from Vapi during a live call: function-call,
 * status-update, end-of-call-report. We mostly ack and let the
 * structured-output land in the call record; the Task Runner pulls it later.
 */
vapiRouter.post("/webhook", async (req, res) => {
  const event = req.body;
  const type = event?.message?.type ?? event?.type;
  switch (type) {
    case "function-call": {
      const call = event.message?.functionCall;
      // Map function-call name → onboard state-machine action (stub for demo)
      return res.json({ result: { ok: true, echo: call?.name } });
    }
    case "status-update":
      return res.json({ ok: true });
    case "end-of-call-report":
      return res.json({ ok: true, captured: true });
    default:
      return res.json({ ok: true, noop: true });
  }
});

/**
 * On-demand "fetch the latest call's structured tasks and execute them."
 * Drives the demo: stage hits this after the phone hangs up; result
 * shows the assistant's intent + tasks executed.
 */
vapiRouter.post("/task-runner", async (_req, res, next) => {
  try {
    const result = await runTaskRunner();
    res.json(result);
  } catch (e) {
    next(e);
  }
});
