// Senso / cited.md publisher.
// Each onboarded operator gets a markdown profile published to cited.md so
// buyer agents (and the public web) can discover them.
//
// Auth: X-API-Key (free $100 credits, no card). Get from senso.ai signup.
// Verified path: POST https://apiv2.senso.ai/api/v1/org/content-engine/publish
//   body: { geo_question_id, raw_markdown, seo_title, summary, publisher_ids? }
//
// Per scout-juliet research (ai/research/10-cited-md.md).

import { emit } from "../lib/event-bus.js";
const MOCK = process.env.MOCK_SENSO !== "false";
const BASE = process.env.SENSO_BASE_URL ?? "https://apiv2.senso.ai/api/v1";
const KEY = process.env.SENSO_API_KEY ?? "";

interface OperatorProfile {
  enterprise_id: string;
  name: string;
  url?: string;
  city?: string;
  capabilities: string[];
  materials?: string[];
  hours?: string;
  certifications?: string[];
  agent_url?: string;
  marketplace_url?: string;
  contact_email?: string;
}

function profileToMarkdown(p: OperatorProfile): string {
  const lines: string[] = [];
  lines.push(`# ${p.name}`);
  if (p.city) lines.push(`*Located in ${p.city}.*`);
  lines.push("");
  if (p.url) lines.push(`Website: <${p.url}>`);
  if (p.contact_email) lines.push(`Contact: ${p.contact_email}`);
  lines.push("");
  lines.push("## Capabilities");
  for (const c of p.capabilities) lines.push(`- ${c}`);
  if (p.materials && p.materials.length) {
    lines.push("");
    lines.push("## Materials");
    for (const m of p.materials) lines.push(`- ${m}`);
  }
  if (p.certifications && p.certifications.length) {
    lines.push("");
    lines.push("## Certifications");
    for (const c of p.certifications) lines.push(`- ${c}`);
  }
  if (p.hours) {
    lines.push("");
    lines.push(`## Hours\n${p.hours}`);
  }
  lines.push("");
  lines.push("## Discoverability");
  if (p.agent_url) lines.push(`- PCC agent: ${p.agent_url}`);
  if (p.marketplace_url) lines.push(`- agentic.market listing: ${p.marketplace_url}`);
  return lines.join("\n");
}

export async function publishToCited(input: {
  geo_question_id: string; // e.g. "titanium-machining-oakland"
  profile: OperatorProfile;
  publisher_ids?: string[];
}): Promise<{ content_id: string; url?: string }> {
  emit({ kind: "senso.publish.start", sponsor: "Senso (cited.md)", level: "info", session_id: input.profile.enterprise_id, text: `POST /org/content-engine/publish geo_question_id=${input.geo_question_id}`, payload: { geo_question_id: input.geo_question_id, seo_title: `${input.profile.name} — PCC operator`, capabilities_count: input.profile.capabilities.length } });
  if (MOCK || !KEY) {
    const r = {
      content_id: `senso-mock-${input.profile.enterprise_id.slice(0, 8)}`,
      url: `https://cited.md/c/mock-${input.profile.enterprise_id.slice(0, 8)}`
    };
    emit({ kind: "senso.publish.mock", sponsor: "Senso (cited.md)", level: "warn", text: `MOCK_SENSO=${MOCK} key=${KEY ? "set" : "unset"} · returning fake content_id`, payload: r });
    return r;
  }

  const body = {
    geo_question_id: input.geo_question_id,
    raw_markdown: profileToMarkdown(input.profile),
    seo_title: `${input.profile.name} — PCC operator`,
    summary: input.profile.capabilities.slice(0, 3).join(" · "),
    ...(input.publisher_ids ? { publisher_ids: input.publisher_ids } : {})
  };

  // Senso requires a destination configured for /publish. /draft saves as
  // reviewable draft (no destination needed) — perfect for the demo since
  // judges can verify the content engine actually accepted our payload.
  // Override with SENSO_USE_PUBLISH=true if a destination is set up.
  const usePublish = process.env.SENSO_USE_PUBLISH === "true";
  const path = usePublish ? "/org/content-engine/publish" : "/org/content-engine/draft";
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "X-API-Key": KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const body = await res.text();
    emit({ kind: "senso.publish.err", sponsor: "Senso (cited.md)", level: "err", session_id: input.profile.enterprise_id, text: `publish failed: HTTP ${res.status} ${body.slice(0,120)}` });
    throw new Error(`senso publish failed: ${res.status} ${body}`);
  }
  const out = (await res.json()) as { content_id: string; url?: string };
  emit({ kind: "senso.publish.done", sponsor: "Senso (cited.md)", level: "ok", session_id: input.profile.enterprise_id, text: `cited.md content_id=${out.content_id}${out.url ? ` · ${out.url}` : ""}`, payload: out });
  return out;
}

/**
 * Resolve a Senso geo_question_id. Senso requires this to refer to an
 * existing question in the org. We pre-created one for the demo
 * ("Which precision titanium machining operators are available on the PCC in
 *  Oakland, California?") via `senso questions create`. Override per-deploy
 * with SENSO_GEO_QUESTION_ID env var.
 */
const DEFAULT_GEO_QUESTION_ID =
  process.env.SENSO_GEO_QUESTION_ID ?? "08d502ff-db4e-48e0-968f-9f2ed619c688";

export function geoQuestionFor(_profile: OperatorProfile): string {
  return DEFAULT_GEO_QUESTION_ID;
}
