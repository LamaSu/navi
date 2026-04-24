# Nexla Deep Dive — scout-hotel
**Agent**: scout-hotel
**Started**: 2026-04-24
**Task**: Full technical integration reference for Nexla as Ship to Prod hackathon sponsor (replaces TinyFish scraper role)

---

## Sources fetched

## https://nexla.com/ — 2026-04-24
- Positioning: "Enterprise-grade Data Platform For Agents"
- **550+ bidirectional connectors** (databases, APIs, files, streams, SaaS, video)
- **Nexsets** = virtual data products with semantic metadata
- **MCP Gateway**: ships MCP servers with intelligent tool routing + zero-trust identity
- **Context Engine**: ingests docs/schemas/lineage/execution-history into knowledge graphs for AI
- **Agentic Probe**: auto-discovers high-value data entities (no pre-built pipelines needed)
- **Express.dev**: conversational NL → pipelines. Free trial lives here.
- Scale: 1T+ records/month, 10K+ pipelines
- Compliance: SOC 2 Type II, HIPAA, GDPR, CCPA
- Customers: FS, insurance, healthcare, retail, gov

## https://docs.nexla.com/ — 2026-04-24
- User Guides: Quick start, data flows, connectors, transformations
- Dev Resources: REST API, Python SDK, React SDK, CLI
- Tutorials: Jupyter, GenAI querying, flow migration
- Support: support@nexla.com

## https://developers.nexla.com/docs/ — 2026-04-24
- REDIRECTS to https://docs.nexla.com/docs/ (308).

## https://github.com/nexla-opensource/nexla-sdk — 2026-04-24
- **Install**: `pip install nexla-sdk`
- **Auth (2 methods)**:
  1. **Service Key** (recommended, auto-refreshes): `NexlaClient(service_key="...")`
  2. **Access Token**: `NexlaClient(access_token="...")`
- **Env vars**: `NEXLA_SERVICE_KEY`, `NEXLA_ACCESS_TOKEN`, `NEXLA_API_URL`
- **Resources**: credentials, sources, destinations, nexsets, flows, lookups, users, orgs, teams, projects, notifications, metrics, code_containers, transforms, async_tasks, approval_requests, runtimes, marketplace, genai, data_schemas, doc_containers, org_auth_configs, self_signup
- **Methods**: list/get/create/update/delete/activate/pause/copy/paginate/get_accessors/get_audit_log
- **Note**: Flows are not created directly — wire sources → nexsets → destinations, then activate.

## https://apitracker.io/a/nexla — 2026-04-24
- Page empty. Skip.

## https://nexla.com/blog/nexla-nebius-multi-agent-ai-data-orchestration — 2026-04-24
- Nexla = orchestrator of data flows + agent workflows. Not a proprietary agent SDK.
- Runs on Nebius + NVIDIA HGX B200. No code samples.

## https://docs.nexla.com/reference + /reference/nexla-api — 2026-04-24
- **Base URL**: `https://dataops.nexla.io/nexla-api` (SDK default, confirmed nexla_sdk/auth.py:40)
- **Accept header**: `application/vnd.nexla.api.v1+json`
- **Full endpoint list confirmed**:
  - Auth: `POST /token`, `POST /token/logout`, `GET /users/current`
  - Sources: `GET/POST /data_sources`, `GET/PUT/DELETE /data_sources/{id}`, `PUT /data_sources/{id}/activate`, `PUT /data_sources/{id}/pause`, `POST /data_sources/{id}/copy`
  - Sinks: same shape at `/data_sinks`
  - Nexsets: `/data_sets`, `/data_sets/{id}/samples`, `/data_sets/{id}/docs/recommendation`
  - Credentials: `/data_credentials`, `/data_credentials/{id}/test`, `POST /data_credentials/preview/connector`
  - Flows: `GET /flows`, `GET /flows/{id}`, `PUT /flows/{id}/activate`, `PUT /flows/{id}/pause`, `PUT /{resource_type}/{resource_id}/activate`
- **Self-signup**: `POST /signup`, `GET /signup/verify_email?token=...` (public, confirmed in SDK self_signup.py)

## https://docs.nexla.com/dev-guides/authentication/service-keys — 2026-04-24
- Create service key: UI → Settings → Authentication → Create Service Key
- **Exact curl**:
  - `curl -X POST https://dataops.nexla.io/nexla-api/token -H "Authorization: Basic <SERVICE_KEY>" -H "Accept: application/vnd.nexla.api.v1+json" -H "Content-Length: 0"`
