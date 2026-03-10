import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import * as pty from "node-pty";
import path from "path";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Route imports
import botsRouter from "./routes/bots";
import telemetryRouter from "./routes/telemetry";
import ticketsRouter from "./routes/tickets";
import memoryRouter from "./routes/memory";
import skillsRouter from "./routes/skills";
import mcpRouter from "./routes/mcp";
import deskRouter from "./routes/desk";
import filesRouter from "./routes/files";
import logsRouter from "./routes/logs";
import changelogRouter from "./routes/changelog";
import chatRouter from "./routes/chat";
import telegramRouter from "./routes/telegram";
import modelsRouter from "./routes/models";
import vectorRouter from "./routes/vector";
import sessionsRouter from "./routes/sessions";
import ralphLoopRouter from "./routes/ralph_loop";
import agentsRouter from "./routes/agents";
import communicationRouter from "./routes/communication";
import modelRoutingRouter from "./routes/model-routing";
import envRouter from "./routes/env";
import resourceGovernorRouter from "./routes/resource-governor";
import obsidianRouter from "./routes/obsidian";
import {
  readGovernorConfig,
  collectMachineSnapshot,
  evaluateGovernorState,
  adviseTaskRun,
  detectTremcpStatus,
  type TaskWeight,
} from "./lib/resource-governor";
import {
  readCliPermissionPolicy,
  writeCliPermissionPolicy,
  evaluatePermission,
  type CliActorRole,
  type CliAccessMode,
} from "./lib/cli-permissions";

const app = express();
const PORT = Number(process.env.YASWARM_PORT || 3002);
function resolveAgencyRoot(): string {
  const candidates = [
    process.env.AGENCY_ROOT,
    process.env.YASWARM_WORKSPACE_ROOT,
    "/app/projects/yaswarm-desk-workspace/agency",
    "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency",
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return "/app/projects/yaswarm-desk-workspace/agency";
}

const AGENCY_ROOT = resolveAgencyRoot();
const AUTH_TOKEN = process.env.YASWARM_TOKEN || "yaswarm-token-agency";
const CHROMA_URL = process.env.CHROMA_URL || "http://yaswarm-chromadb:8000";
const VECTOR_HEALTH_MONITOR_ENABLED =
  process.env.VECTOR_HEALTH_MONITOR_ENABLED !== "0";
const VECTOR_HEALTH_MONITOR_ALERTS_ENABLED =
  process.env.VECTOR_HEALTH_MONITOR_ALERTS_ENABLED !== "0";
const VECTOR_HEALTH_MONITOR_INTERVAL_MS = Math.max(
  15_000,
  Number(process.env.VECTOR_HEALTH_MONITOR_INTERVAL_MS || 60_000),
);
const TICKETS_DIR = path.join(AGENCY_ROOT, "desk", "tickets");
const TICKET_COUNTER_PATH = path.join(TICKETS_DIR, "counter.txt");
const AGENCY_CONFIG_PATH = path.join(AGENCY_ROOT, "config", "agency-config.json");
const TELEGRAM_ALERT_BOT_TOKEN = process.env.YASWARM_CEO_BOT_TOKEN || "";

function loadAgencyTelegramRouting(): {
  groupChatId: number;
  ceoThreadId: number;
} {
  const fallback = {
    groupChatId: -1003851268051,
    ceoThreadId: 592,
  };
  if (!existsSync(AGENCY_CONFIG_PATH)) return fallback;
  try {
    const data = JSON.parse(readFileSync(AGENCY_CONFIG_PATH, "utf-8"));
    const groupChatId = Number(data?.group_chat_id) || fallback.groupChatId;
    const ceoThreadId = Number(data?.ceo?.topic_thread_id) || fallback.ceoThreadId;
    return { groupChatId, ceoThreadId };
  } catch {
    return fallback;
  }
}

const agencyTelegramRouting = loadAgencyTelegramRouting();
const TELEGRAM_ALERT_CHAT_ID = Number(
  process.env.VECTOR_HEALTH_MONITOR_ALERT_CHAT_ID || agencyTelegramRouting.groupChatId,
);
const TELEGRAM_ALERT_THREAD_ID = Number(
  process.env.VECTOR_HEALTH_MONITOR_ALERT_THREAD_ID || agencyTelegramRouting.ceoThreadId,
);
const VECTOR_HEALTH_MONITOR_CRITICAL_WINDOW_MS = Math.max(
  60_000,
  Number(process.env.VECTOR_HEALTH_MONITOR_CRITICAL_WINDOW_MS || 10 * 60_000),
);
const VECTOR_HEALTH_MONITOR_CRITICAL_THRESHOLD = Math.max(
  2,
  Number(process.env.VECTOR_HEALTH_MONITOR_CRITICAL_THRESHOLD || 2),
);
const AGENCY_ENV_PATH = path.join(AGENCY_ROOT, ".env");
const ROOT_ENV_PATH = "/root/agency.env";

function parseEnvValue(filePath: string, key: string): string | null {
  if (!existsSync(filePath)) return null;
  try {
    const raw = readFileSync(filePath, "utf-8");
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m || m[1] !== key) continue;
      let value = m[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      value = value.replace(/\\n/g, "\n").trim();
      return value.length > 0 ? value : null;
    }
  } catch {
    return null;
  }
  return null;
}

