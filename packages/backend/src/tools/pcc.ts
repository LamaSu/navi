const BASE = process.env.PCC_CAPABILITY_BASE ?? "https://capability.network";

export async function fetchAgentPackage(): Promise<{ tools: unknown[] }> {
  const res = await fetch(`${BASE}/agent-package.json`);
  if (!res.ok) throw new Error(`agent-package fetch failed: ${res.status}`);
  return (await res.json()) as { tools: unknown[] };
}

export async function registerEnterpriseAgent(input: {
  enterprise_id: string;
  agent_url: string;
  capability_manifest: unknown;
}): Promise<{ registered: true; operator_id: string }> {
  // TODO: POST to PCC's operator onboarding endpoint once confirmed.
  // For now return a deterministic id so the rest of the flow works.
  return { registered: true, operator_id: `op-${input.enterprise_id.slice(0, 8)}` };
}
