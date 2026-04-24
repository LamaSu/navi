import { Router } from "express";

export const vapiRouter = Router();

// Vapi sends webhooks here: function-call / status-update / end-of-call-report
vapiRouter.post("/webhook", async (req, res) => {
  const event = req.body;
  const type = event?.message?.type ?? event?.type;

  switch (type) {
    case "function-call": {
      const call = event.message.functionCall;
      // Map function-call name → onboard state-machine action
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
