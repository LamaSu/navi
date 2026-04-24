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
- REDIRECTS to https://docs.nexla.com/docs/ (308). Need to follow.

## https://github.com/nexla-opensource/nexla-sdk — 2026-04-24
- **Install**: `pip install nexla-sdk`
- **Auth (2 methods)**:
  1. **Service Key** (recommended, refreshes tokens): `NexlaClient(service_key="...")`
  2. **Access Token**: `NexlaClient(access_token="...")`
- **Env vars**: `NEXLA_SERVICE_KEY`, `NEXLA_ACCESS_TOKEN`, `NEXLA_API_URL`
- **Core Python API**:
  ```python
  client.credentials.create({"name":..., "credentials_type":"s3", "credentials":{...}})
  client.sources.create({"name":..., "source_type":"s3", "data_credentials_id": cred.id, "source_config":{...}})
  ```
- **Resources**: credentials, sources, destinations, nexsets, flows, lookups, users, orgs, teams, projects, notifications, metrics, code_containers, transforms, async_tasks, approval_requests, runtimes, marketplace, genai, data_schemas, doc_containers, org_auth_configs
- **Methods**: list/get/create/update/delete/activate/pause/copy/paginate/get_accessors/get_audit_log
- **Note**: "Flows" are NOT created directly — you wire sources → destinations → nexsets

## https://apitracker.io/a/nexla — 2026-04-24
- Page is mostly empty; OpenAPI/Swagger spec exists but link not exposed
- No useful data — skip

## https://nexla.com/blog/nexla-nebius-multi-agent-ai-data-orchestration — 2026-04-24
- Nexla = orchestrator of data flows + agent workflows (NOT a proprietary agent SDK itself)
- Demo: video → Nemotron extracts → Nexla enriches → Nemotron reasons → NL refine
- Runs on Nebius + NVIDIA HGX B200
- Handles structured + unstructured (videos, docs) via MCP servers
- **No code samples in post**; business-narrative doc
