import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  url: z.string().url(),
  name: z.string().min(1).optional()
});

const EnterpriseDraft = z.object({
  name: z.string(),
  machines: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        kind: z.string().optional(),
        envelope: z.string().optional(),
        notes: z.string().optional()
      })
    )
    .default([]),
  hours: z.string().optional(),
  services: z.array(z.string()).default([]),
  contact: z.string().optional(),
  certifications: z.array(z.string()).default([])
});
type EnterpriseDraft = z.infer<typeof EnterpriseDraft>;

export async function POST(req: NextRequest) {
  const body = Body.parse(await req.json());
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "TINYFISH_API_KEY not set" }, { status: 500 });

  // Call TinyFish agent endpoint (streaming SSE)
  const upstream = await fetch("https://agent.tinyfish.ai/v1/automation/run-sse", {
    method: "POST",
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      url: body.url,
      goal:
        "Extract the company name, all production/machine equipment with model + kind + size envelope, operating hours, services, certifications, and primary contact email. Return structured JSON matching the EnterpriseDraft schema: { name, machines[{name,kind,envelope,notes}], hours, services[], contact, certifications[] }."
    })
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `tinyfish upstream failed: ${upstream.status}` },
      { status: 502 }
    );
  }

  // Parse SSE to find the final COMPLETE event
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let draft: EnterpriseDraft | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    // Simple SSE frame parse: blocks separated by blank line, field format `data: {json}`
    const frames = buf.split("\n\n");
    buf = frames.pop() ?? "";
    for (const frame of frames) {
      const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      try {
        const evt = JSON.parse(dataLine.slice(5).trim());
        if (evt.type === "COMPLETE" && evt.resultJson) {
          draft = EnterpriseDraft.parse(evt.resultJson);
        }
      } catch {
        // ignore partial/non-JSON frames
      }
    }
  }

  if (!draft) {
    return NextResponse.json({ error: "no COMPLETE event from tinyfish" }, { status: 502 });
  }

  // Hand off to our backend for the rest of the pipeline (Nexla, InsForge, Ghost, Redis, CDP, agentic.market, PCC)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";
  const handoff = await fetch(`${backendUrl}/onboard/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: draft.name, url: body.url })
  });
  const handoffBody = (await handoff.json()) as { session_id?: string };

  return NextResponse.json({
    tinyfish: draft,
    session_id: handoffBody.session_id,
    next: `${backendUrl}/onboard/${handoffBody.session_id}/build-agent`
  });
}
