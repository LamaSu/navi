import type { OnboardSession } from "./state.js";

// Agent code generator: takes the enterprise profile and emits a custom
// enterprise-agent.ts file with tools per capability. For demo we return a stub.
export async function generateEnterpriseAgent(input: {
  session: OnboardSession;
  backend: { project_url: string; anon_key: string };
}): Promise<{ url: string; marketplace_url?: string; guild_agent_id?: string }> {
  // TODO (B2 in INTEGRATION-TASKS):
  //  - Render enterprise-agent.ts from a template with the session.capabilities
  //  - Wire a2a intent handlers matching PCC's 34 intents
  //  - Deploy to Guild via `guild agent save --publish` (B3)
  //  - Register with PCC agent-package
  //  - List on agentic.market
  return {
    url: `https://guild.ai/agents/pending-${input.session.id.slice(0, 8)}`,
    marketplace_url: `https://api.agentic.market/v1/services/pending-${input.session.id.slice(0, 8)}`
  };
}
