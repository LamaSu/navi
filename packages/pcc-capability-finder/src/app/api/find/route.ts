import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  query: z.string().min(4),
  max_candidates: z.number().int().min(1).max(20).default(5)
});

const Candidate = z.object({
  operator_id: z.string(),
  name: z.string(),
  url: z.string().url().optional(),
  materials: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default([]),
  typical_lead_time_days: z.number().optional(),
  price_hint_usd: z.number().optional(),
  certifications: z.array(z.string()).default([]),
  contact_url: z.string().optional()
});
const Candidates = z.object({ candidates: z.array(Candidate) });
type Candidate = z.infer<typeof Candidate>;

export async function POST(req: NextRequest) {
  const body = Body.parse(await req.json());
  const key = process.env.TINYFISH_API_KEY;
  if (!key) return NextResponse.json({ error: "TINYFISH_API_KEY not set" }, { status: 500 });

  // 1. Ask a TinyFish agent to search PCC's operator catalog for matches
  const upstream = await fetch("https://agent.tinyfish.ai/v1/automation/run-sse", {
    method: "POST",
    headers: { "X-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      url: "https://capability.network/operators",
      goal: `Find up to ${body.max_candidates} operators on PCC that can fulfil this job: "${body.query}". For each candidate, return an object: { operator_id, name, url, materials, capabilities, typical_lead_time_days, price_hint_usd, certifications, contact_url }. Rank by fit. Return JSON { candidates: [...] }.`
    })
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `tinyfish upstream failed: ${upstream.status}` },
      { status: 502 }
    );
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let found: Candidate[] | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const frames = buf.split("\n\n");
    buf = frames.pop() ?? "";
    for (const frame of frames) {
      const data = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!data) continue;
      try {
        const ev = JSON.parse(data.slice(5).trim());
        if (ev.type === "COMPLETE" && ev.resultJson) {
          found = Candidates.parse(ev.resultJson).candidates;
        }
      } catch {
        // ignore partial or non-JSON frames
      }
    }
  }

  if (!found) return NextResponse.json({ error: "no COMPLETE event" }, { status: 502 });

  // 2. Enrich each candidate with an x402 quote from its /jobs endpoint
  const enriched = await Promise.all(
    found.map(async (c) => {
      if (!c.url) return c;
      try {
        const jobs = await fetch(new URL("/jobs", c.url).toString(), { method: "POST", body: "{}" });
        if (jobs.status === 402) {
          const header = jobs.headers.get("x-402") ?? jobs.headers.get("x-payment-required");
          return { ...c, x402_header: header ?? undefined };
        }
      } catch {
        // best-effort
      }
      return c;
    })
  );

  return NextResponse.json({ query: body.query, candidates: enriched });
}