- Response: `{ access_token, token_type:"Bearer", expires_in: 3600, user:{...}, org:{...} }`
- Subsequent calls: `Authorization: Bearer <access_token>`
- SDK auto-refreshes 401 → re-POST /token (service-key mode)

## SDK source inspection (research-clones/nexla-sdk/) — 2026-04-24
- **Confirmed `SourceType` enum values** (nexla_sdk/models/sources/enums.py):
  - Files: s3, gcs, azure_blb, ftp, dropbox, box, gdrive, sharepoint
  - DB: mysql, postgres, sqlserver, oracle, redshift, snowflake, bigquery, databricks
  - NoSQL: mongo, dynamodb, firebase
  - Stream: kafka, confluent_kafka, google_pubsub
  - APIs: rest, soap, nexla_rest
  - Special: file_upload, email, nexla_monitor
- Same for `credentials_type` and `sink_type`.
- **CRITICAL**: no direct Salesforce/HubSpot/Workday/SAP/NetSuite/ServiceNow/CMMS enum value. Those are implemented via `rest` + templatized `template_config` + OAuth credential (pattern confirmed in docs-site/docs/guides/connect-to-top-integrations.md:102-123) OR via marketplace templates. Use `SourceType.REST` for SaaS.
- **Resource path confirmed**: SourcesResource._path = "/data_sources", FlowsResource._path = "/flows"
- **Pydantic request models**: SourceCreate(name, source_type, data_credentials_id, source_config), DestinationCreate(name, sink_type, data_credentials_id, data_set_id, sink_config), CredentialCreate(name, credentials_type, credentials)

## MCP server status — 2026-04-24
- **Nexla has no standalone MCP npm/pip package**. Their MCP is architectural: any Nexset can be exposed as an MCP server via the MCP Gateway (enterprise feature).
- Not in modelcontextprotocol/servers repo. No public GitHub repo for a Nexla MCP server.
- Source: Techzine Global interview with Nexla CTO Amey Desai.
- **Implication**: we build our own meta-agent wrapping Nexla's REST API as tools.

## Pricing / Free trial — 2026-04-24
- **express.dev** = self-service POC entry. Sign up, get a sandbox org.
- No published rate limits. SDK retry config (status_forcelist=[429,502,503,504], backoff_factor=0.5, 3 retries) implies 429 is normal → modest trial throttle.
- No hackathon-specific tier publicly documented. **Action**: hit up Mihir/Abhijit at the event for service key + uplift.
- Pricing page gated.

## Context Engine — 2026-04-24
- Part of the gateway offering, not in open SDK. For unstructured docs, use `client.doc_containers.create(...)` then `client.genai.*` (present in SDK: resources/doc_containers.py, resources/genai.py). Out of MVP scope.

---

# SUMMARY

## Integration decision
- **USE**: direct REST wrapper in TS (Node-native meta-agent). Total surface = ~8 endpoints.
- **AUTH**: two-leg. POST /token with Basic <service-key> → cache 3600s bearer → refresh on 401.
- **CORE FLOW**: signup → /token → credentials.create → sources.create(source_type="postgres") → destinations.create(sink_type="postgres" pointing at InsForge) → flows.activate.
- **POSTGRES IS A FIRST-CLASS SINK** (sink_type="postgres"). YES, InsForge Postgres works as dataflow destination.
- **MCP**: SKIP. Nexla has no standalone MCP package. Wrap REST directly.
- **Top 10 connectors for enterprise onboarding**: postgres, mysql, sqlserver, snowflake, s3, gdrive, sharepoint, rest (Salesforce/HubSpot/Workday via templatized), oracle, file_upload (ad-hoc CSV).

## Node/TS wrapper skeleton — `packages/backend/src/tools/nexla.ts`

See code block below. Single file, no SDK, no deps beyond fetch.

