import { emit } from "../lib/event-bus.js";
const MOCK = process.env.MOCK_INSFORGE !== "false";

export async function signupInsforge(input: {
  name: string;
}): Promise<{ project_url: string; anon_key: string; claim_url: string }> {
  emit({ kind: "insforge.signup.start", sponsor: "InsForge", level: "info", text: `POST /agents/v1/signup name="${input.name}"`, payload: { name: input.name } });
  if (MOCK) {
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const r = {
      project_url: `https://${slug}.region.insforge.app`,
      anon_key: "mock-anon-key",
      claim_url: `https://insforge.dev/claim/${slug}`
    };
    emit({ kind: "insforge.signup.mock", sponsor: "InsForge", level: "warn", text: `MOCK_INSFORGE=true · returning fake project ${r.project_url}`, payload: r });
    return r;
  }

  // POST https://api.insforge.dev/agents/v1/signup → { accessApiKey, projectUrl, claimUrl }
  const res = await fetch("https://api.insforge.dev/agents/v1/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: input.name })
  });
  if (!res.ok) {
    emit({ kind: "insforge.signup.err", sponsor: "InsForge", level: "err", text: `signup failed: HTTP ${res.status}` });
    throw new Error(`insforge signup failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    accessApiKey: string;
    projectUrl: string;
    claimUrl: string;
  };
  emit({ kind: "insforge.signup.done", sponsor: "InsForge", level: "ok", text: `Postgres backend live at ${data.projectUrl}`, payload: { project_url: data.projectUrl, claim_url: data.claimUrl, anon_key: "***redacted***" } });
  return { project_url: data.projectUrl, anon_key: data.accessApiKey, claim_url: data.claimUrl };
}
