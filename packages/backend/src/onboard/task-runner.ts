// Vapi Task-Runner — polls Vapi for the latest ended call on our phone number,
// extracts the assistant's structured output, executes the task list against
// our backend (Nexla / InsForge / Ghost / Redis / CDP / PCC).
//
// System prompt the assistant follows lives at apps/voice/TASK-RUNNER-PROMPT.md.

import { startSession, advanceSession, getSession } from "./state.js";
import { scrapeOrIngest } from "../tools/nexla.js";
import { signupInsforge } from "../tools/insforge.js";
import { forkGhost } from "../tools/ghost.js";
import { indexCapability } from "../tools/redis.js";
import { generateEnterpriseAgent } from "./generate.js";
import { publishToCited, geoQuestionFor } from "../tools/senso.js";

const VAPI_BASE = process.env.VAPI_BASE_URL ?? "https://api.vapi.ai";
const VAPI_KEY = process.env.VAPI_PRIVATE_KEY ?? "";
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID ?? "";

interface VapiTask {
  type: string;
  priority?: "high" | "medium" | "low";
  payload?: Record<string, unknown>;
  blockingMissingInfo?: string[];
}

interface StructuredOutput {
  intent: "offer" | "request" | "both" | "unknown";
  caller?: {
    name?: string;
    phone?: string;
    email?: string;
    preferredContactMethod?: string;
  };
  offer?: { services?: unknown[] };
  request?: Record<string, unknown>;
  tasks?: VapiTask[];
  missingInfo?: string[];
  confidence?: number;
}

interface RunnerOutput {
  phoneNumberId: string;
  callId: string | null;
  extracted: StructuredOutput | null;
  tasksReceived: VapiTask[];
  tasksExecuted: Array<{ type: string; ok: boolean; result?: unknown; error?: string }>;
  errors: string[];
  nextAction: "done" | "needs_followup" | "escalated" | "error";
}

