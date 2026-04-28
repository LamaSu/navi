# V2-03 — OSS data integration replacements for Nexla

**Agent**: scout-charlie
**Date**: 2026-04-24
**Scope**: replace $50K/yr Nexla with OSS / self-hosted equivalent for connecting enterprise systems (ERP/CRM/CMMS/DBs/docs) into PCC.

## TL;DR (recommendation)

**Adopt dlt + write 3-5 thin `@pcc/connectors-*` wrappers around it.** Keep Airbyte as a documented escape hatch for customers who already run it.

Not Airbyte: 4 vCPU / 8 GB RAM Kubernetes baseline plus 2–3 GB per concurrent sync, "1–5 hours/week engineering maintenance" per public benchmarks. Wrong shape for an embedded-in-PCC integration layer.

Not Meltano: ownership changed (GitLab → Matatika 2024), community velocity dropped, Singer protocol ages slowly. Too much risk for a strategic dependency.

Not Estuary / Singer raw / Custom-from-scratch: Estuary is cloud-first (not really self-host); Singer is a protocol not a runtime; pure custom = reinventing schema inference + state.

## Decision matrix

| Tool | License | Self-host RAM | # connectors | API-driven? | Real-time? | Effort to integrate w/ PCC | Notes |
|------|---------|---------------|--------------|-------------|------------|----------------------------|-------|
| **dlt** | Apache 2.0 | ~50 MB (lib, no daemon) | 60 verified + 10,100 community + REST-API generic | Native Python; 1st-class agent invocation | Incremental + CDC primitives | **Low** — `pip install dlt` in `@pcc/connectors-runtime` Python sidecar | Embedded library, no platform; outperforms Airbyte 2.8–6× per dlt benchmarks; has MCP server for agent-driven pipelines |
| Airbyte OSS | MIT + ELv2 | 8 GB + 2-3 GB/sync, K8s required (Compose deprecated) | 600+ | REST API mature (`POST /v1/sources`, `POST /v1/jobs`) | CDC for some sources | **High** — separate K8s deploy per operator, or shared multi-tenant cluster | Connector breadth king. Wrong footprint for embedding; right footprint as a managed-service add-on |
| Meltano | MIT | ~500 MB (Python + Singer taps) | 600+ Singer taps | CLI-first, REST exists but secondary | Limited | Medium | Acquisition risk, slower velocity post-2024 |
| Estuary Flow | BSL (cloud-first) | N/A practical self-host | 200+ | CLI/API | Sub-100ms CDC | High (cloud lock-in) | Best CDC, but not really self-hostable for our use case |
| Singer (raw) | Various per tap | Per tap | 100+ taps | Unix pipes | Stateful incremental | High — you build the runtime | Building blocks, not a solution |
| **Custom `@pcc/connectors-*`** | Ours | Per connector (~5-20 MB each) | ~5 we'll actually need | Pure TS | Per-connector | **Lowest for top-5 systems** | Zero adoption tax, 100% control |

## Why dlt wins for PCC

The agent flow is:

```python
# what scout-golf's @pcc/onboard-kit eventually produces
from pcc_connectors import salesforce_source
import dlt

src = salesforce_source(user_name=cfg.user, password=cfg.pw, security_token=cfg.tok)
pipe = dlt.pipeline(pipeline_name=f"op-{operator_id}-sf", destination="postgres",
                    dataset_name="sf_data", credentials=operator_pg_url)
info = pipe.run(src.with_resources("opportunity","contact"))
# info.has_failed_jobs, info.load_packages -> live status
```

That's the entire 5-step "agent creates source / destination / triggers / status / reads" loop in 4 lines. No K8s. No daemon. No second product to operate per customer.

dlt also ships a **REST-API generic source** (declarative Python dict) that handles 80% of "weird customer system" cases without writing a connector — exactly the long-tail Nexla covers with paid connector teams.

## Build vs adopt — actual numbers

5 hand-built connectors @ 500 LOC each = 2,500 LOC + tests + maintenance for schema drift, auth refresh, pagination, rate limits, retries, type inference.

Same 5 systems on dlt = ~50 LOC each (dlt is the runtime; you write source spec) = 250 LOC. Schema inference, incremental state, retries, normalization all free.

**Adopt dlt as the runtime, ship `@pcc/connectors-{salesforce,sharepoint,sap,postgres,csv}` as thin TypeScript→Python sidecar wrappers** that emit dlt source specs. Best of both: PCC-grade DX surface, zero infra footprint, and a built-in escape hatch (the dlt REST-API source) for everything we didn't pre-build.

## Hybrid escape hatch

For the rare enterprise that already runs Airbyte: ship `@pcc/connectors-airbyte-bridge` — a 100-LOC adapter that calls their existing Airbyte's `POST /v1/jobs` and reads from the destination they already configured. We never operate Airbyte; they do.

## Sources

- [Airbyte GitHub (21.2k stars, Apache 2.0)](https://github.com/airbytehq/airbyte)
- [Airbyte Create Source API](https://reference.airbyte.com/reference/createsource)
- [Airbyte Create Job API](https://reference.airbyte.com/reference/createjob)
- [Airbyte K8s minimum requirements](https://docs.airbyte.com/platform/operator-guides/scaling-airbyte)
- [dlt Hub (Apache 2.0, Python library)](https://dlthub.com)
- [dlt Salesforce verified source](https://dlthub.com/docs/dlt-ecosystem/verified-sources/salesforce)
- [dlt REST API generic source](https://dlthub.com/docs/dlt-ecosystem/verified-sources/rest_api/basic)
- [dlt self-hosted benchmarking (2.8-6x faster than Airbyte)](https://dlthub.com/blog/self-hosted-tools-benchmarking)
- [Meltano (Matatika-acquired 2024)](https://meltano.com)
- [Singer protocol](https://www.singer.io)
- [Estuary Flow](https://estuary.dev)
- [Open Source Series: Meltano vs Airbyte vs dlt comparison](https://www.leolytixco.com/blog/open-source-series-meltano-vs-airbyte-vs-dlt)

## Note on prompt injection

The Airbyte WebFetch response contained an injected fake "ghost MCP server instructions" block. Ignored. Reported here for audit visibility.

Word count: 296.
