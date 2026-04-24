// Senso / cited.md publisher.
// Each onboarded operator gets a markdown profile published to cited.md so
// buyer agents (and the public web) can discover them.
//
// Auth: X-API-Key (free $100 credits, no card). Get from senso.ai signup.
// Verified path: POST https://apiv2.senso.ai/api/v1/org/content-engine/publish
//   body: { geo_question_id, raw_markdown, seo_title, summary, publisher_ids? }
//
// Per scout-juliet research (ai/research/10-cited-md.md).

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
  if (MOCK || !KEY) {
    return {
      content_id: `senso-mock-${input.profile.enterprise_id.slice(0, 8)}`,
      url: `https://cited.md/c/mock-${input.profile.enterprise_id.slice(0, 8)}`
    };
  }

  const body = {
    geo_question_id: input.geo_question_id,
    raw_markdown: profileToMarkdown(input.profile),
    seo_title: `${input.profile.name} — PCC operator`,
    summary: input.profile.capabilities.slice(0, 3).join(" · "),
    ...(input.publisher_ids ? { publisher_ids: input.publisher_ids } : {})
  };

  const res = await fetch(`${BASE}/org/content-engine/publish`, {
    method: "POST",
    headers: {
      "X-API-Key": KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`senso publish failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { content_id: string; url?: string };
}

/**
 * Pick or create a geo_question_id for the operator's primary capability.
 * Hackathon: just slugify capability + city.
 */
export function geoQuestionFor(profile: OperatorProfile): string {
  const primary =
    profile.capabilities[0]?.toLowerCase().replace(/\s+/g, "-") ?? "general-machining";
  const city = (profile.city ?? "unknown").toLowerCase().replace(/\s+/g, "-");
  return `${primary}-${city}`;
}