function parseEnvEntries(filePath: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(filePath)) return out;
  try {
    const raw = readFileSync(filePath, "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim() || line.trim().startsWith("#")) continue;
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let value = m[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[m[1]] = value.replace(/\\n/g, "\n");
    }
  } catch {
    return out;
  }
  return out;
}

function getValidAuthTokens(): Set<string> {
  const tokens = new Set<string>();
  if (AUTH_TOKEN && AUTH_TOKEN.trim()) tokens.add(AUTH_TOKEN.trim());
  const agencyEnvToken = parseEnvValue(AGENCY_ENV_PATH, "YASWARM_TOKEN");
  if (agencyEnvToken) tokens.add(agencyEnvToken);
  const rootEnvToken = parseEnvValue(ROOT_ENV_PATH, "YASWARM_TOKEN");
  if (rootEnvToken) tokens.add(rootEnvToken);
  return tokens;
}

function isAuthorizedToken(token: string | undefined): boolean {
  if (!token || !token.trim()) return false;
  return getValidAuthTokens().has(token.trim());
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: "2mb" }));

/**
 * Bearer-token auth middleware applied to all /api routes except /api/auth/*.
 */
function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.headers.authorization?.replace("Bearer ", "").trim();
  if (!isAuthorizedToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// Auth verification (public — no middleware)
// ---------------------------------------------------------------------------
app.post("/api/auth/verify", (req: Request, res: Response): void => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (isAuthorizedToken(token)) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: "Invalid token" });
  }
});

