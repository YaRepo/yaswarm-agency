import { Router, Request, Response } from "express";
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, renameSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";

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
const AGENCY_CONFIG_PATH = path.join(AGENCY_ROOT, "config", "agency-config.json");
const AGENCY_ENV_PATH = path.join(AGENCY_ROOT, ".env");
const ROOT_ENV_PATH = "/root/agency.env";
const TICKET_DEBUGGER_CONFIG_PATH = path.join(AGENCY_ROOT, "config", "ticket-debugger.json");

const router = Router();

type TicketDebuggerConfig = {
  enabled: boolean;
  provider: "glm";
  model: string;
  executionBackend: "bash" | "tremcp-ssh" | "auto";
  baseUrl: string;
  apiKeyEnv: string;
  autoRun: boolean;
  allowRootActions: boolean;
  allowAnyPath: boolean;
  useTremcpSsh: boolean;
  maxCommands: number;
  updatedAt: string;
};

type DebuggerAction = {
  type: "shell" | "note";
  command?: string;
  note?: string;
  reason?: string;
};

type DebuggerPlan = {
  summary: string;
  diagnosis: string;
  resolved: boolean;
  resolution: string;
  actions: DebuggerAction[];
};

type ShellResult = {
  ok: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
};

const DEFAULT_TICKET_DEBUGGER_CONFIG: TicketDebuggerConfig = {
  enabled: true,
  provider: "glm",
  model: "GLM-5",
  executionBackend: "bash",
  baseUrl: "https://api.z.ai/api/coding/paas/v4",
  apiKeyEnv: "ZAI_API_KEY",
  autoRun: true,
  allowRootActions: false,
  allowAnyPath: true,
  useTremcpSsh: true,
  maxCommands: 3,
  updatedAt: new Date().toISOString(),
};

