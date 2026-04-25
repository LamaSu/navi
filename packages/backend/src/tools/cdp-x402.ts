import { emit } from "../lib/event-bus.js";
const MOCK = process.env.MOCK_CDP !== "false";

export async function createAgentWallet(input: {
  enterprise_id: string;
}): Promise<{ address: string; chain: string; funded: boolean }> {
  emit({ kind: "cdp.wallet.start", sponsor: "Coinbase CDP", level: "info", session_id: input.enterprise_id, text: `createWallet on base-sepolia` });
  if (MOCK) {
    const r = {
      address: `0xmock${input.enterprise_id.slice(0, 6)}...`,
      chain: "base-sepolia",
      funded: true
    };
    emit({ kind: "cdp.wallet.mock", sponsor: "Coinbase CDP", level: "warn", session_id: input.enterprise_id, text: `MOCK_CDP=true · ${r.address} (faucet skipped)`, payload: r });
    return r;
  }
  // TODO: @coinbase/cdp-sdk: createWallet() + fundFromFaucet() on Base Sepolia
  throw new Error("cdp live wiring not implemented — set MOCK_CDP=true");
}

export async function listOnAgenticMarket(input: {
  enterprise_id: string;
  endpoints: { url: string; price_usdc: string }[];
}): Promise<{ marketplace_url: string }> {
  if (MOCK) {
    return { marketplace_url: `https://api.agentic.market/v1/services/mock-${input.enterprise_id.slice(0, 6)}` };
  }
  // TODO: POST api.agentic.market/v1/services
  throw new Error("agentic.market live wiring not implemented — set MOCK_CDP=true");
}
