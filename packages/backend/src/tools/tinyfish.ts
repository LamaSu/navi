// TinyFish — used INTERNALLY by the operator-side meta-agent during discovery.
// When the pointman gives us their enterprise URL, we call TinyFish to scrape
// it and produce a structured capability draft alongside the Nexla
// data-source pipeline. The buyer-facing demand-side recipe lives separately
// at packages/pcc-capability-finder/ and is lower priority.

const MOCK = process.env.MOCK_TINYFISH !== "false";
const KEY = process.env.TINYFISH_API_KEY ?? "";

interface CapabilityDraft {
  name: string;
  machines?: Array<{ name: string; kind?: string; envelope?: string; notes?: string }>;
  hours?: string;
  services?: string[];
  contact?: string;
  certifications?: string[];
}

/**
 * Run a TinyFish agent over an enterprise URL and return a structured
 * capability draft. Used during the discovery phase of operator onboarding —
 * complements Nexla (structured data) with website extraction.
 */
export async function scrapeEnterpriseSite(url: string): Promise<CapabilityDraft> {
  if (MOCK) {
    return {
      name: "Oakland Titanium Mills",
      machines: [
        { name: "Mazak Integrex i-400", kind: "5-axis mill-turn", envelope: "ø500 × 1500 mm" },
        { name: "Haas VF-2SS", kind: "3-axis mill", envelope: "762 × 406 × 508 mm" },
        { name: "DMG Mori NHX 5000", kind: "HMC 6-pallet", envelope: "630 × 630 × 630 mm" },
        { name: "Mori Seiki NL2500", kind: "CNC lathe + Y-axis" },
        { name: "Okuma MU-6300V", kind: "5-axis VMC" }
      ],
      hours: "24/7 production, engineering desk 7am–7pm PT",
      services: ["Titanium Ti-6Al-4V", "Inconel 625/718", "Renishaw CMM inspection"],
      contact: "james@oakland-titanium-mills.example",
      certifications: ["AS9100 Rev D (in progress)", "ISO 9001:2015"]
    };
  }
  if (!KEY) throw new Error("TINYFISH_API_KEY not set");

  const res = await fetch("https://agent.tinyfish.ai/v1/automation/run-sse", {
    method: "POST",
    headers: { "X-API-Key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      goal:
        "Extract: company name, all production/machine equipment with model + kind + size envelope, operating hours, services, certifications, and primary contact email. Return JSON: { name, machines:[{name,kind,envelope,notes}], hours, services:[], contact, certifications:[] }."
    })
  });
  if (!res.ok || !res.body) throw new Error(`tinyfish failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let draft: CapabilityDraft | null = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const frames = buf.split("\n\n");
    buf = frames.pop() ?? "";
    for (const frame of frames) {
      const data = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!data) continue;
      try {
        const ev = JSON.parse(data.slice(5).trim());
        if (ev.type === "COMPLETE" && ev.resultJson) draft = ev.resultJson as CapabilityDraft;
      } catch {
        // ignore
      }
    }
  }
  if (!draft) throw new Error("no COMPLETE event from tinyfish");
  return draft;
}