// ---------------------------------------------------------------------------
// Public endpoints (no auth required)
// ---------------------------------------------------------------------------
app.get("/api/config", (_req: Request, res: Response) => {
  res.json({
    // Chat is handled server-side — no gateway credentials exposed to browser
    chatMode: "server-relay",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ---------------------------------------------------------------------------
// OpenAI-compatible embeddings endpoint (public — used by local memory search)
// ---------------------------------------------------------------------------
import { getEmbedder } from "./routes/vector";

app.post("/v1/embeddings", async (req: Request, res: Response) => {
  try {
    const { input, model } = req.body ?? {};
    if (!input) {
      res.status(400).json({ error: { message: "Missing 'input' field", type: "invalid_request_error" } });
      return;
    }

    // Normalize input to array of strings
    const texts: string[] = Array.isArray(input) ? input : [String(input)];

    const extractor = await getEmbedder();
    const embeddings: { object: string; embedding: number[]; index: number }[] = [];

    for (let i = 0; i < texts.length; i++) {
      const output = await extractor(texts[i], { pooling: "mean", normalize: true });
      const vector = Array.from(output.data as Float32Array);
      embeddings.push({ object: "embedding", embedding: vector, index: i });
    }

    res.json({
      object: "list",
      data: embeddings,
      model: model || "all-MiniLM-L6-v2",
      usage: {
        prompt_tokens: texts.reduce((sum, t) => sum + t.split(/\s+/).length, 0),
        total_tokens: texts.reduce((sum, t) => sum + t.split(/\s+/).length, 0),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Embeddings] Error:", message);
    res.status(500).json({ error: { message, type: "server_error" } });
  }
});

// ---------------------------------------------------------------------------
// Protected API routes
// ---------------------------------------------------------------------------
app.use("/api", authMiddleware);

app.use("/api", botsRouter);
app.use("/api", telemetryRouter);
app.use("/api", ticketsRouter);
app.use("/api", memoryRouter);
app.use("/api", skillsRouter);
app.use("/api", mcpRouter);
app.use("/api", deskRouter);
app.use("/api", filesRouter);
app.use("/api", logsRouter);
app.use("/api", changelogRouter);
app.use("/api", chatRouter);
app.use("/api", telegramRouter);
app.use("/api", modelsRouter);
app.use("/api", vectorRouter);
app.use("/api", sessionsRouter);
app.use("/api", agentsRouter);
app.use("/api", communicationRouter);
app.use("/api", modelRoutingRouter);
app.use("/api", ralphLoopRouter);
app.use("/api", envRouter);
app.use("/api", resourceGovernorRouter);
app.use("/api", obsidianRouter);

// Health-check (behind auth so dashboards can ping it with their token)
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------
const server = createServer(app);

// WebSocketServer is created with noServer so we control the upgrade manually.
// This avoids port conflicts with any other WS servers in the process.
const wss = new WebSocketServer({ noServer: true });
const wssTerminal = new WebSocketServer({ noServer: true });

type TerminalScope = "main" | "ceo" | "department" | "user";

type TerminalSession = {
  id: string;
  scope: TerminalScope;
  name: string;
  departmentId: string | null;
  cwd: string;
  shell: string;
  createdAt: string;
  updatedAt: string;
  status: "running" | "exited";
  clients: Set<WebSocket>;
  ptyProcess: pty.IPty;
};

const terminalSessions = new Map<string, TerminalSession>();
const activeHeavyTaskRuns = new Map<
  string,
  { sessionId: string; departmentId: string; startedAt: number; ttlSec: number }
>();
const pendingCliApprovals = new Map<
  string,
  {
    id: string;
    createdAt: string;
    status: "pending" | "approved" | "rejected";
    actorRole: CliActorRole;
    approverRole: "department_head" | "ceo" | "user";
    requestedAccess: CliAccessMode;
    sessionId: string;
    command: string;
    taskName: string;
    taskWeight: TaskWeight;
    reason: string;
    decidedAt?: string;
    decisionNote?: string;
    approvedCommand?: string;
  }
>();

function sanitizeSessionId(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTaskWeight(raw: string): TaskWeight {
  const val = String(raw || "medium").toLowerCase();
  if (val === "light" || val === "medium" || val === "heavy") return val;
  return "medium";
}

function normalizeActorRole(raw: string): CliActorRole {
  const val = String(raw || "subagent").toLowerCase();
  if (val === "subagent" || val === "head" || val === "ceo" || val === "user") return val;
  return "subagent";
}

function normalizeAccessMode(raw: string): CliAccessMode {
  const val = String(raw || "default").toLowerCase();
  if (val === "default" || val === "full") return val;
  return "default";
}

function pruneActiveHeavyTasks(nowMs: number): void {
  for (const [key, entry] of activeHeavyTaskRuns.entries()) {
    if (nowMs - entry.startedAt > entry.ttlSec * 1000) {
      activeHeavyTaskRuns.delete(key);
    }
  }
}

function countActiveHeavyTasksForDepartment(departmentId?: string | null): number {
  const now = Date.now();
  pruneActiveHeavyTasks(now);
  if (!departmentId) return activeHeavyTaskRuns.size;
  let count = 0;
  for (const entry of activeHeavyTaskRuns.values()) {
    if (entry.departmentId === departmentId) count += 1;
  }
  return count;
}

function readAgencyConfigForTerminal(): any | null {
  if (!existsSync(AGENCY_CONFIG_PATH)) return null;
  try {
    return JSON.parse(readFileSync(AGENCY_CONFIG_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function defaultTerminalSessionSpecs(): Array<{
  id: string;
  scope: TerminalScope;
  name: string;
  departmentId: string | null;
  cwd: string;
}> {
  const cfg = readAgencyConfigForTerminal();
  const departments = Object.keys((cfg?.departments || {}) as Record<string, any>);

  const specs: Array<{
    id: string;
    scope: TerminalScope;
    name: string;
    departmentId: string | null;
    cwd: string;
  }> = [
    { id: "main", scope: "ceo", name: "YaSwarm CEO (Main)", departmentId: "ceo", cwd: AGENCY_ROOT },
  ];

  for (const dep of departments) {
    const depId = sanitizeSessionId(dep);
    if (!depId) continue;
    specs.push({
      id: `dept-${depId}`,
      scope: "department",
      name: dep,
      departmentId: dep,
      cwd: path.join(AGENCY_ROOT, "agents", "departments", dep),
    });
  }
  return specs;
}

function createTerminalSession(spec: {
  id: string;
  scope: TerminalScope;
  name: string;
  departmentId: string | null;
  cwd: string;
}): TerminalSession {
  const shell = process.env.SHELL || "/bin/bash";
  const agencyEnv = parseEnvEntries(AGENCY_ENV_PATH);
  const rootEnv = parseEnvEntries(ROOT_ENV_PATH);
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-256color",
    cols: 100,
    rows: 28,
    cwd: existsSync(spec.cwd) ? spec.cwd : AGENCY_ROOT,
    env: {
      ...process.env,
      ...rootEnv,
      ...agencyEnv,
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
      YASWARM_TERMINAL_SCOPE: spec.scope,
      ...(spec.departmentId ? { YASWARM_DEPARTMENT_ID: spec.departmentId } : {}),
    } as Record<string, string>,
  });

  const session: TerminalSession = {
    id: spec.id,
    scope: spec.scope,
    name: spec.name,
    departmentId: spec.departmentId,
    cwd: existsSync(spec.cwd) ? spec.cwd : AGENCY_ROOT,
    shell,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "running",
    clients: new Set<WebSocket>(),
    ptyProcess,
  };

  ptyProcess.onData((data: string) => {
    session.updatedAt = new Date().toISOString();
    for (const client of session.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  });

  ptyProcess.onExit(() => {
    session.status = "exited";
    session.updatedAt = new Date().toISOString();
    for (const client of session.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send("\r\n[session exited]\r\n");
      }
    }
  });

  terminalSessions.set(session.id, session);
  return session;
}

function ensureTerminalSession(spec: {
  id: string;
  scope: TerminalScope;
  name: string;
  departmentId: string | null;
  cwd: string;
}): TerminalSession {
  const existing = terminalSessions.get(spec.id);
  if (existing && existing.status === "running") return existing;
  if (existing) {
    terminalSessions.delete(spec.id);
  }
  return createTerminalSession(spec);
}

function ensureDefaultTerminalSessions(): void {
  for (const spec of defaultTerminalSessionSpecs()) {
    ensureTerminalSession(spec);
  }
}

function listTerminalSessionsMeta() {
  ensureDefaultTerminalSessions();
  return Array.from(terminalSessions.values())
    .sort((a, b) => {
      if (a.id === "main") return -1;
      if (b.id === "main") return 1;
      return a.name.localeCompare(b.name);
    })
    .map((s) => ({
      id: s.id,
      scope: s.scope,
      name: s.name,
      departmentId: s.departmentId,
      cwd: s.cwd,
      shell: s.shell,
      status: s.status,
      watcherCount: s.clients.size,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
}

server.on("upgrade", (request, socket, head) => {
  const { pathname } = new URL(request.url ?? "/", `http://${request.headers.host}`);
  if (pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else if (pathname === "/ws/terminal" || pathname.startsWith("/ws/terminal/")) {
    wssTerminal.handleUpgrade(request, socket, head, (ws) => {
      wssTerminal.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  const clientIp = req.socket.remoteAddress ?? "unknown";
  console.log(`[WS] Client connected from ${clientIp}`);

  ws.on("message", (raw: Buffer | string) => {
    try {
      const msg = JSON.parse(raw.toString());
      // Echo-back for now; real handlers go in ws/ directory
      ws.send(JSON.stringify({ type: "ack", ref: msg.type }));
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
    }
  });

  ws.on("close", () => {
    console.log(`[WS] Client disconnected (${clientIp})`);
  });

  ws.on("error", (err: Error) => {
    console.error(`[WS] Error: ${err.message}`);
  });
});

// ---------------------------------------------------------------------------
// Terminal WebSocket — PTY sessions
// ---------------------------------------------------------------------------
wssTerminal.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  const clientIp = req.socket.remoteAddress ?? "unknown";
  const { pathname } = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const rawSessionId = pathname.startsWith("/ws/terminal/")
    ? pathname.replace("/ws/terminal/", "")
    : "main";
  const sessionId = sanitizeSessionId(rawSessionId) || "main";

  ensureDefaultTerminalSessions();
  const session = terminalSessions.get(sessionId);
  if (!session) {
    ws.close(1008, "Unknown terminal session");
    return;
  }

  session.clients.add(ws);
  session.updatedAt = new Date().toISOString();
  console.log(`[Terminal] Client connected from ${clientIp} to session=${session.id}`);

  // WebSocket → PTY (send keystrokes to shell)
  ws.on("message", (raw: Buffer | string) => {
    const data = raw.toString();

    // Check for JSON control messages (resize)
    try {
      const msg = JSON.parse(data);
      if (msg.type === "resize" && msg.cols && msg.rows) {
        session.ptyProcess.resize(Number(msg.cols), Number(msg.rows));
        return;
      }
    } catch {
      // Not JSON — treat as raw terminal input
    }

    // Forward raw keystrokes to PTY
    session.ptyProcess.write(data);
    session.updatedAt = new Date().toISOString();
  });

  ws.on("close", () => {
    session.clients.delete(ws);
    session.updatedAt = new Date().toISOString();
    console.log(`[Terminal] Client disconnected (${clientIp}) from session=${session.id}`);
  });

  ws.on("error", (err: Error) => {
    console.error(`[Terminal] WS Error: ${err.message}`);
    session.clients.delete(ws);
  });
});

app.get("/api/terminal/sessions", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    sessions: listTerminalSessionsMeta(),
  });
});

app.post("/api/terminal/sessions", (req: Request, res: Response) => {
  const scope = String(req.body?.scope || "main").toLowerCase() as TerminalScope;
  const departmentId = sanitizeSessionId(String(req.body?.departmentId || ""));
  const requestedSessionId = sanitizeSessionId(String(req.body?.sessionId || ""));
  const requestedName = String(req.body?.name || "").trim();
  const requestedCwdRaw = String(req.body?.cwd || "").trim();
  if (!["main", "ceo", "department", "user"].includes(scope)) {
    res.status(400).json({ error: "Invalid scope" });
    return;
  }

  let spec: { id: string; scope: TerminalScope; name: string; departmentId: string | null; cwd: string };
  if (scope === "department") {
    if (!departmentId) {
      res.status(400).json({ error: "departmentId is required for department scope" });
      return;
    }
    spec = {
      id: `dept-${departmentId}`,
      scope: "department",
      name: departmentId,
      departmentId,
      cwd: path.join(AGENCY_ROOT, "agents", "departments", departmentId),
    };
  } else {
    // main and ceo resolve to one canonical CEO terminal session
    spec = {
      id: "main",
      scope: "ceo",
      name: "YaSwarm CEO (Main)",
      departmentId: "ceo",
      cwd: AGENCY_ROOT,
    };
    if (scope === "user") {
      const userId = requestedSessionId || `user-${Date.now()}`;
      const cwd = requestedCwdRaw
        ? (path.isAbsolute(requestedCwdRaw) ? requestedCwdRaw : path.join(AGENCY_ROOT, requestedCwdRaw))
        : AGENCY_ROOT;
      spec = {
        id: userId,
        scope: "user",
        name: requestedName || "User Terminal",
        departmentId: null,
        cwd,
      };
    }
  }

  const session = ensureTerminalSession(spec);
  res.json({
    ok: true,
    session: {
      id: session.id,
      scope: session.scope,
      name: session.name,
      departmentId: session.departmentId,
      cwd: session.cwd,
      status: session.status,
    },
  });
});

app.get("/api/cli-permissions", (_req: Request, res: Response) => {
  res.json({ ok: true, policy: readCliPermissionPolicy() });
});

app.put("/api/cli-permissions", (req: Request, res: Response) => {
  const current = readCliPermissionPolicy();
  const body = (req.body || {}) as any;
  const next = { ...current, ...body };
  writeCliPermissionPolicy(next);
  res.json({ ok: true, policy: next });
});

app.get("/api/approvals", (_req: Request, res: Response) => {
  const approvals = Array.from(pendingCliApprovals.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 200);
  res.json({ ok: true, approvals });
});

app.post("/api/approvals/:id/approve", (req: Request, res: Response) => {
  const id = String(req.params.id || "");
  const found = pendingCliApprovals.get(id);
  if (!found) {
    res.status(404).json({ error: "Approval request not found" });
    return;
  }
  found.status = "approved";
  found.decidedAt = new Date().toISOString();
  found.decisionNote = String(req.body?.note || "");
  const approvedCommand = String(req.body?.approvedCommand || "").trim();
  found.approvedCommand = approvedCommand || undefined;
  pendingCliApprovals.set(id, found);
  res.json({ ok: true, approval: found });
});

app.post("/api/approvals/:id/reject", (req: Request, res: Response) => {
  const id = String(req.params.id || "");
  const found = pendingCliApprovals.get(id);
  if (!found) {
    res.status(404).json({ error: "Approval request not found" });
    return;
  }
  found.status = "rejected";
  found.decidedAt = new Date().toISOString();
  found.decisionNote = String(req.body?.note || "");
  pendingCliApprovals.set(id, found);
  res.json({ ok: true, approval: found });
});

app.post("/api/terminal/sessions/:sessionId/exec", (req: Request, res: Response) => {
  const sessionId = sanitizeSessionId(String(req.params.sessionId || ""));
  const command = String(req.body?.command || "");
  const taskName = sanitizeSessionId(String(req.body?.taskName || "")) || "task";
  const taskWeight = normalizeTaskWeight(String(req.body?.taskWeight || "medium"));
  const actorRole = normalizeActorRole(String(req.body?.actorRole || "subagent"));
  const requestedAccess = normalizeAccessMode(String(req.body?.requestedAccess || "default"));
  const approvalId = String(req.body?.approvalId || "").trim();
  const force = Boolean(req.body?.force);
  if (!sessionId || !command.trim()) {
    res.status(400).json({ error: "sessionId and command are required" });
    return;
  }
  ensureDefaultTerminalSessions();
  const session = terminalSessions.get(sessionId);
  if (!session || session.status !== "running") {
    res.status(404).json({ error: "Session not found or not running" });
    return;
  }

  const permissionPolicy = readCliPermissionPolicy();
  const permissionDecision = evaluatePermission({
    actorRole,
    requestedAccess,
    policy: permissionPolicy,
  });

  let approvedCommandOverride: string | null = null;
  if (!force && !permissionDecision.allow) {
    if (permissionDecision.approvalRequired && permissionDecision.approverRole !== "none") {
      if (approvalId) {
        const existing = pendingCliApprovals.get(approvalId);
        if (!existing || existing.status !== "approved" || existing.sessionId !== sessionId) {
          res.status(403).json({
            error: "Approval ID is invalid or not approved",
            approvalId,
          });
          return;
        }
        approvedCommandOverride = existing.approvedCommand || null;
      } else {
        const requestId = `apr-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        pendingCliApprovals.set(requestId, {
          id: requestId,
          createdAt: new Date().toISOString(),
          status: "pending",
          actorRole,
          approverRole: permissionDecision.approverRole,
          requestedAccess,
          sessionId,
          command,
          taskName,
          taskWeight,
          reason: permissionDecision.reason,
        });
        res.status(403).json({
          error: "Permission escalation requires approval",
          approvalRequired: true,
          approvalId: requestId,
          approverRole: permissionDecision.approverRole,
          reason: permissionDecision.reason,
        });
        return;
      }
    } else {
      res.status(403).json({
        error: "Permission denied by policy",
        reason: permissionDecision.reason,
      });
      return;
    }
  }

  // Resource-aware gating for department execution: delay heavy load when system is hot.
  const governor = readGovernorConfig();
  const tremcp = detectTremcpStatus();
  const activeHeavy = countActiveHeavyTasksForDepartment(session.departmentId);
  const health = collectMachineSnapshot();
  const evaluation = evaluateGovernorState(health, governor, activeHeavy);
  const advice = adviseTaskRun({
    state: evaluation.state,
    taskWeight,
    config: governor,
    tremcp,
  });
  const shouldGovern =
    governor.enabled &&
    governor.autoDelayEnabled &&
    (session.scope === "department" || session.departmentId !== null);
  if (shouldGovern && !force && !advice.allow) {
    res.status(429).json({
      error: "Resource governor delayed task",
      sessionId,
      departmentId: session.departmentId,
      taskWeight,
      state: evaluation.state,
      reasons: evaluation.reasons,
      delaySec: advice.delaySec,
      advice,
      tremcp,
    });
    return;
  }

  const taskSessionId = `${sessionId}-${taskName}-${Date.now()}`;
  const effectiveCommand = String(approvedCommandOverride || command).trim();
  const cliPattern = /^\s*(codex|claude|gemini|pi|opencode|codebuff)\b/i;
  const shouldAutoCloseCli = cliPattern.test(effectiveCommand);
  const wrapped = [
    `export YASWARM_TASK_SESSION="${taskSessionId}"`,
    `echo "[yaswarm-task-start] ${taskSessionId}"`,
    `${effectiveCommand}`,
    `status=$?`,
    `echo "[yaswarm-task-end] ${taskSessionId} status=$status"`,
    shouldAutoCloseCli ? "exit $status" : "",
  ]
    .filter(Boolean)
    .join("; ");

  session.ptyProcess.write(`${wrapped}\r`);
  session.updatedAt = new Date().toISOString();
  if (taskWeight === "heavy" && session.departmentId) {
    activeHeavyTaskRuns.set(taskSessionId, {
      sessionId,
      departmentId: session.departmentId,
      startedAt: Date.now(),
      ttlSec: governor.scheduling.taskTtlSec,
    });
  }
  res.json({
    ok: true,
    sessionId,
    taskSessionId,
    autoClosedCli: shouldAutoCloseCli,
    taskWeight,
    governor: {
      state: evaluation.state,
      reasons: evaluation.reasons,
      activeHeavy,
      allow: advice.allow,
      tremcpPresent: tremcp.presentInCatalog,
    },
    permissions: {
      actorRole,
      requestedAccess,
      decision: permissionDecision,
    },
    command: effectiveCommand,
  });
});

/**
 * Broadcast a message to every connected WebSocket client.
 */
export function broadcast(data: Record<string, unknown>): void {
  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// ---------------------------------------------------------------------------
// Exports for use in route / service modules
// ---------------------------------------------------------------------------
export { AGENCY_ROOT, AUTH_TOKEN };

type BugTicket = {
  ticket_id: string;
  type: string;
  department: string;
  summary: string;
  details: string;
  status: string;
  assigned: string;
  ts: string;
  origin_message_id: number | null;
  origin_thread_id: number | null;
  severity?: "high" | "critical";
  resolution: string | null;
  resolved_at: string | null;
};

let activeChromaTicketId: string | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function readTicketJson(filePath: string): BugTicket | null {
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    if (!raw || typeof raw !== "object") return null;
    return raw as BugTicket;
  } catch {
    return null;
  }
}

function ticketSeverity(ticket: BugTicket | null): "high" | "critical" {
  if (!ticket) return "high";
  if (ticket.severity === "critical") return "critical";
  const details = String(ticket.details || "").toLowerCase();
  if (details.includes("severity: critical")) return "critical";
  return "high";
}

function parseIsoToMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return null;
  return ts;
}

function recentChromaOutageCount(windowMs: number): number {
  if (!existsSync(TICKETS_DIR)) return 0;
  const now = Date.now();
  let count = 0;
  for (const file of readdirSync(TICKETS_DIR)) {
    if (!/^BUG-\d{4}\.json$/i.test(file)) continue;
    const ticket = readTicketJson(path.join(TICKETS_DIR, file));
    if (!ticket) continue;
    const chromaLike =
      String(ticket.summary || "").toLowerCase().includes("chromadb") ||
      String(ticket.details || "").toLowerCase().includes("chromadb");
    if (!chromaLike) continue;
    const tsMs = parseIsoToMs(ticket.ts) ?? parseIsoToMs(ticket.resolved_at);
    if (!tsMs) continue;
    if (now - tsMs <= windowMs) {
      count += 1;
    }
  }
  return count;
}

function findOpenChromaTicketId(): string | null {
  if (!existsSync(TICKETS_DIR)) return null;
  for (const file of readdirSync(TICKETS_DIR)) {
    if (!/^BUG-\d{4}\.json$/i.test(file)) continue;
    const ticket = readTicketJson(path.join(TICKETS_DIR, file));
    if (!ticket) continue;
    const status = String(ticket.status || "").toLowerCase();
    const openLike = status === "open" || status === "new" || status === "in_progress";
    const chromaLike =
      String(ticket.summary || "").toLowerCase().includes("chromadb") ||
      String(ticket.details || "").toLowerCase().includes("chromadb");
    if (openLike && chromaLike) {
      return ticket.ticket_id;
    }
  }
  return null;
}

function nextTicketId(): string {
  let counter = 0;
  if (existsSync(TICKET_COUNTER_PATH)) {
    const raw = readFileSync(TICKET_COUNTER_PATH, "utf-8").trim();
    counter = Number(raw) || 0;
  }
  counter += 1;
  writeFileSync(TICKET_COUNTER_PATH, `${counter}\n`, "utf-8");
  return `BUG-${String(counter).padStart(4, "0")}`;
}

function writeBugTicket(ticket: BugTicket): void {
  const filePath = path.join(TICKETS_DIR, `${ticket.ticket_id}.json`);
  writeFileSync(filePath, `${JSON.stringify(ticket, null, 2)}\n`, "utf-8");
}

type ChromaTicketOpenResult = {
  ticketId: string | null;
  created: boolean;
  severity: "high" | "critical";
};

function openChromaDownTicket(detail: string): ChromaTicketOpenResult {
  try {
    const existing = findOpenChromaTicketId();
    if (existing) {
      const ticket = readTicketJson(path.join(TICKETS_DIR, `${existing}.json`));
      return { ticketId: existing, created: false, severity: ticketSeverity(ticket) };
    }
    const ticketId = nextTicketId();
    const priorOutages = recentChromaOutageCount(VECTOR_HEALTH_MONITOR_CRITICAL_WINDOW_MS);
    const severity: "high" | "critical" =
      priorOutages + 1 >= VECTOR_HEALTH_MONITOR_CRITICAL_THRESHOLD ? "critical" : "high";
    const ticket: BugTicket = {
      ticket_id: ticketId,
      type: "bug",
      department: "backend-platform",
      summary: "ChromaDB backend unavailable for vector semantic search",
      details:
        `Vector health monitor detected ChromaDB outage.\n` +
        `- endpoint: ${CHROMA_URL}/api/v2/heartbeat\n` +
        `- detected_at: ${nowIso()}\n` +
        `- severity: ${severity}\n` +
        `- last_error: ${detail}`,
      status: "open",
      assigned: "backend-platform",
      ts: nowIso(),
      origin_message_id: null,
      origin_thread_id: null,
      severity,
      resolution: null,
      resolved_at: null,
    };
    writeBugTicket(ticket);
    return { ticketId, created: true, severity };
  } catch (err) {
    console.error("[VectorMonitor] Failed to open chroma ticket:", err);
    return { ticketId: null, created: false, severity: "high" };
  }
}

function resolveChromaTicket(
  ticketId: string,
  detail: string,
): { resolved: boolean; severity: "high" | "critical" } {
  const filePath = path.join(TICKETS_DIR, `${ticketId}.json`);
  const ticket = readTicketJson(filePath);
  const severity = ticketSeverity(ticket);
  if (!ticket) return { resolved: false, severity };
  const status = String(ticket.status || "").toLowerCase();
  if (status === "resolved") return { resolved: false, severity };
  ticket.status = "resolved";
  ticket.resolution =
    `Auto-resolved by vector health monitor. ChromaDB recovered and heartbeat is healthy. ` +
    `Recovery detail: ${detail}`;
  ticket.resolved_at = nowIso();
  writeBugTicket(ticket);
  return { resolved: true, severity };
}

async function sendTelegramAlertToThread(
  text: string,
  threadId: number,
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  if (!TELEGRAM_ALERT_BOT_TOKEN) {
    const error = "missing Telegram bot token";
    console.warn(`[VectorMonitor] Alert skipped: ${error}`);
    return { ok: false, error };
  }
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_ALERT_BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: TELEGRAM_ALERT_CHAT_ID,
    message_thread_id: threadId,
    text,
  };
  const response = await fetch(telegramUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok) {
    return { ok: false, error: data?.description || `HTTP ${response.status}` };
  }
  console.log(
    `[VectorMonitor] Alert sent to Telegram thread=${threadId} message_id=${data?.result?.message_id ?? "?"}`,
  );
  return { ok: true, messageId: Number(data?.result?.message_id) || undefined };
}

async function sendVectorMonitorAlert(
  text: string,
  _severity: "high" | "critical",
): Promise<void> {
  if (!VECTOR_HEALTH_MONITOR_ALERTS_ENABLED) return;
  const result = await sendTelegramAlertToThread(text, TELEGRAM_ALERT_THREAD_ID);
  if (!result.ok) {
    console.warn(
      `[VectorMonitor] Alert send failed thread=${TELEGRAM_ALERT_THREAD_ID}: ${result.error || "unknown"}`,
    );
  }
}

async function checkChromaHealth(): Promise<{ ok: boolean; detail: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${CHROMA_URL}/api/v2/heartbeat`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      return { ok: false, detail: `HTTP ${response.status}` };
    }
    return { ok: true, detail: "heartbeat ok" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: msg };
  }
}

function startVectorHealthMonitor(): void {
  if (!VECTOR_HEALTH_MONITOR_ENABLED) {
    console.log("[VectorMonitor] Disabled by VECTOR_HEALTH_MONITOR_ENABLED=0");
    return;
  }
  if (!existsSync(TICKETS_DIR)) {
    console.warn("[VectorMonitor] Tickets directory missing, monitor skipped:", TICKETS_DIR);
    return;
  }

  const runCheck = async () => {
    const health = await checkChromaHealth();
    if (!health.ok) {
      const { ticketId, created, severity } = openChromaDownTicket(health.detail);
      if (ticketId) {
        activeChromaTicketId = ticketId;
      }
      if (ticketId && created) {
        await sendVectorMonitorAlert(
          [
            "[VectorMonitor] ChromaDB outage detected",
            `ticket: ${ticketId}`,
            `endpoint: ${CHROMA_URL}/api/v2/heartbeat`,
            `severity: ${severity}`,
            `error: ${health.detail}`,
            "status: OPEN",
          ].join("\n"),
          severity,
        );
      }
      console.warn(`[VectorMonitor] Chroma down: ${health.detail}`);
      return;
    }

    if (!activeChromaTicketId) {
      activeChromaTicketId = findOpenChromaTicketId();
    }
    if (activeChromaTicketId) {
      const result = resolveChromaTicket(activeChromaTicketId, health.detail);
      if (result.resolved) {
        await sendVectorMonitorAlert(
          [
            "[VectorMonitor] ChromaDB recovered",
            `ticket: ${activeChromaTicketId}`,
            `endpoint: ${CHROMA_URL}/api/v2/heartbeat`,
            `severity: ${result.severity}`,
            `detail: ${health.detail}`,
            "status: RESOLVED",
          ].join("\n"),
          result.severity,
        );
        console.log(`[VectorMonitor] Chroma recovered; resolved ${activeChromaTicketId}`);
      }
      activeChromaTicketId = null;
    }
  };

  void runCheck();
  setInterval(() => {
    void runCheck();
  }, VECTOR_HEALTH_MONITOR_INTERVAL_MS);
  console.log(
    `[VectorMonitor] Started. intervalMs=${VECTOR_HEALTH_MONITOR_INTERVAL_MS} chroma=${CHROMA_URL}`,
  );
}

// ---------------------------------------------------------------------------
// Static file serving (production — serves Vite build output)
// ---------------------------------------------------------------------------
const distPath = path.resolve(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("/{*path}", (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[YaSwarm API] Server running on port ${PORT}`);
  console.log(`[YaSwarm API] Agency root: ${AGENCY_ROOT}`);
  startVectorHealthMonitor();
});