async function vapiFetch(path: string): Promise<unknown> {
  if (!VAPI_KEY) throw new Error("VAPI_PRIVATE_KEY not set");
  const res = await fetch(`${VAPI_BASE}${path}`, {
    headers: { Authorization: `Bearer ${VAPI_KEY}` }
  });
  if (!res.ok) throw new Error(`vapi ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function findStructuredOutput(call: any): StructuredOutput | null {
  const candidates: unknown[] = [];
  if (call?.analysis?.structuredData) candidates.push(call.analysis.structuredData);
  if (call?.endOfCallReport?.structuredOutput) candidates.push(call.endOfCallReport.structuredOutput);
  if (Array.isArray(call?.messages)) {
    for (const m of call.messages) {
      if (m?.toolResults && Array.isArray(m.toolResults)) {
        for (const tr of m.toolResults) if (tr?.result) candidates.push(tr.result);
      }
      if (m?.structuredOutput) candidates.push(m.structuredOutput);
    }
  }
  // Pick the candidate that has a `tasks` array, falling back to the first.
  const withTasks = candidates.find((c: any) => Array.isArray(c?.tasks));
  return ((withTasks as StructuredOutput) ?? (candidates[0] as StructuredOutput) ?? null) || null;
}

async function executeTask(t: VapiTask, ctxSessionId: { id: string | null }): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  try {
    const p = t.payload ?? {};
    switch (t.type) {
      case "ONBOARD_START": {
        const id = crypto.randomUUID();
        await startSession({
          id,
          name: String((p as any).name ?? "unknown enterprise"),
          url: typeof (p as any).url === "string" ? (p as any).url : undefined,
          contact_email: typeof (p as any).email === "string" ? (p as any).email : undefined
        });
        ctxSessionId.id = id;
        return { ok: true, result: { session_id: id } };
      }
      case "CONNECT_DATA_SOURCE": {
        if (!ctxSessionId.id) throw new Error("no session — run ONBOARD_START first");
        const r = await scrapeOrIngest({
          session_id: ctxSessionId.id,
          url: String((p as any).url ?? ""),
          goal: String((p as any).goal ?? "extract enterprise capabilities")
        });
        await advanceSession(ctxSessionId.id, "data_connected", { nexla: r });
        return { ok: true, result: r };
      }
      case "INGEST_DOCS": {
        if (!ctxSessionId.id) throw new Error("no session");
        const docs = Array.isArray((p as any).doc_urls) ? ((p as any).doc_urls as string[]) : [];
        const r = await forkGhost({ session_id: ctxSessionId.id, docs });
        await advanceSession(ctxSessionId.id, "docs_ingested", { ghost: r });
        return { ok: true, result: r };
      }
      case "BUILD_AGENT": {
        if (!ctxSessionId.id) throw new Error("no session");
        const session = await getSession(ctxSessionId.id);
        if (!session) throw new Error("session vanished");
        const backend = await signupInsforge({ name: session.name });
        await indexCapability({ session_id: ctxSessionId.id, capabilities: session.capabilities ?? [] });
        const agent = await generateEnterpriseAgent({ session, backend });
        await advanceSession(ctxSessionId.id, "built", { agent, backend });
        return { ok: true, result: { agent, backend } };
      }
      case "LIST_OPERATOR": {
        if (!ctxSessionId.id) throw new Error("no session");
        const session = await getSession(ctxSessionId.id);
        if (!session) throw new Error("session vanished");
        const profile = {
          enterprise_id: session.id,
          name: session.name,
          url: session.url,
          city: typeof (p as any).city === "string" ? (p as any).city : undefined,
          capabilities: (session.capabilities ?? []).map((c) => c.label),
          materials: Array.isArray((p as any).materials) ? ((p as any).materials as string[]) : [],
          hours: typeof (p as any).hours === "string" ? (p as any).hours : undefined,
          certifications: Array.isArray((p as any).certifications) ? ((p as any).certifications as string[]) : [],
          agent_url: session.agent?.url,
          marketplace_url: session.agent?.marketplace_url,
          contact_email: session.contact_email
        };
        const cited = await publishToCited({
          geo_question_id: geoQuestionFor(profile),
          profile
        });
        return { ok: true, result: cited };
      }
      case "FOLLOW_UP":
        return { ok: true, result: { queued: t.blockingMissingInfo ?? [] } };
      default:
        return { ok: false, error: `unknown task type: ${t.type}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function runTaskRunner(): Promise<RunnerOutput> {
  const errors: string[] = [];
  const out: RunnerOutput = {
    phoneNumberId: PHONE_NUMBER_ID,
    callId: null,
    extracted: null,
    tasksReceived: [],
    tasksExecuted: [],
    errors,
    nextAction: "error"
  };

  // 1. List recent calls (filter by phoneNumberId, fall back to client-side filter)
  let listed: any;
  try {
    listed = await vapiFetch(
      `/v2/call?page=1&limit=25&sortOrder=DESC&phoneNumberId=${PHONE_NUMBER_ID}`
    );
  } catch {
    listed = await vapiFetch(`/v2/call?page=1&limit=25&sortOrder=DESC`);
  }
  const allCalls: any[] = Array.isArray(listed?.data)
    ? listed.data
    : Array.isArray(listed?.calls)
    ? listed.calls
    : Array.isArray(listed)
    ? listed
    : [];

  const candidate = allCalls.find(
    (c) => c?.phoneNumberId === PHONE_NUMBER_ID && c?.status === "ended"
  );
  if (!candidate) {
    errors.push("no ended call for phoneNumberId");
    return out;
  }
  out.callId = candidate.id ?? candidate.callId ?? null;

  // 2. Fetch full call detail
  const detail = await vapiFetch(`/call/${out.callId}`);
  const structured = findStructuredOutput(detail);
  if (!structured) {
    errors.push("no structured output found in call");
    return out;
  }
  out.extracted = structured;

  // 3. Validate confidence + tasks; if low, force a FOLLOW_UP
  let tasks: VapiTask[] = Array.isArray(structured.tasks) ? structured.tasks : [];
  const conf = typeof structured.confidence === "number" ? structured.confidence : 0;
  if (conf < 0.6 || tasks.length === 0) {
    tasks = [
      {
        type: "FOLLOW_UP",
        priority: "high",
        payload: { reason: "low_confidence_or_missing_tasks" },
        blockingMissingInfo: structured.missingInfo ?? ["unknown"]
      }
    ];
  }
  out.tasksReceived = tasks;

  // 4. Execute in priority order high → medium → low
  const order = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...tasks].sort(
    (a, b) =>
      (order[a.priority ?? "medium"] ?? 1) - (order[b.priority ?? "medium"] ?? 1)
  );
  const ctx: { id: string | null } = { id: null };
  for (const t of sorted) {
    const result = await executeTask(t, ctx);
    out.tasksExecuted.push({ type: t.type, ...result });
    if (!result.ok) errors.push(`${t.type}: ${result.error}`);
  }

  // 5. Decide next action
  const anyFailed = out.tasksExecuted.some((r) => !r.ok);
  const anyFollowUp = out.tasksReceived.some((t) => t.type === "FOLLOW_UP");
  out.nextAction = anyFailed
    ? "escalated"
    : anyFollowUp
    ? "needs_followup"
    : "done";
  return out;
}