function shellQuote(value: string): string {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function runShell(command: string, timeoutMs = 20_000): ShellResult {
  const result = spawnSync("bash", ["-lc", command], {
    encoding: "utf-8",
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024 * 5,
    env: process.env,
  });
  return {
    ok: result.status === 0,
    code: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

function readEnabledMcpServers(): string[] {
  const candidates = [
    path.join("/root/yaswarm-swarm", "mcp", "mcp-config.json"),
    path.join(AGENCY_ROOT, "config", "mcp-config.json"),
    path.join("/app", "mcp", "mcp-config.json"),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    try {
      const raw = JSON.parse(readFileSync(p, "utf-8"));
      const servers = raw?.servers && typeof raw.servers === "object" ? raw.servers : {};
      const out = Object.entries(servers)
        .filter(([, cfg]: any) => cfg && (cfg.enabled === undefined || Boolean(cfg.enabled)))
        .map(([name]) => String(name))
        .slice(0, 25);
      if (out.length > 0) return out;
    } catch {
      // ignore invalid mcp config
    }
  }
  return [];
}

function detectCriticalMcpStatus(): {
  enabledServers: string[];
  hasTremcpSsh: boolean;
  hasZaiMcpServer: boolean;
  hasZaiWebTools: boolean;
} {
  const enabledServers = readEnabledMcpServers();
  const set = new Set(enabledServers.map((s) => s.toLowerCase()));
  const hasZaiWebTools =
    set.has("web-search-prime") || set.has("web-reader") || set.has("zread");
  return {
    enabledServers,
    hasTremcpSsh: set.has("tremcp-ssh"),
    hasZaiMcpServer: set.has("zai-mcp-server"),
    hasZaiWebTools,
  };
}

function readDevSkillHints(): string[] {
  const out: string[] = [];
  const skillRoot = path.join(AGENCY_ROOT, "skills");
  const registryPath = path.join(AGENCY_ROOT, "skill-system", "registry", "skills-registry.json");
  const seen = new Set<string>();

  if (existsSync(registryPath)) {
    try {
      const reg = JSON.parse(readFileSync(registryPath, "utf-8"));
      const skills = Array.isArray(reg?.skills) ? reg.skills : [];
      for (const s of skills) {
        const id = String(s?.skill_id || "").trim();
        const typeFolder = String(s?.type_folder || "").toLowerCase();
        const bag = `${id} ${typeFolder}`.toLowerCase();
        if (!id) continue;
        if (!/\b(dev|code|coding|debug|fix|backend|frontend|infra|sre|qa|test|mcp)\b/.test(bag)) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(id);
        if (out.length >= 20) break;
      }
    } catch {
      // ignore registry parse errors
    }
  }

  if (out.length < 20 && existsSync(skillRoot)) {
    try {
      const dirs = readdirSync(skillRoot, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
      for (const d of dirs) {
        const id = String(d || "").trim();
        const bag = id.toLowerCase();
        if (!id) continue;
        if (!/\b(dev|code|coding|debug|fix|backend|frontend|infra|sre|qa|test|mcp)\b/.test(bag)) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(id);
        if (out.length >= 20) break;
      }
    } catch {
      // ignore local skill scan errors
    }
  }

  return out;
}

function parseEnv(filePath: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!existsSync(filePath)) return out;
  try {
    const raw = readFileSync(filePath, "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let value = m[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out.set(m[1], value.replace(/\\n/g, "\n"));
    }
  } catch {
    return out;
  }
  return out;
}

function readTicketDebuggerConfig(): TicketDebuggerConfig {
  if (!existsSync(TICKET_DEBUGGER_CONFIG_PATH)) {
    return { ...DEFAULT_TICKET_DEBUGGER_CONFIG };
  }
  try {
    const raw = JSON.parse(readFileSync(TICKET_DEBUGGER_CONFIG_PATH, "utf-8")) || {};
    return {
      ...DEFAULT_TICKET_DEBUGGER_CONFIG,
      ...raw,
      provider: "glm",
      executionBackend:
        raw?.executionBackend === "tremcp-ssh" || raw?.executionBackend === "auto"
          ? raw.executionBackend
          : "bash",
      updatedAt: String(raw?.updatedAt || DEFAULT_TICKET_DEBUGGER_CONFIG.updatedAt),
    };
  } catch {
    return { ...DEFAULT_TICKET_DEBUGGER_CONFIG };
  }
}

function writeTicketDebuggerConfig(config: Partial<TicketDebuggerConfig>): TicketDebuggerConfig {
  const merged: TicketDebuggerConfig = {
    ...readTicketDebuggerConfig(),
    ...config,
    provider: "glm",
    updatedAt: new Date().toISOString(),
  };
  mkdirSync(path.dirname(TICKET_DEBUGGER_CONFIG_PATH), { recursive: true });
  // Atomic replace avoids direct write permission issues on existing files.
  const tmpPath = `${TICKET_DEBUGGER_CONFIG_PATH}.${process.pid}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(merged, null, 2)}\n`, "utf-8");
  renameSync(tmpPath, TICKET_DEBUGGER_CONFIG_PATH);
  return merged;
}

function readTicketById(ticketId: string): any | null {
  const filePath = path.join(ticketsDir(), `${ticketId}.json`);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function writeTicketById(ticketId: string, payload: any): void {
  const dir = ticketsDir();
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${ticketId}.json`);
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function extractJsonObject(raw: string): any {
  const text = String(raw || "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]);
      } catch {
        return null;
      }
    }
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function detectTremcpConfigured(): boolean {
  const candidates = [
    path.join("/app", "mcp", "mcp-config.json"),
    path.join("/root/yaswarm-swarm", "mcp", "mcp-config.json"),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    try {
      const raw = JSON.parse(readFileSync(p, "utf-8"));
      if (raw?.servers?.["tremcp-ssh"]) return true;
    } catch {
      // ignore invalid file and continue
    }
  }
  return false;
}

function runViaTremcp(command: string, timeoutSec = 25): ShellResult {
  const tremcpRoot = "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/tremcp-ssh";
  const pyPath = `${tremcpRoot}:${String(process.env.PYTHONPATH || "")}`;
  const encodedCommand = JSON.stringify(String(command || ""));
  const encodedTimeout = Math.max(5, Math.min(120, Number(timeoutSec) || 25));
  const py = [
    "python3 - <<'PY'",
    "import json",
    "from tremcp_ssh.connection import connect, disconnect",
    "from tremcp_ssh.executor import ssh_exec",
    `cmd = ${encodedCommand}`,
    `timeout = ${encodedTimeout}`,
    "print(connect())",
    "out = ssh_exec(cmd, timeout=timeout)",
    "print(out)",
    "print(disconnect())",
    "PY",
  ].join("\n");

  const run = spawnSync("bash", ["-lc", py], {
    encoding: "utf-8",
    timeout: (encodedTimeout + 8) * 1000,
    maxBuffer: 1024 * 1024 * 5,
    env: {
      ...process.env,
      PYTHONPATH: pyPath,
    },
  });

  const stdout = String(run.stdout || "").trim();
  const stderr = String(run.stderr || "").trim();
  const merged = [stdout, stderr].filter(Boolean).join("\n");
  const m = merged.match(/exit_code=([-\w]+)/);
  let code: number | null = run.status;
  if (m) {
    if (/^-?\d+$/.test(m[1])) code = Number(m[1]);
    else code = m[1] === "0" ? 0 : 1;
  }
  const ok = code === 0;
  return {
    ok,
    code,
    stdout,
    stderr,
  };
}

function runDebuggerCommand(command: string, config: TicketDebuggerConfig): ShellResult & { engine: "local" | "tremcp-ssh" } {
  const mode = String(config.executionBackend || "bash");
  const tremcpEnabled =
    (mode === "tremcp-ssh" || mode === "auto") &&
    config.useTremcpSsh &&
    detectTremcpConfigured();
  if (mode === "bash") return { ...runShell(command, 25_000), engine: "local" };
  if (tremcpEnabled) {
    const tremcp = runViaTremcp(command, 25);
    if (tremcp.ok) return { ...tremcp, engine: "tremcp-ssh" };
    const shouldFallbackLocal =
      /not connected|host and user are required|error connecting|NoValidConnectionsError|authentication failed/i.test(
        `${tremcp.stdout}\n${tremcp.stderr}`
      );
    if (!shouldFallbackLocal) return { ...tremcp, engine: "tremcp-ssh" };
  }
  return { ...runShell(command, 25_000), engine: "local" };
}

function normalizeDebuggerCommand(command: string): { command: string; note?: string } {
  const raw = String(command || "").trim();
  if (!raw) return { command: raw };
  const bridgeLog = path.join(AGENCY_ROOT, "logs", "bridge.log");
  const badPaths = ["/var/log/yaswarm/app.log"];
  let out = raw;
  for (const bp of badPaths) {
    if (out.includes(bp)) out = out.split(bp).join(bridgeLog);
  }
  if (out !== raw) {
    return { command: out, note: `rewrote unavailable path to ${bridgeLog}` };
  }
  return { command: out };
}

function fallbackDiagnosticsCommands(): string[] {
  const cmds: string[] = [];
  const logsDir = path.join(AGENCY_ROOT, "logs");
  if (existsSync(logsDir)) cmds.push(`ls -la ${shellQuote(logsDir)}`);
  const files = [
    path.join(AGENCY_ROOT, "logs", "bridge.log"),
    path.join(AGENCY_ROOT, "logs", "dept-ceo.history.json"),
    path.join(AGENCY_ROOT, "logs", "telegram-bridge.events.jsonl"),
  ];
  for (const f of files) {
    if (existsSync(f)) cmds.push(`tail -n 120 ${shellQuote(f)}`);
  }
  return cmds.slice(0, 3);
}

async function createDebuggerPlan(ticket: any, config: TicketDebuggerConfig): Promise<DebuggerPlan> {
  const agencyEnv = parseEnv(AGENCY_ENV_PATH);
  const rootEnv = parseEnv(ROOT_ENV_PATH);
  const apiKey =
    String(process.env[config.apiKeyEnv] || "").trim() ||
    String(agencyEnv.get(config.apiKeyEnv) || "").trim() ||
    String(rootEnv.get(config.apiKeyEnv) || "").trim();

  if (!apiKey) {
    return {
      summary: "Debugger key missing",
      diagnosis: `Missing ${config.apiKeyEnv}.`,
      resolved: false,
      resolution: "",
      actions: [],
    };
  }

  const diagnosticCandidates = [
    path.join(AGENCY_ROOT, "logs", "bridge.log"),
    path.join(AGENCY_ROOT, "logs", "dept-ceo.history.json"),
    path.join(AGENCY_ROOT, "logs", "telegram-bridge.events.jsonl"),
    path.join(AGENCY_ROOT, "desk", "tickets"),
    path.join(AGENCY_ROOT, "scripts", "telegram_bridge.py"),
  ];
  const existingDiagnostics = diagnosticCandidates.filter((p) => existsSync(p));
  const mcp = detectCriticalMcpStatus();
  const devSkills = readDevSkillHints();

  const prompt = [
    "You are YaSwarm Ticket Debugger.",
    "Return strict JSON only with shape:",
    '{"summary":"...","diagnosis":"...","resolved":false,"resolution":"...","actions":[{"type":"shell","command":"...","reason":"..."},{"type":"note","note":"..."}]}',
    "Rules:",
    "- Focus only on fixing the described ticket issue.",
    "- Use at most 3 shell actions and keep them idempotent.",
    "- You can use available MCP servers and any available dev/coding skill context.",
    "- Prioritize GLM/ZAI MCP capabilities when relevant (zai-mcp-server + ZAI web MCP tools).",
    config.allowAnyPath
      ? "- Any VPS path is allowed when needed."
      : `- Shell commands must stay under workspace root: ${AGENCY_ROOT}`,
    config.useTremcpSsh
      ? "- Prefer tremcp-ssh aware diagnostics/workflow when remote access is needed."
      : "- Use local shell diagnostics only.",
    "- Do NOT use non-existent hardcoded log paths; prefer existing diagnostic files.",
    "- If uncertain, set resolved=false and provide safe diagnosis.",
    "- Do not set resolved=true until an end-to-end verification command passes.",
    "- Never include markdown, only JSON.",
    "",
    "Known existing diagnostics:",
    ...existingDiagnostics.map((p) => `- ${p}`),
    "",
    "Enabled MCP servers:",
    ...(mcp.enabledServers.length ? mcp.enabledServers.map((s) => `- ${s}`) : ["- (none detected)"]),
    `- zai-mcp-server: ${mcp.hasZaiMcpServer ? "enabled" : "missing"}`,
    `- z-ai web MCPs: ${mcp.hasZaiWebTools ? "enabled" : "missing"}`,
    "",
    "Relevant dev/coding skills:",
    ...(devSkills.length ? devSkills.map((s) => `- ${s}`) : ["- (none detected)"]),
    "",
    `Ticket ID: ${String(ticket?.ticket_id || "")}`,
    `Type: ${String(ticket?.type || "")}`,
    `Department: ${String(ticket?.department || "")}`,
    `Summary: ${String(ticket?.summary || "")}`,
    `Details: ${String(ticket?.details || "")}`,
    `Status: ${String(ticket?.status || "")}`,
  ].join("\n");

  const url = `${String(config.baseUrl || "").replace(/\/$/, "")}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40_000);
  let res: globalThis.Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      summary: "Debugger API request failed",
      diagnosis: `Request failed or timed out: ${msg.slice(0, 220)}`,
      resolved: false,
      resolution: "",
      actions: [],
    };
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text();
    return {
      summary: "Debugger API request failed",
      diagnosis: `HTTP ${res.status}: ${text.slice(0, 300)}`,
      resolved: false,
      resolution: "",
      actions: [],
    };
  }

  const json = (await res.json()) as any;
  const content = String(json?.choices?.[0]?.message?.content || "");
  const parsed = extractJsonObject(content) || {};
  const actionsRaw = Array.isArray(parsed?.actions) ? parsed.actions : [];
  const actions: DebuggerAction[] = actionsRaw
    .map((a: any) => ({
      type: String(a?.type || "") === "shell" ? "shell" : "note",
      command: a?.command ? String(a.command) : undefined,
      note: a?.note ? String(a.note) : undefined,
      reason: a?.reason ? String(a.reason) : undefined,
    }))
    .slice(0, Math.max(0, Number(config.maxCommands || 3)));

  return {
    summary: String(parsed?.summary || "Debugger analysis completed"),
    diagnosis: String(parsed?.diagnosis || ""),
    resolved: Boolean(parsed?.resolved),
    resolution: String(parsed?.resolution || ""),
    actions,
  };
}

