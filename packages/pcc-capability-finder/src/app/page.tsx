"use client";
import { useState } from "react";

type Candidate = {
  operator_id: string;
  name: string;
  url?: string;
  materials?: string[];
  capabilities?: string[];
  typical_lead_time_days?: number;
  price_hint_usd?: number;
  certifications?: string[];
  x402_header?: string;
};

export default function Home() {
  const [query, setQuery] = useState("12 titanium aerospace brackets, 6-inch tolerance, by Tuesday");
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setCandidates([]);
    try {
      const res = await fetch("/api/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, max_candidates: 5 })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? String(res.status));
      setCandidates(body.candidates ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 820, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>PCC Capability Finder</h1>
      <p style={{ color: "#666" }}>
        Describe the job. We&apos;ll find real PCC operators that can do it, with live x402 quotes.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", margin: "1.5rem 0" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="12 titanium aerospace brackets, 6-inch tolerance..."
          style={{
            flex: 1,
            padding: "0.6rem",
            fontSize: "1rem",
            border: "1px solid #ccc",
            borderRadius: 6
          }}
        />
        <button
          onClick={run}
          disabled={loading}
          style={{
            padding: "0.6rem 1rem",
            fontSize: "1rem",
            border: 0,
            borderRadius: 6,
            background: "#111",
            color: "#fff",
            cursor: loading ? "wait" : "pointer"
          }}
        >
          {loading ? "Finding…" : "Find operators"}
        </button>
      </div>

      {error && <pre style={{ color: "crimson" }}>{error}</pre>}

      {candidates.length > 0 && (
        <section>
          <h2>Matches</h2>
          <ol>
            {candidates.map((c) => (
              <li key={c.operator_id} style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
                <strong>{c.name}</strong>
                {c.url && (
                  <>
                    {" "}
                    —{" "}
                    <a href={c.url} target="_blank" rel="noreferrer">
                      {c.url}
                    </a>
                  </>
                )}
                <div style={{ color: "#555", fontSize: "0.92rem" }}>
                  {c.materials?.length ? `materials: ${c.materials.join(", ")} · ` : ""}
                  {c.typical_lead_time_days ? `lead: ${c.typical_lead_time_days}d · ` : ""}
                  {c.price_hint_usd ? `~$${c.price_hint_usd} · ` : ""}
                  {c.certifications?.length ? `certs: ${c.certifications.join(", ")}` : ""}
                </div>
                {c.x402_header && (
                  <code style={{ fontSize: "0.78rem", color: "#093" }}>
                    x402 quote: {c.x402_header}
                  </code>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer style={{ marginTop: "3rem", color: "#999", fontSize: "0.85rem" }}>
        Ship to Prod hackathon · SF · 2026-04-24 · demand-side agent for PCC
      </footer>
    </main>
  );
}
