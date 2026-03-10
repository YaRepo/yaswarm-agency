import { useAuthStore } from "@/stores/auth";

const API_BASE = "/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const token = useAuthStore.getState().token;

  // Don't set Content-Type for FormData — browser sets it automatically with boundary
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      useAuthStore.getState().logout();
      return { ok: false, error: "Unauthorized" };
    }

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// ─── Bot Management ─────────────────────────────────────────

export const bots = {
  list: () => request<any[]>("/bots"),
  get: (id: string) => request<any>(`/bots/${id}`),
  subAgents: () => request<any[]>("/bots/sub-agents"),
  models: () => request<any>("/bots/models"),
  addDepartment: (payload: {
    departmentId?: string;
    departmentName?: string;
    role?: string;
    botName?: string;
    botId?: string;
    tokenEnv?: string;
    token?: string;
    backend?: string;
    modelTier?: string;
    model?: string;
    fallbackModels?: string[];
    providerIds?: string[];
    backendUrl?: string;
    autoInstallBackend?: boolean;
    topicName?: string;
    companyReference?: string;
  }) =>
    request<any>("/bots/departments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDepartment: (
    departmentId: string,
    payload: {
      departmentName?: string;
      role?: string;
      botName?: string;
      botId?: string;
      tokenEnv?: string;
      token?: string;
      backend?: string;
      modelTier?: string;
      model?: string;
      fallbackModels?: string[];
      providerIds?: string[];
      backendUrl?: string;
      topicName?: string;
      autoInstallBackend?: boolean;
    }
  ) =>
    request<any>(`/bots/departments/${encodeURIComponent(departmentId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  updateCeo: (payload: {
    role?: string;
    botName?: string;
    botId?: string;
    tokenEnv?: string;
    token?: string;
    backend?: string;
    modelTier?: string;
    model?: string;
    fallbackModels?: string[];
    providerIds?: string[];
    backendUrl?: string;
    topicName?: string;
    autoInstallBackend?: boolean;
  }) =>
    request<any>("/bots/ceo", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  backendTools: () => request<any>("/bots/backend-tools"),
  installBackendTool: (toolId: string) =>
    request<any>("/bots/backend-tools/install", {
      method: "POST",
      body: JSON.stringify({ toolId }),
    }),
  updateBackendTool: (toolId: string) =>
    request<any>("/bots/backend-tools/update", {
      method: "POST",
      body: JSON.stringify({ toolId }),
    }),
  backendCapabilities: (backend: string) =>
    request<any>(`/bots/backend-capabilities?backend=${encodeURIComponent(backend)}`),
};

// ─── Telemetry ──────────────────────────────────────────────

export const telemetry = {
  events: (params?: { department?: string; limit?: number; since?: string }) => {
    const qs = new URLSearchParams();
    if (params?.department) qs.set("department", params.department);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.since) qs.set("since", params.since);
    return request<any[]>(`/telemetry/events?${qs}`);
  },
  performance: () => request<any>("/telemetry/performance"),
  summary: () => request<any>("/telemetry/summary"),
};

// ─── Tickets ────────────────────────────────────────────────

export const tickets = {
  list: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return request<any[]>(`/tickets${qs}`);
  },
  get: (id: string) => request<any>(`/tickets/${id}`),
  create: (data: {
    type?: string;
    department?: string;
    summary: string;
    details?: string;
    assigned?: string;
    reported_by?: string;
    reporter_role?: string;
    source?: string;
  }) =>
    request<any>("/tickets", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  debuggerConfig: () => request<any>("/tickets/debugger-config"),
  updateDebuggerConfig: (data: {
    enabled?: boolean;
    model?: string;
    executionBackend?: "bash" | "tremcp-ssh" | "auto";
    baseUrl?: string;
    apiKeyEnv?: string;
    autoRun?: boolean;
    allowRootActions?: boolean;
    allowAnyPath?: boolean;
    useTremcpSsh?: boolean;
    maxCommands?: number;
  }) => request<any>("/tickets/debugger-config", { method: "PUT", body: JSON.stringify(data) }),
  runDebugger: (id: string) =>
    request<any>(`/tickets/${encodeURIComponent(id)}/debug-run`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
};

// ─── Memory ─────────────────────────────────────────────────

export const memory = {
  timeline: (params?: { limit?: number; source?: string; department?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.source) qs.set("source", params.source);
    if (params?.department) qs.set("department", params.department);
    return request<any[]>(`/memory/timeline?${qs}`);
  },
  search: (query: string) => request<any[]>(`/memory/search?q=${encodeURIComponent(query)}`),
  inject: (formData: FormData) =>
    request<any>("/memory/inject", {
      method: "POST",
      body: formData,
    }),
  updateEntry: (payload: {
    source: "sqlite" | "markdown";
    id?: string;
    file?: string;
    summary?: string;
    status?: string;
    project?: string;
    department?: string;
    tags?: string[] | string;
    title?: string;
    content?: string;
  }) =>
    request<any>("/memory/entry", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteEntry: (payload: { source: "sqlite" | "markdown"; id?: string; file?: string }) =>
    request<any>("/memory/entry", {
      method: "DELETE",
      body: JSON.stringify(payload),
    }),
};

// ─── Skills ─────────────────────────────────────────────────

export const skills = {
  list: () => request<any[]>("/skills"),
  get: (name: string) => request<any>(`/skills/${name}`),
  routing: () => request<any>("/skills/routing"),
};

// ─── MCP & Tools ────────────────────────────────────────────

export const mcp = {
  servers: () => request<any[]>("/mcp/servers"),
  tools: () => request<any[]>("/mcp/tools"),
  registry: () => request<any>("/mcp/registry"),
  config: () => request<any>("/mcp/config"),
  env: () => request<any>("/mcp/env"),
  doctor: () => request<any>("/mcp/doctor"),
  accessAudit: () => request<any>("/mcp/access-audit"),
  syncCliMcp: (cliId: string) =>
    request<any>("/mcp/cli/sync", {
      method: "POST",
      body: JSON.stringify({ cliId }),
    }),
  debugFixCli: (payload: { cliId: string; note?: string; provider?: string; model?: string }) =>
    request<any>("/mcp/cli/debug-fix", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  setServerEnabled: (serverName: string, enabled: boolean) =>
    request<any>(`/mcp/servers/${encodeURIComponent(serverName)}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  upsertEnv: (key: string, value: string) =>
    request<any>("/mcp/env", {
      method: "PUT",
      body: JSON.stringify({ key, value }),
    }),
};

// ─── API Keys / Env ─────────────────────────────────────────

export const env = {
  scopes: () => request<any>("/env/scopes"),
  entries: (scope: "agency" | "root" = "agency") =>
    request<any>(`/env/entries?scope=${encodeURIComponent(scope)}`),
  upsert: (scope: "agency" | "root", key: string, value: string) =>
    request<any>("/env/entries", {
      method: "PUT",
      body: JSON.stringify({ scope, key, value }),
    }),
};

// ─── Obsidian ──────────────────────────────────────────────

export const obsidian = {
  status: () => request<any>("/obsidian/status"),
  vaults: () => request<any>("/obsidian/vaults"),
  bootstrapVaults: () =>
    request<any>("/obsidian/vaults/bootstrap", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  createProjectVault: (projectName: string, withTemplate = true) =>
    request<any>("/obsidian/vaults/project", {
      method: "POST",
      body: JSON.stringify({ projectName, withTemplate }),
    }),
  migrateLegacyBooks: (force = false) =>
    request<any>("/obsidian/migrate-legacy-books", {
      method: "POST",
      body: JSON.stringify({ force }),
    }),
  migrateLegacyPlugins: () =>
    request<any>("/obsidian/migrate-legacy-plugins", {
      method: "POST",
      body: JSON.stringify({}),
    }),
};

// ─── Telegram ───────────────────────────────────────────────

export const telegram = {
  threads: () => request<any>("/telegram/threads"),
  messages: (thread_id?: number, limit?: number) => {
    const qs = new URLSearchParams();
    if (thread_id !== undefined) qs.set("thread_id", String(thread_id));
    if (limit) qs.set("limit", String(limit));
    return request<any>(`/telegram/messages?${qs}`);
  },
  send: (text: string, thread_id: number) =>
    request<any>("/telegram/send", {
      method: "POST",
      body: JSON.stringify({ text, thread_id }),
    }),
  who: () => request<any>("/telegram/who", {
    method: "POST",
    body: JSON.stringify({}),
  }),
  bots: () => request<any>("/telegram/bots"),
  upsertBotToken: (tokenEnv: string, token: string) =>
    request<any>("/telegram/bot-token", {
      method: "PUT",
      body: JSON.stringify({ tokenEnv, token }),
    }),
  syncBridges: () =>
    request<any>("/telegram/sync-bridges", {
      method: "POST",
      body: JSON.stringify({}),
    }),
};

// ─── Models ─────────────────────────────────────────────────

export const models = {
  overview: () => request<any>("/models"),
  assignments: () => request<any>("/models/assignments"),
  backends: () => request<any>("/models/backends"),
  catalog: () => request<any>("/models/catalog"),
  debugProviders: () => request<any>("/models/debug/providers"),
  debugTest: (payload: {
    provider: string;
    model?: string;
    apiKey?: string;
    providerUrl?: string;
    saveToEnv?: boolean;
  }) =>
    request<any>("/models/debug/test", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ─── Desk ───────────────────────────────────────────────────

export const desk = {
  items: (stage?: string) => {
    const qs = stage ? `?stage=${stage}` : "";
    return request<any[]>(`/desk${qs}`);
  },
  get: (id: string) => request<any>(`/desk/${id}`),
};

// ─── Files ──────────────────────────────────────────────────

export const files = {
  tree: (path?: string) => {
    const qs = path ? `?path=${encodeURIComponent(path)}` : "";
    return request<any>(`/files/tree${qs}`);
  },
  read: (path: string) => request<any>(`/files/read?path=${encodeURIComponent(path)}`),
  upload: async (file: File, dest?: string): Promise<{ ok: boolean; data?: any; error?: string }> => {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append("file", file);
    const qs = dest ? `?dest=${encodeURIComponent(dest)}` : "";
    try {
      const res = await fetch(`${API_BASE}/files/upload${qs}`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || res.statusText };
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Network error" };
    }
  },
  write: (filePath: string, content: string) =>
    request<{ ok: boolean; path: string; size: number }>("/files/write", {
      method: "PUT",
      body: JSON.stringify({ path: filePath, content }),
    }),
};

// ─── Logs ───────────────────────────────────────────────────

export const logs = {
  recent: (limit?: number) => request<any[]>(`/logs/recent?limit=${limit || 100}`),
  deskEvents: (limit?: number) => request<any[]>(`/logs/desk?limit=${limit || 100}`),
};

// ─── Changelog ──────────────────────────────────────────────

export const changelog = {
  entries: () => request<any[]>("/changelog"),
};

// ─── Chat ───────────────────────────────────────────────────

export interface ChatSessionSummary {
  id: string;
  department: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
}

export interface ChatSession {
  id: string;
  department: string;
  title: string;
  messages: ChatMsg[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMsg {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  department?: string;
  model?: string;
}

export interface ChatSendResult {
  content: string;
  department?: string;
  model?: string;
  runId?: string;
  sessionId: string;
}

export const chat = {
  /** List all sessions (summaries only, most recent first) */
  sessions: () =>
    request<{ sessions: ChatSessionSummary[] }>("/chat/sessions"),

  /** Get a specific session with full messages */
  getSession: (id: string) =>
    request<ChatSession>(`/chat/sessions/${id}`),

  /** Create a new session */
  createSession: (department?: string) =>
    request<ChatSession>("/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ department }),
    }),

  /** Delete a session */
  deleteSession: (id: string) =>
    request<{ ok: boolean }>(`/chat/sessions/${id}`, { method: "DELETE" }),

  /** Send a message (with session persistence) */
  send: (message: string, department?: string, sessionId?: string) =>
    request<ChatSendResult>("/chat/send", {
      method: "POST",
      body: JSON.stringify({ message, department, sessionId }),
    }),

  /** List available agents */
  agents: () => request<any>("/chat/agents"),

  /** Legacy: get history of most recent session */
  history: () => request<{ messages: ChatMsg[]; sessionId?: string }>("/chat/history"),
};

// ─── Vector Search ──────────────────────────────────────────

export interface VectorSearchResult {
  id: string;
  text: string;
  metadata: Record<string, string>;
  distance: number;
  similarity: number;
}

export interface VectorStats {
  collection: { id?: string; name?: string; count?: number; error?: string };
  lastIndexed: string | null;
  totalDocs: number;
  sourceCounts: Record<string, number>;
  indexing: boolean;
  lastError: string | null;
  modelLoaded: boolean;
  modelLoading: boolean;
  availableSources: string[];
}

export const vector = {
  /** Get index statistics and status */
  stats: () => request<VectorStats>("/vector/stats"),

  /** Trigger indexing (all sources or specific source) */
  index: (source?: string) =>
    request<{ status: string; message: string }>("/vector/index", {
      method: "POST",
      body: JSON.stringify(source ? { source } : {}),
    }),

  /** Semantic search */
  search: (query: string, n?: number, source?: string) => {
    const qs = new URLSearchParams();
    qs.set("q", query);
    if (n) qs.set("n", String(n));
    if (source) qs.set("source", source);
    return request<{
      query: string;
      results: VectorSearchResult[];
      total: number;
      source: string;
    }>(`/vector/search?${qs}`);
  },

  /** Delete vector entries by Chroma IDs */
  deleteEntries: (ids: string[]) =>
    request<{ ok: boolean; deleted: number; count: number }>("/vector/entries", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),

  /** Upload file to vector database */
  upload: async (file: File): Promise<{ ok: boolean; data?: any; error?: string }> => {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/vector/upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || res.statusText };
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Network error" };
    }
  },

  /** Poll upload job status */
  uploadStatus: (fileId: string) =>
    request<{
      fileId: string;
      filename: string;
      status: "processing" | "done" | "error";
      chunks: number;
      indexed: number;
      error?: string;
      startedAt: string;
      completedAt?: string;
    }>(`/vector/upload/${fileId}`),

  /** Health check */
  health: () => request<any>("/vector/health"),
};

export const terminal = {
  sessions: () => request<any>("/terminal/sessions"),
  createSession: (
    scope: "main" | "ceo" | "department" | "user",
    departmentId?: string,
    opts?: { sessionId?: string; name?: string; cwd?: string }
  ) =>
    request<any>("/terminal/sessions", {
      method: "POST",
      body: JSON.stringify({ scope, departmentId, ...opts }),
    }),
  exec: (
    sessionId: string,
    command: string,
    opts?: {
      taskName?: string;
      taskWeight?: "light" | "medium" | "heavy";
      force?: boolean;
      actorRole?: "subagent" | "head" | "ceo" | "user";
      requestedAccess?: "default" | "full";
      approvalId?: string;
    }
  ) =>
    request<any>(`/terminal/sessions/${encodeURIComponent(sessionId)}/exec`, {
      method: "POST",
      body: JSON.stringify({ command, ...opts }),
    }),
};

export const approvals = {
  list: () => request<any>("/approvals"),
  approve: (id: string, payload?: { note?: string; approvedCommand?: string }) =>
    request<any>(`/approvals/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    }),
  reject: (id: string, payload?: { note?: string }) =>
    request<any>(`/approvals/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    }),
};

export const cliPermissions = {
  get: () => request<any>("/cli-permissions"),
  update: (payload: any) =>
    request<any>("/cli-permissions", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const resource = {
  governor: (activeHeavy?: number) =>
    request<any>(
      `/resource/governor${typeof activeHeavy === "number" ? `?activeHeavy=${activeHeavy}` : ""}`
    ),
  updateGovernor: (payload: any) =>
    request<any>("/resource/governor", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  health: (activeHeavy?: number) =>
    request<any>(
      `/resource/health${typeof activeHeavy === "number" ? `?activeHeavy=${activeHeavy}` : ""}`
    ),
  advise: (payload: { taskWeight: "light" | "medium" | "heavy"; activeHeavy?: number }) =>
    request<any>("/resource/advise", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const agents = {
  status: () => request<any>("/agents/status"),
};

export const communication = {
  delegations: () => request<any>("/communication/delegations"),
  mentions: () => request<any>("/communication/mentions"),
};

export const modelRouting = {
  events: () => request<any>("/model-routing/events"),
};

export const api = {
  bots,
  telemetry,
  tickets,
  memory,
  skills,
  mcp,
  env,
  obsidian,
  telegram,
  models,
  desk,
  files,
  logs,
  changelog,
  chat,
  vector,
  terminal,
  resource,
  approvals,
  cliPermissions,
  agents,
  communication,
  modelRouting,
};

export default api;