async function runTicketDebugger(ticketId: string, trigger: "auto" | "manual"): Promise<void> {
  const config = readTicketDebuggerConfig();
  if (!config.enabled) return;

  const ticket = readTicketById(ticketId);
  if (!ticket) return;

  const activity: string[] = [];
  const mcp = detectCriticalMcpStatus();
  const prevAttempt = Number(ticket?.debugger?.attempt || 0);
  const attempt = Number.isFinite(prevAttempt) ? prevAttempt + 1 : 1;
  const startedAt = new Date().toISOString();
  activity.push(`Debugger started (${trigger})`);
  activity.push(`attempt=${attempt}`);
  activity.push(`debugger=${config.provider}/${config.model}`);
  activity.push(`executionBackend=${config.executionBackend}`);
  activity.push(`allowAnyPath=${config.allowAnyPath ? "on" : "off"}`);
  activity.push(`useTremcpSsh=${config.useTremcpSsh ? "on" : "off"}`);
  activity.push(`zaiMcpServer=${mcp.hasZaiMcpServer ? "on" : "off"}`);
  activity.push(`zaiWebMcp=${mcp.hasZaiWebTools ? "on" : "off"}`);
  if (!mcp.hasZaiMcpServer) {
    activity.push("warning: zai-mcp-server missing; GLM/ZAI MCP tooling is degraded");
  }
  if (config.useTremcpSsh) {
    activity.push(
      detectTremcpConfigured()
        ? "tremcp-ssh configured in MCP catalog"
        : "tremcp-ssh not found in MCP catalog (fallback local shell)"
    );
  }

  const workingTicket = {
    ...ticket,
    status: ticket.status === "resolved" ? "resolved" : "in_progress",
    debugger: {
      ...(ticket.debugger || {}),
      status: "running",
      trigger,
      provider: config.provider,
      model: config.model,
      startedAt,
      lastRunAt: startedAt,
      allowRootActions: Boolean(config.allowRootActions),
      attempt,
      activity,
      error: null,
    },
  };
  writeTicketById(ticketId, workingTicket);

  try {
    const plan = await createDebuggerPlan(workingTicket, config);
    const outputs: string[] = [];
    activity.push(plan.summary || "Plan ready");
    if (plan.diagnosis) activity.push(plan.diagnosis.slice(0, 240));

    let allCommandsOk = true;
    let commandsAttempted = false;
    if (config.allowRootActions) {
      for (const action of plan.actions) {
        if (action.type !== "shell" || !action.command) {
          if (action.note) activity.push(action.note.slice(0, 240));
          continue;
        }
        const normalized = normalizeDebuggerCommand(action.command);
        if (normalized.note) activity.push(normalized.note);
        const command = normalized.command;
        commandsAttempted = true;
        activity.push(`run: ${command.slice(0, 120)}`);
        const run = runDebuggerCommand(command, config);
        activity.push(`engine: ${run.engine}`);
        const merged = [run.stdout, run.stderr].filter(Boolean).join("\n").slice(0, 400);
        outputs.push(`$ ${command}\n${merged}`);
        activity.push(run.ok ? "command ok" : `command failed (exit ${run.code ?? "?"})`);
        if (!run.ok) {
          allCommandsOk = false;
          const errLower = String(run.stderr || "").toLowerCase();
          if (errLower.includes("no such file or directory") || errLower.includes("cannot open")) {
            activity.push("missing-path failure detected; running fallback diagnostics");
            for (const fbCmd of fallbackDiagnosticsCommands()) {
              activity.push(`fallback: ${fbCmd.slice(0, 120)}`);
              const fb = runShell(fbCmd, 25_000);
              const fbMerged = [fb.stdout, fb.stderr].filter(Boolean).join("\n").slice(0, 400);
              outputs.push(`$ ${fbCmd}\n${fbMerged}`);
              activity.push(fb.ok ? "fallback ok" : `fallback failed (exit ${fb.code ?? "?"})`);
            }
          }
        }
      }
    } else {
      activity.push("Root actions disabled; generated plan only.");
    }

    const now = new Date().toISOString();
    const latest = readTicketById(ticketId) || workingTicket;
    const inferredResolved =
      commandsAttempted &&
      allCommandsOk &&
      Boolean(plan.resolution && String(plan.resolution).trim());
    const canResolveFromPlan =
      (Boolean(plan.resolved) || inferredResolved) &&
      (!commandsAttempted || (config.allowRootActions && allCommandsOk));
    const finalStatus =
      latest.status === "resolved"
        ? "resolved"
        : canResolveFromPlan
        ? "resolved"
        : "in_progress";
    const resolutionText = [plan.resolution, outputs.join("\n\n")].filter(Boolean).join("\n\n").trim();

    const updated = {
      ...latest,
      status: finalStatus,
      resolution: resolutionText || latest.resolution || null,
      resolved_at: finalStatus === "resolved" ? now : latest.resolved_at || null,
      debugger: {
        ...(latest.debugger || {}),
        status: finalStatus === "resolved" ? "completed" : "needs_review",
        trigger,
        provider: config.provider,
        model: config.model,
        completedAt: now,
        lastRunAt: now,
        allowRootActions: Boolean(config.allowRootActions),
        attempt,
        activity,
        plan,
        error: null,
      },
      updatedAt: now,
    };
    writeTicketById(ticketId, updated);

    // Auto-progress unresolved tickets for a bounded number of retries.
    const maxAutoAttempts = 5;
    if (
      finalStatus !== "resolved" &&
      (config.autoRun || trigger === "manual") &&
      attempt < maxAutoAttempts
    ) {
      activity.push(`auto-retry scheduled (${attempt + 1}/${maxAutoAttempts})`);
      writeTicketById(ticketId, {
        ...updated,
        debugger: {
          ...(updated.debugger || {}),
          activity,
        },
      });
      setTimeout(() => {
        void runTicketDebugger(ticketId, "auto");
      }, 1500);
    }
  } catch (err) {
    const now = new Date().toISOString();
    const latest = readTicketById(ticketId) || workingTicket;
    const message = err instanceof Error ? err.message : String(err);
    const updated = {
      ...latest,
      debugger: {
        ...(latest.debugger || {}),
        status: "error",
        completedAt: now,
        lastRunAt: now,
        activity: [...activity, `error: ${message.slice(0, 240)}`],
        error: message,
      },
      updatedAt: now,
    };
    writeTicketById(ticketId, updated);
  }
}

