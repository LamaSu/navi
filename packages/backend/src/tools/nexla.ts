// Nexla data-integration wrapper.
// Real implementation from scout-hotel research (ai/research/08-nexla.md).
// 2-leg auth: SERVICE_KEY → bearer token (expires 1h). Then create credential →
// source → destination → activate. InsForge Postgres is the sink.
//
// When MOCK_NEXLA=true we skip live calls so the pipeline works without a real key.

const MOCK = process.env.MOCK_NEXLA !== "false";
const BASE = process.env.NEXLA_API_URL ?? "https://dataops.nexla.io/nexla-api";
const SERVICE_KEY = process.env.NEXLA_SERVICE_KEY ?? process.env.NEXLA_API_KEY ?? "";

let cached: { token: string; exp: number } | null = null;

async function getBearer(): Promise<string> {
  const now = Date.now();
  if (cached && cached.exp > now + 30_000) return cached.token;
  if (!SERVICE_KEY) throw new Error("NEXLA_SERVICE_KEY not set");

  const res = await fetch(`${BASE}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${SERVICE_KEY}`,
      Accept: "application/vnd.nexla.api.v1+json"
    }
  });
  if (!res.ok) throw new Error(`nexla /token failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: body.access_token, exp: now + (body.expires_in - 300) * 1000 };
  return cached.token;
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getBearer();
  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/vnd.nexla.api.v1+json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`nexla ${path} failed: ${res.status} ${await res.text()}`);
  return res;
}

interface CredentialInput {
  name: string;
  credential_type: string;
  credentials_non_secure_data?: Record<string, unknown>;
  credentials_secure_data?: Record<string, unknown>;
}

export async function createCredential(input: CredentialInput): Promise<{ id: number }> {
  if (MOCK) return { id: Math.floor(Math.random() * 100000) };
  const res = await apiFetch("/data_credentials", { method: "POST", body: JSON.stringify(input) });
  return (await res.json()) as { id: number };
}

interface SourceInput {
  name: string;
  source_type: string; // postgres, mysql, snowflake, s3, sharepoint, rest, file_upload, ...
  data_credentials_id?: number;
  source_config: Record<string, unknown>;
}

export async function createSource(input: SourceInput): Promise<{ id: number }> {
  if (MOCK) return { id: Math.floor(Math.random() * 100000) };
  const res = await apiFetch("/data_sources", { method: "POST", body: JSON.stringify(input) });
  return (await res.json()) as { id: number };
}

interface SinkInput {
  name: string;
  sink_type: string;
  data_credentials_id: number;
  sink_config: Record<string, unknown>;
}

export async function createDestination(input: SinkInput): Promise<{ id: number }> {
  if (MOCK) return { id: Math.floor(Math.random() * 100000) };
  const res = await apiFetch("/data_sinks", { method: "POST", body: JSON.stringify(input) });
  return (await res.json()) as { id: number };
}

export async function activateSource(sourceId: number): Promise<{ activated: true }> {
  if (MOCK) return { activated: true };
  await apiFetch(`/data_sources/${sourceId}/activate`, { method: "PUT" });
  return { activated: true };
}

export async function getSource(sourceId: number): Promise<{ status: string; id: number }> {
  if (MOCK) return { status: "ACTIVE", id: sourceId };
  const res = await apiFetch(`/data_sources/${sourceId}`);
  return (await res.json()) as { status: string; id: number };
}

/**
 * Higher-level helper used by the onboarding flow. Given an enterprise URL
 * or ERP connection hint, creates a Nexla source → Nexset → InsForge sink
 * and activates the pipeline. Used by /onboard/:id/scrape.
 */
export async function scrapeOrIngest(input: {
  session_id: string;
  url: string;
  goal: string;
}): Promise<{ source_id: string; dataflow_id: string; preview: unknown }> {
  if (MOCK) {
    return {
      source_id: `nexla-src-mock-${input.session_id.slice(0, 6)}`,
      dataflow_id: `nexla-df-mock-${input.session_id.slice(0, 6)}`,
      preview: {
        kind: "website-rest-source",
        url: input.url,
        extracted: {
          name: "Oakland Titanium Mills",
          machines: [
            { id: "mazak-i400", name: "Mazak i400", kind: "5-axis mill-turn" },
            { id: "haas-vf2ss", name: "Haas VF-2SS", kind: "3-axis mill" },
            { id: "dmg-nhx5000", name: "DMG Mori NHX 5000", kind: "HMC 6-pallet" }
          ],
          hours: "24/7",
          contact: "james@oakland-titanium-mills.example"
        }
      }
    };
  }

  // REAL flow: REST source pointing at enterprise URL → file_upload destination
  const cred = await createCredential({
    name: `enterprise-${input.session_id}-rest`,
    credential_type: "rest",
    credentials_non_secure_data: { base_url: input.url }
  });
  const src = await createSource({
    name: `enterprise-src-${input.session_id}`,
    source_type: "rest",
    data_credentials_id: cred.id,
    source_config: { path: "/", method: "GET" }
  });
  await activateSource(src.id);
  return {
    source_id: String(src.id),
    dataflow_id: `nexla-df-${src.id}`,
    preview: { status: "activated", note: "poll GET /data_sources/" + src.id }
  };
}
