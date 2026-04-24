// In-memory session store — swap to Redis/InsForge once available.
// Discovery state machine: started → data_connected → docs_ingested → interview → capabilities_drafted → built

export type OnboardState =
  | "started"
  | "data_connected"
  | "docs_ingested"
  | "interview"
  | "capabilities_drafted"
  | "built";

export interface Capability {
  id: string;
  label: string;
  params_schema?: Record<string, unknown>;
  availability?: string;
}

export interface OnboardSession {
  id: string;
  name: string;
  url?: string;
  contact_email?: string;
  state: OnboardState;
  capabilities?: Capability[];
  data_sources?: unknown[];
  backend?: { project_url: string; anon_key: string };
  agent?: { url: string; marketplace_url?: string };
  extras?: Record<string, unknown>;
  updated_at: number;
}

const store = new Map<string, OnboardSession>();

export async function startSession(input: {
  id: string;
  name: string;
  url?: string;
  contact_email?: string;
}): Promise<OnboardSession> {
  const session: OnboardSession = {
    ...input,
    state: "started",
    updated_at: Date.now()
  };
  store.set(input.id, session);
  return session;
}

export async function getSession(id: string): Promise<OnboardSession | undefined> {
  return store.get(id);
}

export async function advanceSession(
  id: string,
  to: OnboardState,
  patch: Record<string, unknown> = {}
): Promise<OnboardSession> {
  const current = store.get(id);
  if (!current) throw new Error(`session ${id} not found`);
  const next: OnboardSession = {
    ...current,
    ...patch,
    state: to,
    updated_at: Date.now()
  };
  store.set(id, next);
  return next;
}
