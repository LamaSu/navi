import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { emit } from "../lib/event-bus.js";

const MOCK = process.env.MOCK_CDP !== "false";
const CDP_KEY_ID = process.env.CDP_API_KEY_ID ?? "";
const CDP_KEY_SECRET = process.env.CDP_API_KEY_SECRET ?? "";

/**
 * Mint a fresh Ethereum wallet on Base Sepolia for an operator.
 * Real path uses viem to generate a key + derive the address. CDP faucet
 * funding is best-effort: skip if CDP creds aren't set.
 */
export async function createAgentWallet(input: {
  enterprise_id: string;
}): Promise<{ address: string; chain: string; funded: boolean; private_key_redacted: string }> {
  emit({
    kind: "cdp.wallet.start",
    sponsor: "Coinbase CDP",
    level: "info",
    session_id: input.enterprise_id,
    text: `createWallet on base-sepolia · CDP_KEY_ID=${CDP_KEY_ID ? CDP_KEY_ID.slice(0, 8) + "…" : "unset"}`
  });

  if (MOCK) {
    const r = {
      address: `0xmock${input.enterprise_id.slice(0, 6)}`,
      chain: "base-sepolia",
      funded: true,
      private_key_redacted: "0x***"
    };
    emit({
      kind: "cdp.wallet.mock",
      sponsor: "Coinbase CDP",
      level: "warn",
      session_id: input.enterprise_id,
      text: `MOCK_CDP=true · ${r.address}`,
      payload: r
    });
    return r;
  }

  // Real wallet generation via viem
  const pk = generatePrivateKey();
  const account = privateKeyToAccount(pk);
  emit({
    kind: "cdp.wallet.created",
    sponsor: "Coinbase CDP",
    level: "ok",
    session_id: input.enterprise_id,
    text: `wallet ${account.address} created on base-sepolia (chain id 84532)`,
    payload: { address: account.address, chain: "base-sepolia", chain_id: 84532 }
  });

  // Best-effort CDP faucet — only if creds are set. This requires CDP JWT
  // auth (BR JWT signed with the API secret); we attempt the public faucet
  // endpoint and degrade gracefully on auth failure.
  let funded = false;
  if (CDP_KEY_ID && CDP_KEY_SECRET) {
    try {
      // Public-tier faucet at Base Sepolia (https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
      // For an authenticated programmatic faucet, the CDP SDK or signed JWT request is required.
      // We log the attempt here for telemetry; full JWT signing is left to a follow-up.
      emit({
        kind: "cdp.faucet.skipped",
        sponsor: "Coinbase CDP",
        level: "warn",
        session_id: input.enterprise_id,
        text: `faucet auth requires CDP JWT signing — wallet created but unfunded for now`
      });
    } catch (e) {
      emit({
        kind: "cdp.faucet.err",
        sponsor: "Coinbase CDP",
        level: "err",
        session_id: input.enterprise_id,
        text: `faucet failed: ${e instanceof Error ? e.message : String(e)}`
      });
    }
  }

  return {
    address: account.address,
    chain: "base-sepolia",
    funded,
    private_key_redacted: `${pk.slice(0, 6)}***${pk.slice(-4)}`
  };
}

export async function listOnAgenticMarket(input: {
  enterprise_id: string;
  endpoints: { url: string; price_usdc: string }[];
}): Promise<{ marketplace_url: string }> {
  emit({
    kind: "agentic.list.start",
    sponsor: "agentic.market",
    level: "info",
    session_id: input.enterprise_id,
    text: `POST /v1/services with ${input.endpoints.length} endpoint(s)`
  });

  if (MOCK) {
    return { marketplace_url: `https://api.agentic.market/v1/services/mock-${input.enterprise_id.slice(0, 6)}` };
  }

  // agentic.market expects an x402 service registration. The public POST
  // endpoint per scout-foxtrot research is at api.agentic.market/v1/services
  // and accepts unauthenticated submissions for x402 services. Best-effort.
  try {
    const res = await fetch("https://api.agentic.market/v1/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `pcc-operator-${input.enterprise_id.slice(0, 8)}`,
        description: "PCC enterprise operator — accepts x402-priced jobs",
        endpoints: input.endpoints
      })
    });
    if (!res.ok) {
      const body = await res.text();
      emit({
        kind: "agentic.list.err",
        sponsor: "agentic.market",
        level: "err",
        session_id: input.enterprise_id,
        text: `HTTP ${res.status}: ${body.slice(0, 200)}`
      });
      // Fallback to the deterministic mock URL so the demo still flows
      return { marketplace_url: `https://api.agentic.market/v1/services/pending-${input.enterprise_id.slice(0, 8)}` };
    }
    const body = (await res.json()) as { marketplace_url?: string; id?: string };
    const url = body.marketplace_url ?? `https://api.agentic.market/v1/services/${body.id ?? input.enterprise_id.slice(0, 8)}`;
    emit({
      kind: "agentic.list.done",
      sponsor: "agentic.market",
      level: "ok",
      session_id: input.enterprise_id,
      text: `listed at ${url}`,
      payload: body
    });
    return { marketplace_url: url };
  } catch (e) {
    emit({
      kind: "agentic.list.err",
      sponsor: "agentic.market",
      level: "err",
      session_id: input.enterprise_id,
      text: e instanceof Error ? e.message : String(e)
    });
    return { marketplace_url: `https://api.agentic.market/v1/services/pending-${input.enterprise_id.slice(0, 8)}` };
  }
}
