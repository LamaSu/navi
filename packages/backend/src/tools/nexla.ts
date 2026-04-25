// Nexla data-integration wrapper.
// Auth flexibility (per scout-hotel research + 2026-04-24 hackathon credentials):
//   • SESSION TOKEN (Bearer, JWT) — set NEXLA_SESSION_TOKEN. Used directly. What the user gave us today.
//   • SERVICE KEY (Basic) — set NEXLA_SERVICE_KEY. We POST /token first to obtain a bearer.
// We prefer SESSION_TOKEN when both are present.

import { emit } from "../lib/event-bus.js";
const MOCK = process.env.MOCK_NEXLA !== "false";
const BASE = process.env.NEXLA_API_URL ?? "https://dataops.nexla.io/nexla-api";
const SESSION_TOKEN = process.env.NEXLA_SESSION_TOKEN ?? "";
const SERVICE_KEY = process.env.NEXLA_SERVICE_KEY ?? process.env.NEXLA_API_KEY ?? "";

let cached: { token: string; exp: number } | null = null;

async function getBearer(): Promise<string> {
  if (SESSION_TOKEN) return SESSION_TOKEN;

  const now = Date.now();
  if (cached && cached.exp > now + 30_000) return cached.token;
  if (!SERVICE_KEY) throw new Error("NEXLA_SESSION_TOKEN or NEXLA_SERVICE_KEY required");

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
  source_type: string;
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

export async function listFlows(): Promise<{ flows: Array<{ id: number; name: string; runtime_status: string }> }> {
  if (MOCK) return { flows: [] };
  const res = await apiFetch("/flows");
  return (await res.json()) as { flows: Array<{ id: number; name: string; runtime_status: string }> };
}

/**
 * Express.dev-style natural-language pipeline build.
 * The agent calls this with a one-line description; Nexla creates source +
 * Nexset + sink and activates the flow. For the hackathon we drive this
 * via the REST endpoints rather than express.dev directly so it composes
 * with the rest of the meta-agent.
 */
export async function buildPipelineFromPrompt(input: {
  session_id: string;
  prompt: string;
  source_url?: string;
  source_type?: string; // postgres, mysql, snowflake, s3, sharepoint, rest, file_upload
  insforge_postgres_url?: string;
}): Promise<{ source_id: number; sink_id?: number; pipeline_status: string; nl_prompt: string }> {
  if (MOCK) {
    return {
      source_id: Math.floor(Math.random() * 100000),
      sink_id: Math.floor(Math.random() * 100000),
      pipeline_status: "ACTIVE (mock)",
      nl_prompt: input.prompt
    };
  }

  // 1) credential for the source (REST URL by default)
  const cred = await createCredential({
    name: `enterprise-${input.session_id}-${input.source_type ?? "rest"}`,
    credential_type: input.source_type ?? "rest",
    credentials_non_secure_data: input.source_url ? { base_url: input.source_url } : {}
  });

  // 2) source
  const src = await createSource({
    name: `enterprise-src-${input.session_id}`,
    source_type: input.source_type ?? "rest",
    data_credentials_id: cred.id,
    source_config: { path: "/", method: "GET", description: input.prompt }
  });

  // 3) optional sink to InsForge Postgres
  let sink_id: number | undefined;
  if (input.insforge_postgres_url) {
    const sinkCred = await createCredential({
      name: `enterprise-${input.session_id}-insforge-sink`,
      credential_type: "postgres",
      credentials_non_secure_data: { connection_url: input.insforge_postgres_url }
    });
    const sink = await createDestination({
      name: `enterprise-sink-${input.session_id}`,
      sink_type: "postgres",
      data_credentials_id: sinkCred.id,
      sink_config: { table_prefix: `ent_${input.session_id.slice(0, 8)}_` }
    });
    sink_id = sink.id;
  }

  await activateSource(src.id);
  return { source_id: src.id, sink_id, pipeline_status: "ACTIVATING", nl_prompt: input.prompt };
}

/**
 * Detect a Nexla source_type from the URL scheme.
 * postgres://… → postgres, https://*.sharepoint.com → sharepoint, s3://… → s3, etc.
 */
export function detectSourceType(url: string): string {
  const u = url.trim().toLowerCase();
  if (u.startsWith("postgres://") || u.startsWith("postgresql://")) return "postgres";
  if (u.startsWith("mysql://")) return "mysql";
  if (u.startsWith("mongodb://") || u.startsWith("mongodb+srv://")) return "rest"; // Nexla doesn't have native mongo
  if (u.startsWith("s3://")) return "s3";
  if (u.startsWith("gs://")) return "gcs";
  if (u.includes("sharepoint.com")) return "sharepoint";
  if (u.includes("drive.google.com") || u.includes("docs.google.com")) return "gdrive";
  if (u.includes("dropbox.com")) return "dropbox";
  if (u.includes("salesforce.com") || u.includes("my.salesforce.com")) return "rest"; // OAuth REST
  if (u.includes("snowflakecomputing.com")) return "snowflake";
  return "rest";
}

/**
 * Higher-level helper used by the onboarding flow (back-compat with previous wrapper).
 * Auto-detects source type from URL scheme.
 */
export async function scrapeOrIngest(input: {
  session_id: string;
  url: string;
  goal: string;
}): Promise<{ source_id: string; dataflow_id: string; preview: unknown; source_type: string }> {
  const sourceType = detectSourceType(input.url);
  emit({ kind: "nexla.detect", sponsor: "Nexla", level: "info", session_id: input.session_id, text: `URL ${input.url} → source_type=${sourceType}`, payload: { url: input.url, source_type: sourceType } });

  if (MOCK) {
    emit({ kind: "nexla.mock", sponsor: "Nexla", level: "warn", session_id: input.session_id, text: `MOCK_NEXLA=true · skipping real /token + /data_credentials + /data_sources` });
    return {
      source_id: `nexla-src-mock-${input.session_id.slice(0, 6)}`,
      dataflow_id: `nexla-df-mock-${input.session_id.slice(0, 6)}`,
      source_type: sourceType,
      preview: {
        kind: `${sourceType}-source`,
        url: input.url,
        extracted: {
          name: "Oakland Titanium Mills",
          machines: [
            { id: "mazak-i400", name: "Mazak Integrex i-400", kind: "5-axis mill-turn" },
            { id: "haas-vf2ss", name: "Haas VF-2SS", kind: "3-axis mill" },
            { id: "dmg-nhx5000", name: "DMG Mori NHX 5000", kind: "HMC 6-pallet" }
          ],
          hours: "24/7",
          contact: "james@oakland-titanium-mills.example"
        }
      }
    };
  }

  emit({ kind: "nexla.pipeline.start", sponsor: "Nexla", level: "info", session_id: input.session_id, text: `building ${sourceType} pipeline → InsForge sink`, payload: { source_url: input.url, source_type: sourceType, goal: input.goal } });
  const result = await buildPipelineFromPrompt({
    session_id: input.session_id,
    prompt: input.goal,
    source_url: input.url,
    source_type: sourceType
  });
  emit({ kind: "nexla.pipeline.done", sponsor: "Nexla", level: "ok", session_id: input.session_id, text: `pipeline ${result.pipeline_status} · source_id=${result.source_id}`, payload: { source_id: result.source_id, sink_id: result.sink_id, pipeline_status: result.pipeline_status, nl_prompt: result.nl_prompt } });
  return {
    source_id: String(result.source_id),
    dataflow_id: `nexla-df-${result.source_id}`,
    source_type: sourceType,
    preview: { status: result.pipeline_status, nl_prompt: result.nl_prompt, source_type: sourceType }
  };
}