```
const BASE = process.env.NEXLA_API_URL ?? "https://dataops.nexla.io/nexla-api";
const ACCEPT = "application/vnd.nexla.api.v1+json";

type Token = { access_token: string; expires_at: number };
let _token: Token | null = null;

async function _req<T>(method: string, path: string, body?: unknown, auth?: string): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Accept: ACCEPT,
      "Content-Type": "application/json",
      ...(auth ? { Authorization: auth } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error("Nexla " + method + " " + path + " -> " + res.status + ": " + (await res.text()));
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

// 1. Exchange service key -> bearer (cached 55 min)
export async function auth(serviceKey = process.env.NEXLA_SERVICE_KEY!): Promise<string> {
  if (_token && Date.now() < _token.expires_at) return _token.access_token;
  const r = await _req<{ access_token: string; expires_in: number }>(
    "POST", "/token", undefined, "Basic " + serviceKey
  );
  _token = { access_token: r.access_token, expires_at: Date.now() + (r.expires_in - 60) * 1000 };
  return r.access_token;
}

async function _bearer(): Promise<string> { return "Bearer " + (await auth()); }

// 2. Public signup
export async function signup(payload: { email: string; full_name: string; org_name?: string }) {
  return _req("POST", "/signup", payload);
}

// 3. Create credential. credentials_type ∈ {postgres, mysql, s3, snowflake, rest, gdrive, sharepoint, ...}
export async function createCredential(input: {
  name: string;
  credentials_type: string;
  credentials: Record<string, unknown>;
}) {
  return _req<{ id: number; name: string }>("POST", "/data_credentials", input, await _bearer());
}

// 4. Create source
export async function createSource(input: {
  name: string;
  source_type: string;
  data_credentials_id: number;
  source_config: Record<string, unknown>;
  ingest_method?: "POLL" | "STREAMING" | "REAL_TIME" | "BATCH" | "SCHEDULED";
  template_config?: Record<string, unknown>;
}) {
  return _req<{ id: number; status: string }>("POST", "/data_sources", input, await _bearer());
}

// 5. Create destination (sink) — targets InsForge Postgres
export async function createDestination(input: {
  name: string;
  sink_type: string;                 // "postgres"
  data_credentials_id: number;
  data_set_id: number;               // nexset to publish
  sink_config: Record<string, unknown>;
}) {
  return _req<{ id: number }>("POST", "/data_sinks", input, await _bearer());
}

// 6. Activate source flow
export async function activateSourceFlow(sourceId: number) {
  return _req<{ id: number; status: string }>(
    "PUT", "/data_sources/" + sourceId + "/activate", undefined, await _bearer()
  );
}

// 7. Get source status
export async function getSource(sourceId: number) {
  return _req<{ id: number; name: string; status: "ACTIVE"|"PAUSED"|"DRAFT"|"DELETED"|"ERROR" }>(
    "GET", "/data_sources/" + sourceId, undefined, await _bearer()
  );
}

// 8. List detected nexsets for a source
export async function listNexsetsForSource(sourceId: number) {
  const all = await _req<Array<{ id: number; data_source_id: number; name: string }>>(
    "GET", "/data_sets", undefined, await _bearer()
  );
  return all.filter(n => n.data_source_id === sourceId);
}
```

## Demo orchestration (hackathon pitch moment)

```
const cred = await createCredential({
  name: "Customer SAP",
  credentials_type: "postgres",
  credentials: { host: "sap.example.com", port: 5432, database: "erp", user: "ro", password: "***" }
});
const src = await createSource({
  name: "SAP Orders",
  source_type: "postgres",
  data_credentials_id: cred.id,
  source_config: { schema: "public", table: "orders", "start.cron": "*/15 * * * *" }
});
await activateSourceFlow(src.id);
const nexsets = await listNexsetsForSource(src.id);
const insforgeCred = await createCredential({
  name: "InsForge PCC",
  credentials_type: "postgres",
  credentials: { host: process.env.INSFORGE_HOST, port: 5432, database: "pcc", user: "writer", password: process.env.INSFORGE_PW }
});
await createDestination({
  name: "SAP Orders -> PCC",
  sink_type: "postgres",
  data_credentials_id: insforgeCred.id,
  data_set_id: nexsets[0].id,
  sink_config: { schema: "raw", table: "sap_orders", load_type: "merge", key_columns: ["order_id"] }
});
```

## Action items
1. Drop `nexla.ts` into `packages/backend/src/tools/nexla.ts` verbatim.
2. Add env: `NEXLA_SERVICE_KEY=` and `NEXLA_API_URL=https://dataops.nexla.io/nexla-api`.
3. Hackathon: pull service key from Mihir/Abhijit (express.dev trial + event uplift).
4. Wire 4 agent tools: createCredential, createSource, createDestination, activateSourceFlow.
5. Defer: doc_containers/genai for PDF/SOP ingestion (post-MVP).
