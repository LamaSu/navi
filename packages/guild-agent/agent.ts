// Guild-hosted Enterprise-Operator meta-agent.
//
// Design per scout-bravo research (ai/research/02-guild.md):
//  - llmAgent shape, multi-turn
//  - NO external npm — only @guildai/agents-sdk, zod, @guildai-services/*
//  - Tools come from Guild custom integration "pcc-operator-backend" (OpenAPI in packages/backend/openapi.yaml)
//
// After `guild integration create --openapi packages/backend/openapi.yaml --name pcc-operator-backend`
// Guild auto-generates tools:
//   pcc_operator_backend_onboard_start
//   pcc_operator_backend_onboard_scrape
//   pcc_operator_backend_onboard_ingest_docs
//   pcc_operator_backend_onboard_interview_turn
//   pcc_operator_backend_onboard_build_agent
//   pcc_operator_backend_onboard_status
//
// This file is the Guild-deployable agent manifest.

import { llmAgent, guildTools } from "@guildai/agents-sdk";
import { z } from "zod";

const systemPrompt = `
You are the PCC Enterprise-Operator Onboarder — a meta-agent that helps an
enterprise (machining, fleets, labs, warehouses) join the Physical Capability
Cloud (PCC) as a live, discoverable, x402-earning operator.

Your job is to walk a human pointman (shop-floor lead, ops manager, lab admin)
through six steps in a natural conversation:

1. IDENTIFY — ask for company name + public website URL (optional) + contact.
2. DATA-CONNECT — offer to connect their primary data system (ERP / CMMS /
   Salesforce / SharePoint / S3 / CSV). Use onboard_scrape to create a Nexla
   source. If they only have a website, pass the URL to onboard_scrape.
3. DOC-INGEST — ask for SOPs, MOPs, equipment manuals. Call
   onboard_ingest_docs with the URLs (Ghost forks a verifier Postgres + indexes).
4. INTERVIEW — call onboard_interview_turn with every user message to extract
   capabilities, parameters, lead time, availability, pricing.
5. BUILD — once you have enough to draft a capability manifest, call
   onboard_build_agent. This generates + deploys a custom enterprise agent,
   creates an InsForge Postgres backend, Redis index, CDP wallet, lists on
   agentic.market, and registers with PCC's agent-package.
6. HAND-OFF — give the pointman links: Guild agent URL, agentic.market
   listing, InsForge claim URL, Base Sepolia escrow allowlist.

Style: concise. One question at a time. Never dump more than 3 bullets. Use
onboard_status to answer "where are we?" without re-asking. If a tool fails,
explain the gap in one sentence and offer a fallback.
`;

export default llmAgent({
  name: "pcc-enterprise-onboarder",
  description:
    "Onboards an enterprise (machining, fleets, labs, warehouses) onto PCC — discovers data sources, drafts capability manifest, generates + deploys a custom enterprise agent, lists on agentic.market with x402 monetization.",
  systemPrompt,
  multiTurn: true,
  tools: guildTools({
    // Auto-generated from the OpenAPI custom integration
    include: [
      "pcc_operator_backend_onboard_start",
      "pcc_operator_backend_onboard_scrape",
      "pcc_operator_backend_onboard_ingest_docs",
      "pcc_operator_backend_onboard_interview_turn",
      "pcc_operator_backend_onboard_build_agent",
      "pcc_operator_backend_onboard_status",
      "pcc_operator_backend_health"
    ]
  }),
  // Output contract — the Guild agent emits this JSON once onboarding completes
  outputSchema: z.object({
    session_id: z.string(),
    enterprise_name: z.string(),
    agent_url: z.string().url().optional(),
    marketplace_url: z.string().url().optional(),
    escrow_wallet: z.string().optional(),
    next_steps: z.array(z.string())
  })
});
