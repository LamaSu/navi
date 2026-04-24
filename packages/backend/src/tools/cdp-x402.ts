const MOCK = process.env.MOCK_CDP !== "false";

export async function createAgentWallet(input: {
  enterprise_id: string;
}): Promise<{ address: string; chain: string; funded: boolean }> {
  if (MOCK) {
    return {
      address: `0xmock${input.enterprise_id.slice(0, 6)}...`,
      chain: "base-sepolia",
      funded: true
    };
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
