"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("https://oakland-titanium-mills.example");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? String(res.status));
      setDraft(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>PCC Enterprise Onboarder</h1>
      <p style={{ color: "#666" }}>
        Paste your company URL. We&apos;ll extract your capabilities via TinyFish, create your PCC
        agent, lock escrow on Base Sepolia, and list on agentic.market — all in ~90 seconds.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", margin: "1.5rem 0" }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-company.example"
          style={{ flex: 1, padding: "0.6rem", fontSize: "1rem", border: "1px solid #ccc", borderRadius: 6 }}
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
          {loading ? "Onboarding…" : "Onboard"}
        </button>
      </div>

      {error && <pre style={{ color: "crimson" }}>{error}</pre>}
      {draft && (
        <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: 6, overflow: "auto" }}>
          {JSON.stringify(draft, null, 2)}
        </pre>
      )}

      <footer style={{ marginTop: "3rem", color: "#999", fontSize: "0.85rem" }}>
        Ship to Prod hackathon · SF · 2026-04-24 · PCC meta-agent
      </footer>
    </main>
  );
}
