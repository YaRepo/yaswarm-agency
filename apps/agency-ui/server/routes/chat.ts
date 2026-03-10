import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";

const router = Router();

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";
const DATA_DIR =
  process.env.YASWARM_DASHBOARD_DATA_DIR ||
  "/data/yaswarm-dashboard-data";
const SESSIONS_FILE = path.join(DATA_DIR, "chat-sessions.json");
const MAX_SESSIONS = 100;
const AGENCY_CONFIG_PATH = path.join(AGENCY_ROOT, "config", "agency-config.json");
const AGENT_REGISTRY_PATH = path.join(AGENCY_ROOT, "config", "agent-registry.json");
const WORKSPACE_ROOT = path.resolve(AGENCY_ROOT, "..");
const YASWARM_ROOT =
  process.env.YASWARM_ROOT || path.resolve(WORKSPACE_ROOT, "..", "..", "..");

function resolveChatScriptPath(): { script: string; tried: string[] } {
  const candidates = [
    process.env.YASWARM_CHAT_SCRIPT,
    path.join(YASWARM_ROOT, "scripts", "chat-cli.py"),
    "/root/yaswarm-swarm/scripts/chat-cli.py",
    path.join(process.cwd(), "scripts", "chat-cli.py"),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return { script: candidate, tried: candidates };
  }
  return { script: candidates[0] || "scripts/chat-cli.py", tried: candidates };
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  department?: string;
  model?: string;
}

interface ChatSession {
  id: string;
  department: string;
  title: string;
  messages: ChatMsg[];
  createdAt: string;
  updatedAt: string;
}

