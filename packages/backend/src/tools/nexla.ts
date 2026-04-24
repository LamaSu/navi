// Nexla data-integration wrapper.
// When MOCK_NEXLA=true we return canned "connected" payloads so the
// pipeline works without a real key. scout-hotel's research will replace
// the TODO bodies with real REST calls (ai/research/08-nexla.md).

const MOCK = process.env.MOCK_NEXLA !== "false";
const BASE = "https://dataops.nexla.com/api";
const KEY = process.env.NEXLA_API_KEY ?? "";

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
        kind: "website",
        url: input.url,
        extracted: {
          name: "Oakland Titanium Mills",
          machines: [
            { id: "mazak-i400", name: "Mazak i400", kind: "5-axis mill", env: "climate-controlled" },
            { id: "haas-vf2ss", name: "Haas VF-2SS", kind: "3-axis mill" }
          ],
          hours: "24/7",
          contact: "james@oakland-titanium-mills.example"
        }
      }
    };
  }

  // TODO (A2 — wire once scout-hotel returns):
  //  1. POST {BASE}/sources  body: { name, connector_type, config }
  //  2. POST {BASE}/dataflows body: { source_id, dest_id (insforge postgres), transforms }
  //  3. return {source_id, dataflow_id, preview}
  throw new Error("nexla live wiring not implemented yet — set MOCK_NEXLA=true");
}
