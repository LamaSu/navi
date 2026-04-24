import { Router } from "express";

export const jobsRouter = Router();

// TODO: wrap with @x402/express paymentMiddleware({ price: "$0.05", network: "base-sepolia" })
// Once wrapped, unauthenticated GET returns HTTP 402 with x402 headers.
jobsRouter.post("/", async (req, res) => {
  const { enterprise_id, kind, params } = req.body ?? {};
  res.json({
    ok: true,
    job_id: crypto.randomUUID(),
    enterprise_id,
    kind,
    params,
    note: "stub — x402 middleware TBD in A6"
  });
});