function safeReadJson(filePath: string): any {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadSessions(): ChatSession[] {
  ensureDataDir();
  if (!existsSync(SESSIONS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(SESSIONS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]): void {
  ensureDataDir();
  const trimmed = sessions
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_SESSIONS);
  writeFileSync(SESSIONS_FILE, JSON.stringify(trimmed, null, 2));
}

function getSession(id: string): ChatSession | undefined {
  return loadSessions().find((s) => s.id === id);
}

function upsertSession(session: ChatSession): void {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  saveSessions(sessions);
}

function deleteSession(id: string): boolean {
  const sessions = loadSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  if (filtered.length === sessions.length) return false;
  saveSessions(filtered);
  return true;
}

function generateTitle(message: string, department: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  const prefix = department !== "CEO" ? `[${department}] ` : "";
  if (clean.length <= 50) return prefix + clean;
  return `${prefix}${clean.slice(0, 47)}...`;
}

function loadDepartmentList(): string[] {
  const cfg = safeReadJson(AGENCY_CONFIG_PATH);
  const departments = Object.keys(cfg?.departments || {});
  return ["main", ...departments];
}

function buildLocalAssistantReply(message: string, department: string): { content: string; model: string } {
  const resolved = resolveChatScriptPath();
  const text =
    department && !["CEO", "main"].includes(department)
      ? `@${department} ${message}`.trim()
      : message.trim();

  if (!existsSync(resolved.script)) {
    return {
      content: `Chat backend script is missing. Expected: scripts/chat-cli.py (resolved candidates: ${resolved.tried.join(", ")})`,
      model: "yaswarm-local-error",
    };
  }

  const proc = spawnSync("python3", [resolved.script, "--message", text], {
    env: {
      ...process.env,
      YASWARM_WORKSPACE: WORKSPACE_ROOT,
    },
    encoding: "utf-8",
  });

  if (proc.status !== 0) {
    const detail = (proc.stderr || proc.stdout || "Unknown chat backend error").trim();
    return {
      content: `Chat backend error: ${detail}`,
      model: "yaswarm-local-error",
    };
  }

  return {
    content: (proc.stdout || "No response").trim(),
    model: "yaswarm-local",
  };
}

router.get("/chat/sessions", (_req: Request, res: Response): void => {
  try {
    const sessions = loadSessions();
    const summaries = sessions
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((s) => ({
        id: s.id,
        department: s.department,
        title: s.title,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        lastMessage:
          s.messages.length > 0 ? s.messages[s.messages.length - 1].content.slice(0, 100) : null,
      }));
    res.json({ sessions: summaries });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

router.post("/chat/sessions", (req: Request, res: Response): void => {
  try {
    const { department } = req.body as { department?: string };
    const session: ChatSession = {
      id: randomUUID(),
      department: department || "CEO",
      title: `New ${department || "CEO"} Chat`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    upsertSession(session);
    res.json(session);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

router.get("/chat/sessions/:id", (req: Request, res: Response): void => {
  try {
    const sessionId = String(req.params.id ?? "");
    const session = getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

router.delete("/chat/sessions/:id", (req: Request, res: Response): void => {
  try {
    const sessionId = String(req.params.id ?? "");
    const deleted = deleteSession(sessionId);
    if (!deleted) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

router.post("/chat/send", async (req: Request, res: Response): Promise<void> => {
  const { message, department, sessionId } = req.body as {
    message?: string;
    department?: string;
    sessionId?: string;
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const dept = department || "CEO";

  let session: ChatSession;
  if (sessionId) {
    const existing = getSession(sessionId);
    if (existing) {
      session = existing;
    } else {
      session = {
        id: sessionId,
        department: dept,
        title: generateTitle(message, dept),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  } else {
    session = {
      id: randomUUID(),
      department: dept,
      title: generateTitle(message, dept),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const userMsg: ChatMsg = {
    id: `user-${Date.now()}-${randomUUID().slice(0, 8)}`,
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
    department: dept,
  };
  session.messages.push(userMsg);

  if (session.messages.filter((m) => m.role === "user").length === 1) {
    session.title = generateTitle(message, dept);
  }

  session.updatedAt = new Date().toISOString();
  upsertSession(session);

  try {
    const chat = buildLocalAssistantReply(message, dept);
    const responseText = chat.content;

    const asstMsg: ChatMsg = {
      id: `asst-${Date.now()}-${randomUUID().slice(0, 8)}`,
      role: "assistant",
      content: responseText,
      timestamp: new Date().toISOString(),
      department: dept,
      model: chat.model,
    };

    session.messages.push(asstMsg);
    session.updatedAt = new Date().toISOString();
    upsertSession(session);

    res.json({
      content: responseText,
      department: dept,
      runId: `local-${randomUUID()}`,
      model: chat.model,
      sessionId: session.id,
      mode: "local",
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    session.messages.push({
      id: `sys-${Date.now()}`,
      role: "system",
      content: `Error: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
    session.updatedAt = new Date().toISOString();
    upsertSession(session);

    res.status(500).json({
      error: `Local chat error: ${errMsg}`,
      sessionId: session.id,
    });
  }
});

router.get("/chat/history", (_req: Request, res: Response) => {
  const sessions = loadSessions();
  if (sessions.length === 0) {
    res.json({ messages: [] });
    return;
  }
  const latest = sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  res.json({ messages: latest.messages, sessionId: latest.id });
});

router.get("/chat/agents", (_req: Request, res: Response): void => {
  try {
    const registry = safeReadJson(AGENT_REGISTRY_PATH);
    const registryAgents = Object.values(registry?.agents || {}).map((agent: any) => ({
      id: agent.id,
      status: agent.status || "unknown",
      workspace: agent.workspace,
      managedBy: agent.managed_by || "yaswarm",
    }));

    if (registryAgents.length > 0) {
      res.json({ mode: "local", agents: registryAgents });
      return;
    }

    const departments = loadDepartmentList();
    const fallbackAgents = departments.map((id) => ({
      id,
      status: "ready",
      managedBy: "yaswarm",
    }));
    res.json({ mode: "local", agents: fallbackAgents });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: errMsg });
  }
});

export default router;