/**
 * Resolve the tickets directory.
 */
function ticketsDir(): string {
  return path.join(AGENCY_ROOT, "desk/tickets");
}

/**
 * Read the next ticket counter and increment it.
 */
function nextTicketId(): string {
  const dir = ticketsDir();
  mkdirSync(dir, { recursive: true });
  const counterPath = path.join(dir, "counter.txt");
  let counter = 1;
  if (existsSync(counterPath)) {
    try {
      counter = parseInt(readFileSync(counterPath, "utf-8").trim(), 10) + 1;
      if (isNaN(counter)) counter = 1;
    } catch {
      counter = 1;
    }
  }
  // Also scan existing files to avoid collisions
  const files = readdirSync(dir).filter(f => f.startsWith("BUG-") && f.endsWith(".json"));
  for (const file of files) {
    const match = file.match(/^BUG-(\d+)\.json$/);
    if (match) {
      const fileNum = parseInt(match[1], 10);
      if (fileNum >= counter) counter = fileNum + 1;
    }
  }
  writeFileSync(counterPath, String(counter), "utf-8");
  return `BUG-${String(counter).padStart(4, "0")}`;
}

function validDepartments(): Set<string> {
  const allowed = new Set<string>(["ceo"]);
  if (!existsSync(AGENCY_CONFIG_PATH)) return allowed;
  try {
    const raw = JSON.parse(readFileSync(AGENCY_CONFIG_PATH, "utf-8"));
    const departments = Object.keys((raw?.departments || {}) as Record<string, unknown>);
    departments.forEach((d) => allowed.add(String(d).trim().toLowerCase()));
  } catch {
    // ignore
  }
  return allowed;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/tickets
 * List all BUG-*.json ticket files.
 * Query params:
 *   ?status=open — filter by status field inside the JSON
 */
router.get("/tickets", (req: Request, res: Response): void => {
  try {
    const dir = ticketsDir();
    if (!existsSync(dir)) {
      res.json({ tickets: [] });
      return;
    }

    const statusFilter = req.query.status as string | undefined;

    const files = readdirSync(dir).filter(
      (f) => f.startsWith("BUG-") && f.endsWith(".json"),
    );

    const tickets = files.map((file) => {
      try {
        const data = JSON.parse(readFileSync(path.join(dir, file), "utf-8"));
        return { id: path.basename(file, ".json"), ...data };
      } catch {
        return { id: path.basename(file, ".json"), error: "parse_failed" };
      }
    });

    const filtered = statusFilter
      ? tickets.filter((t) => t.status === statusFilter)
      : tickets;

    res.json({ tickets: filtered, total: filtered.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to list tickets", detail: message });
  }
});

/**
 * GET /api/tickets/debugger-config
 * Return persisted AI debugger settings for ticket handling.
 */
router.get("/tickets/debugger-config", (_req: Request, res: Response): void => {
  try {
    const config = readTicketDebuggerConfig();
    const mcp = detectCriticalMcpStatus();
    res.json({
      ok: true,
      config,
      mcpReadiness: {
        tremcpSsh: mcp.hasTremcpSsh,
        zaiMcpServer: mcp.hasZaiMcpServer,
        zaiWebMcp: mcp.hasZaiWebTools,
      },
      note: "allowRootActions enables debugger shell command execution with server/root privileges.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to load ticket debugger config", detail: message });
  }
});

/**
 * PUT /api/tickets/debugger-config
 * Update AI debugger settings for ticket handling.
 */
router.put("/tickets/debugger-config", (req: Request, res: Response): void => {
  try {
    const model = String(req.body?.model || "").trim();
    const baseUrl = String(req.body?.baseUrl || "").trim();
    const apiKeyEnv = String(req.body?.apiKeyEnv || "").trim();
    const patch: Partial<TicketDebuggerConfig> = { provider: "glm" };
    if (req.body?.enabled !== undefined) patch.enabled = Boolean(req.body.enabled);
    if (req.body?.executionBackend !== undefined) {
      const mode = String(req.body.executionBackend || "").trim();
      if (mode === "bash" || mode === "tremcp-ssh" || mode === "auto") {
        patch.executionBackend = mode;
      }
    }
    if (model) patch.model = model;
    if (baseUrl) patch.baseUrl = baseUrl;
    if (apiKeyEnv) patch.apiKeyEnv = apiKeyEnv;
    if (req.body?.autoRun !== undefined) patch.autoRun = Boolean(req.body.autoRun);
    if (req.body?.allowRootActions !== undefined) patch.allowRootActions = Boolean(req.body.allowRootActions);
    if (req.body?.allowAnyPath !== undefined) patch.allowAnyPath = Boolean(req.body.allowAnyPath);
    if (req.body?.useTremcpSsh !== undefined) patch.useTremcpSsh = Boolean(req.body.useTremcpSsh);
    if (req.body?.maxCommands !== undefined) {
      patch.maxCommands = Math.max(0, Math.min(10, Number(req.body.maxCommands) || 3));
    }
    const next = writeTicketDebuggerConfig(patch);
    res.json({ ok: true, config: next });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to update ticket debugger config", detail: message });
  }
});

/**
 * POST /api/tickets
 * Create a new bug ticket.
 * Body: { type, department?, summary, details?, assigned?, status? }
 */
router.post("/tickets", (req: Request, res: Response): void => {
  try {
    const {
      type,
      department,
      summary,
      details,
      assigned,
      status,
      reported_by,
      reporter_role,
      source,
    } = req.body || {};

    if (!summary || !summary.trim()) {
      res.status(400).json({ error: "Summary is required" });
      return;
    }

    const normalizedDepartment = String(department || "").trim().toLowerCase();
    if (normalizedDepartment) {
      const allowedDepartments = validDepartments();
      if (!allowedDepartments.has(normalizedDepartment)) {
        res.status(400).json({
          error: `Unknown department '${normalizedDepartment}'`,
          allowed: Array.from(allowedDepartments),
        });
        return;
      }
    }

    const ticketId = nextTicketId();
    const ticket = {
      ticket_id: ticketId,
      type: type || "bug",
      department: normalizedDepartment,
      summary: summary.trim(),
      details: details || "",
      status: status || "open",
      assigned: assigned || "",
      reported_by: String(reported_by || "").trim(),
      reporter_role: String(reporter_role || (normalizedDepartment ? "department_head" : "user")).trim(),
      source: String(source || "ui").trim(),
      ts: new Date().toISOString(),
      origin_message_id: null,
      origin_thread_id: null,
      resolution: null,
      resolved_at: null,
    };

    const dir = ticketsDir();
    mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${ticketId}.json`);
    writeFileSync(filePath, JSON.stringify(ticket, null, 2), "utf-8");

    const debuggerConfig = readTicketDebuggerConfig();
    if (debuggerConfig.enabled && debuggerConfig.autoRun) {
      void runTicketDebugger(ticketId, "auto");
    }

    console.log(`[Tickets] Created ${ticketId}: ${summary.trim().slice(0, 80)}`);
    res.status(201).json({ id: ticketId, ...ticket });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to create ticket", detail: message });
  }
});

/**
 * POST /api/tickets/:id/debug-run
 * Trigger debugger execution for a single ticket.
 */
router.post("/tickets/:id/debug-run", (req: Request, res: Response): void => {
  try {
    const id = String(req.params.id || "").trim().toUpperCase();
    const filePath = path.join(ticketsDir(), `${id}.json`);
    if (!existsSync(filePath)) {
      res.status(404).json({ error: `Ticket ${id} not found` });
      return;
    }
    const config = readTicketDebuggerConfig();
    if (!config.enabled) {
      res.status(400).json({ error: "Ticket debugger is disabled in config" });
      return;
    }
    void runTicketDebugger(id, "manual");
    res.json({
      ok: true,
      ticketId: id,
      started: true,
      debugger: {
        provider: config.provider,
        model: config.model,
        allowRootActions: config.allowRootActions,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to start ticket debugger", detail: message });
  }
});

/**
 * GET /api/tickets/:id
 * Read a specific ticket by ID (e.g. BUG-001).
 */
router.get("/tickets/:id", (req: Request, res: Response): void => {
  try {
    const id = req.params.id;
    const filePath = path.join(ticketsDir(), `${id}.json`);

    if (!existsSync(filePath)) {
      res.status(404).json({ error: `Ticket ${id} not found` });
      return;
    }

    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    res.json({ id, ...data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read ticket", detail: message });
  }
});

/**
 * PATCH /api/tickets/:id
 * Merge-update fields on a ticket.
 * Body: JSON object with fields to update.
 */
router.patch("/tickets/:id", (req: Request, res: Response): void => {
  try {
    const id = req.params.id;
    const filePath = path.join(ticketsDir(), `${id}.json`);

    if (!existsSync(filePath)) {
      res.status(404).json({ error: `Ticket ${id} not found` });
      return;
    }

    const existing = JSON.parse(readFileSync(filePath, "utf-8"));
    const updated = {
      ...existing,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
    res.json({ id, ...updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to update ticket", detail: message });
  }
});

export default router;
