const MOCK = process.env.MOCK_INSFORGE !== "false";

export async function signupInsforge(input: {
  name: string;
}): Promise<{ project_url: string; anon_key: string; claim_url: string }> {
  if (MOCK) {
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      project_url: `https://${slug}.region.insforge.app`,
      anon_key: "mock-anon-key",
      claim_url: `https://insforge.dev/claim/${slug}`
    };
  }

  // POST https://api.insforge.dev/agents/v1/signup → { accessApiKey, projectUrl, claimUrl }
  const res = await fetch("https://api.insforge.dev/agents/v1/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: input.name })
  });
  if (!res.ok) throw new Error(`insforge signup failed: ${res.status}`);
  const data = (await res.json()) as {
    accessApiKey: string;
    projectUrl: string;
    claimUrl: string;
  };
  return { project_url: data.projectUrl, anon_key: data.accessApiKey, claim_url: data.claimUrl };
}
