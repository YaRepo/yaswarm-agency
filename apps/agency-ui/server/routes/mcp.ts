import { Router, Request, Response } from "express";
import { readFileSync, existsSync, writeFileSync, mkdirSync, chmodSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";
const YASWARM_ROOT = process.env.YASWARM_ROOT || "/root/yaswarm-swarm";
const MCP_ENV_FILE =
  process.env.MCP_ENV_FILE || path.join(AGENCY_ROOT, ".env");
const AGENCY_CONFIG_PATH = path.join(AGENCY_ROOT, "config", "agency-config.json");
const DEPT_SUB_AGENTS_PATH = path.join(AGENCY_ROOT, "config", "department-sub-agents.json");
const PI_BRIDGE_FILE = path.join(AGENCY_ROOT, "config", "pi-mcp-bridge.json");
const PI_WRAPPER_PATH = "/root/.npm-global/bin/pi-yaswarm";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface YaswarmMcpConfig {
  servers?: Record<string, any>;
  [key: string]: unknown;
}

interface EnvEntry {
  key: string;
  maskedValue: string;
}

type McpServerCheck = {
  name: string;
  enabled: boolean;
  transport: string;
  type: "remote" | "local";
  status: "healthy" | "warning" | "error" | "disabled";
  checks: {
    commandOk: boolean;
    urlOk: boolean;
    startupOk: boolean;
    startupNote: string;
    requiredEnvCount: number;
    missingEnv: string[];
  };
};

function extractEnvPlaceholders(value: string): string[] {
  const out: string[] = [];
  const re = /\$\{([A-Z_][A-Z0-9_]*)\}/g;
  let m: RegExpExecArray | null = null;
  while ((m = re.exec(value)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function firstExistingPath(paths: string[]): string | null {
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

function readYaswarmMcpConfig(): YaswarmMcpConfig | null {
  const candidates = [
    path.join(YASWARM_ROOT, "mcp/mcp-config.json"),
    path.join(AGENCY_ROOT, "config", "mcp-config.json"),
    path.join(YASWARM_ROOT, "projects/yaswarm-mcps-cataloge/imports/agency/mcp-catalog.json"),
  ];

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, "utf-8"));
    }
  }
  return null;
}

function resolveMcpConfigPath(): string {
  return (
    firstExistingPath([
      path.join(YASWARM_ROOT, "mcp/mcp-config.json"),
      path.join(AGENCY_ROOT, "config", "mcp-config.json"),
      path.join(YASWARM_ROOT, "projects/yaswarm-mcps-cataloge/imports/agency/mcp-catalog.json"),
    ]) || path.join(YASWARM_ROOT, "mcp/mcp-config.json")
  );
}

/**
 * Read the MCP registry YAML file.
 * Simple line-based parser for the specific YAML structure used.
 */
function readMcpRegistry(): any[] {
  const registryPath = firstExistingPath([
    path.join(AGENCY_ROOT, "projects", "mcp-registry.yaml"),
    path.join(YASWARM_ROOT, "projects/yaswarm-mcps-cataloge/imports/agency/mcp-registry.yaml"),
    path.join(YASWARM_ROOT, "projects/yaswarm-mcps-cataloge/imports/agency/registry.yaml"),
  ]);
  if (!registryPath) return [];
  if (!existsSync(registryPath)) return [];

  const content = readFileSync(registryPath, "utf-8");
  const servers: any[] = [];
  let current: any = null;
  let inServers = false;

  for (const line of content.split("\n")) {
    const trimmed = line.trimEnd();

    // Detect "servers:" section
    if (/^servers:\s*$/.test(trimmed)) {
      inServers = true;
      continue;
    }

    if (!inServers) continue;

    // New list item under servers (starts with "  - ")
    const listItemMatch = trimmed.match(/^\s{2}-\s+(\w[\w_-]*):\s*(.*)$/);
    if (listItemMatch) {
      if (current) servers.push(current);
      current = {};
      let val: any = listItemMatch[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      current[listItemMatch[1]] = val;
      continue;
    }

    // Properties of current server (indented with 4+ spaces)
    if (current && /^\s{4}\w/.test(line)) {
      const propMatch = trimmed.match(/^\s+(\w[\w_-]*):\s*(.*)$/);
      if (propMatch) {
        let val: any = propMatch[2].trim();
        // Remove quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        // Boolean/number coercion
        if (val === "true") val = true;
        else if (val === "false") val = false;
        else if (/^\d+$/.test(val)) val = Number(val);
        current[propMatch[1]] = val;
      }
    }

    // If we hit a top-level key that isn't indented, stop
    if (inServers && /^\S/.test(line) && trimmed !== "") {
      break;
    }
  }
  if (current) servers.push(current);

  return servers;
}

function resolveEnvFilePath(): string {
  const candidates = [
    MCP_ENV_FILE,
    path.join(AGENCY_ROOT, ".env"),
    "/root/agency.env",
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

function isExecutableOnPath(command: string): boolean {
  const cmd = String(command || "").trim();
  if (!cmd) return false;
  const npmPrefix = String(process.env.NPM_CONFIG_PREFIX || "").trim();
  const npmBin = npmPrefix ? path.join(npmPrefix, "bin") : "";
  const basePath = String(
    process.env.PATH || "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
  );
  const mergedPath = npmBin
    ? [npmBin, ...basePath.split(":").filter(Boolean).filter((p) => p !== npmBin)].join(":")
    : basePath;
  const probe = spawnSync("bash", ["-c", `command -v ${cmd}`], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      PATH: mergedPath,
    },
  });
  return probe.status === 0;
}

function runShell(command: string, timeoutMs = 8000): {
  ok: boolean;
  code: number;
  stdout: string;
  stderr: string;
} {
  const npmPrefix = String(process.env.NPM_CONFIG_PREFIX || "").trim();
  const npmBin = npmPrefix ? path.join(npmPrefix, "bin") : "";
  const basePath = String(
    process.env.PATH || "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
  );
  const mergedPath = npmBin
    ? [npmBin, ...basePath.split(":").filter(Boolean).filter((p) => p !== npmBin)].join(":")
    : basePath;
  const result = spawnSync("bash", ["-c", command], {
    encoding: "utf-8",
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024 * 5,
    env: {
      ...process.env,
      PATH: mergedPath,
    },
  });
  return {
    ok: result.status === 0,
    code: typeof result.status === "number" ? result.status : 1,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim(),
  };
}

function parseCliMcpServerNames(cliId: string, output: string): string[] {
  const text = String(output || "");
  const names = new Set<string>();
  if (!text) return [];

  if (cliId === "claude-code") {
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9._-]+):\s+/);
      if (m) names.add(m[1]);
    }
    return Array.from(names);
  }

  if (cliId === "codex") {
    if (/No MCP servers configured/i.test(text)) return [];
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9._-]+)\s+/);
      if (m && m[1].toLowerCase() !== "name") names.add(m[1]);
    }
    return Array.from(names);
  }

  if (cliId === "opencode") {
    if (/No MCP servers configured/i.test(text)) return [];
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9._-]+)\s*(?:\(|-|:)/);
      if (m) names.add(m[1]);
    }
    return Array.from(names);
  }

  if (cliId === "gemini-cli") {
    if (/No MCP servers configured/i.test(text)) return [];
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9._-]+)\s*(?:\(|-|:)/);
      if (m) names.add(m[1]);
    }
    return Array.from(names);
  }

  return [];
}

function probeCliMcpConfig(cliId: string, binary: string): {
  mcpSupported: boolean;
  listCommand: string | null;
  configuredServerNames: string[];
  note: string;
} {
  if (!isExecutableOnPath(binary)) {
    return {
      mcpSupported: false,
      listCommand: null,
      configuredServerNames: [],
      note: "CLI not installed",
    };
  }

  const probes: Record<string, string> = {
    "codex": "codex mcp list",
    "claude-code": "claude mcp list",
    "opencode": "opencode mcp list",
    "gemini-cli": "gemini mcp list",
  };

  const cmd = probes[cliId];
  if (!cmd) {
    return {
      mcpSupported: false,
      listCommand: null,
      configuredServerNames: [],
      note: "CLI has no MCP management command",
    };
  }

  const run = runShell(cmd, 12000);
  const merged = [run.stdout, run.stderr].filter(Boolean).join("\n").trim();
  const names = parseCliMcpServerNames(cliId, merged);

  return {
    mcpSupported: true,
    listCommand: cmd,
    configuredServerNames: names,
    note: merged || (run.ok ? "No output" : `Command failed (exit ${run.code})`),
  };
}

function shellQuote(value: string): string {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function resolvePlaceholderValue(value: string, envBag: Record<string, string>): string {
  return String(value || "").replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_m, key) => envBag[key] || "");
}

function resolveServerHeaders(
  serverConfig: Record<string, any>,
  envBag: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  const headers = serverConfig.headers;
  if (!headers || typeof headers !== "object") return out;
  for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
    const val = resolvePlaceholderValue(String(v || ""), envBag).trim();
    if (!val) continue;
    out[String(k)] = val;
  }
  return out;
}

function buildCliSyncCommands(
  cliId: string,
  serverName: string,
  serverConfig: Record<string, any>,
  envBag: Record<string, string>
): { removeCmd?: string; addCmd?: string; skipped?: string } {
  const url = String(serverConfig.url || "").trim();
  const command = String(serverConfig.command || "").trim();
  const args = Array.isArray(serverConfig.args) ? serverConfig.args.map((v: unknown) => String(v)) : [];
  const headerPairs = Object.entries(resolveServerHeaders(serverConfig, envBag)).map(
    ([k, v]) => `${k}: ${v}`
  );
  const envPairs: string[] = [];
  if (serverConfig.env && typeof serverConfig.env === "object") {
    for (const [k, v] of Object.entries(serverConfig.env as Record<string, unknown>)) {
      const value = resolvePlaceholderValue(String(v || ""), envBag);
      if (value) envPairs.push(`${k}=${value}`);
    }
  }

  if (cliId === "codex") {
    if (url) {
      const headerFlags = headerPairs.map((pair) => `--header ${shellQuote(pair)}`).join(" ");
      return {
        removeCmd: `codex mcp remove ${shellQuote(serverName)}`,
        addCmd: `codex mcp add ${shellQuote(serverName)} --url ${shellQuote(url)} ${headerFlags}`.trim(),
      };
    }
    if (!command) return { skipped: "Missing stdio command in MCP config" };
    const envFlags = envPairs.map((pair) => `--env ${shellQuote(pair)}`).join(" ");
    const argStr = args.map((a) => shellQuote(a)).join(" ");
    return {
      removeCmd: `codex mcp remove ${shellQuote(serverName)}`,
      addCmd: `codex mcp add ${shellQuote(serverName)} ${envFlags} -- ${shellQuote(command)} ${argStr}`.trim(),
    };
  }

  if (cliId === "claude-code") {
    if (url) {
      return {
        removeCmd: `claude mcp remove -s user ${shellQuote(serverName)}`,
        addCmd: `claude mcp add -s user -t http ${shellQuote(serverName)} ${shellQuote(url)}`,
      };
    }
    if (!command) return { skipped: "Missing stdio command in MCP config" };
    const envFlags = envPairs.map((pair) => `-e ${shellQuote(pair)}`).join(" ");
    const argStr = args.map((a) => shellQuote(a)).join(" ");
    return {
      removeCmd: `claude mcp remove -s user ${shellQuote(serverName)}`,
      addCmd: `claude mcp add -s user -t stdio ${envFlags} ${shellQuote(serverName)} -- ${shellQuote(command)} ${argStr}`.trim(),
    };
  }

  if (cliId === "gemini-cli") {
    if (url) {
      return {
        removeCmd: `gemini mcp remove ${shellQuote(serverName)}`,
        addCmd: `gemini mcp add ${shellQuote(serverName)} ${shellQuote(url)}`,
      };
    }
    if (!command) return { skipped: "Missing stdio command in MCP config" };
    const addParts = ["gemini", "mcp", "add", shellQuote(serverName)];
    if (envPairs.length > 0) {
      addParts.push("env");
      addParts.push(...envPairs.map((pair) => shellQuote(pair)));
    }
    addParts.push(shellQuote(command));
    addParts.push(...args.map((a) => shellQuote(a)));
    return {
      removeCmd: `gemini mcp remove ${shellQuote(serverName)}`,
      addCmd: addParts.join(" "),
    };
  }

  if (cliId === "opencode") {
    return {
      skipped: "OpenCode MCP add is interactive in this build; use custom formula/manual setup",
    };
  }

  return {
    skipped: "This CLI does not expose MCP registration commands",
  };
}

function getPiBridgeState(enabledUsableNames: Set<string>): {
  ready: boolean;
  configured: string[];
  coverage: number;
  missing: string[];
} {
  if (!existsSync(PI_BRIDGE_FILE)) {
    return { ready: false, configured: [], coverage: 0, missing: Array.from(enabledUsableNames) };
  }
  try {
    const parsed = JSON.parse(readFileSync(PI_BRIDGE_FILE, "utf-8"));
    const configured = Array.isArray(parsed?.enabledServers)
      ? parsed.enabledServers.map((v: unknown) => String(v))
      : [];
    const missing = Array.from(enabledUsableNames).filter((name) => !configured.includes(name));
    const coverage = enabledUsableNames.size
      ? Number(((configured.length - missing.length) / enabledUsableNames.size).toFixed(3))
      : 0;
    const wrapperReady = existsSync(PI_WRAPPER_PATH);
    return {
      ready: wrapperReady && missing.length === 0 && configured.length > 0,
      configured,
      coverage: Math.max(0, Math.min(1, coverage)),
      missing,
    };
  } catch {
    return { ready: false, configured: [], coverage: 0, missing: Array.from(enabledUsableNames) };
  }
}

function loadJsonObject(filePath: string): Record<string, any> {
  if (!existsSync(filePath)) return {};
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf-8"));
    return parsed && typeof parsed === "object" ? parsed as Record<string, any> : {};
  } catch {
    return {};
  }
}

function writeJsonObject(filePath: string, obj: Record<string, any>): void {
  writeFileSync(filePath, `${JSON.stringify(obj, null, 2)}\n`, "utf-8");
}

async function checkRemoteUrl(url: string): Promise<boolean> {
  const u = String(url || "").trim();
  if (!u) return false;
  try {
    // Guard against malformed URLs ("The string did not match the expected pattern.")
    // before calling fetch.
    new URL(u);
  } catch {
    return false;
  }
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 3500);
  try {
    const res = await fetch(u, {
      method: "GET",
      signal: ctrl.signal,
      redirect: "follow",
      headers: { accept: "*/*" },
    });
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function probeRemoteInitialize(
  url: string,
  headers: Record<string, string>
): Promise<{ ok: boolean; note: string }> {
  const u = String(url || "").trim();
  if (!u) return { ok: false, note: "Missing URL" };
  try {
    new URL(u);
  } catch {
    return { ok: false, note: "Invalid URL format" };
  }
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 4500);
  try {
    const payload = {
      jsonrpc: "2.0",
      id: "yaswarm-audit-init",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "yaswarm-audit", version: "1.0.0" },
      },
    };
    const res = await fetch(u, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        accept: "application/json, text/event-stream;q=0.9, */*;q=0.8",
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    const hasInitShape =
      /"jsonrpc"\s*:\s*"2\.0"/.test(body) &&
      (/"result"\s*:/.test(body) || /event:\s*message/i.test(body));
    if (!res.ok) {
      return {
        ok: false,
        note: `initialize HTTP ${res.status}: ${body.slice(0, 180)}`.trim(),
      };
    }
    return hasInitShape
      ? { ok: true, note: "initialize response received" }
      : { ok: false, note: `initialize response malformed: ${body.slice(0, 180)}`.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, note: `initialize failed: ${message}` };
  } finally {
    clearTimeout(timeout);
  }
}

function probeLocalStartup(
  command: string,
  args: string[],
  env: Record<string, string>
): { ok: boolean; note: string } {
  if (!command) return { ok: false, note: "Missing command" };
  const run = spawnSync(command, args, {
    env: { ...process.env, ...env },
    encoding: "utf-8",
    timeout: 2500,
    maxBuffer: 1024 * 512,
  });
  const stderr = String(run.stderr || "").trim();
  const stdout = String(run.stdout || "").trim();
  if (run.error) {
    const msg = String(run.error.message || "");
    const startupText = `${stderr}\n${stdout}`;
    if (
      /running on stdio/i.test(startupText) ||
      /mcp server started successfully/i.test(startupText) ||
      /starting mcp server/i.test(startupText) ||
      /server is running on .*\/mcp/i.test(startupText) ||
      /chrome-devtools-mcp exposes content/i.test(startupText)
    ) {
      return { ok: true, note: (stderr || stdout || "server startup banner detected").slice(0, 180) };
    }
    if (/ETIMEDOUT/i.test(msg)) {
      return { ok: true, note: "process stayed alive (timeout)" };
    }
    return { ok: false, note: msg };
  }
  if (run.signal === "SIGTERM") {
    // Timed out while still alive => good sign for long-running stdio server.
    return { ok: true, note: "process stayed alive (timeout)" };
  }
  const startupText = `${stderr}\n${stdout}`;
  if (
    /running on stdio/i.test(startupText) ||
    /mcp server started successfully/i.test(startupText) ||
    /starting mcp server/i.test(startupText) ||
    /server is running on .*\/mcp/i.test(startupText) ||
    /chrome-devtools-mcp exposes content/i.test(startupText)
  ) {
    return { ok: true, note: (stderr || stdout || "server startup banner detected").slice(0, 180) };
  }
  if (typeof run.status === "number" && run.status !== 0) {
    return { ok: false, note: (stderr || stdout || `exit ${run.status}`).slice(0, 180) };
  }
  // Fast exit without timeout usually means it did not stay up as MCP server.
  return { ok: false, note: (stderr || stdout || "process exited immediately").slice(0, 180) };
}

function isSharedApiKeysFile(filePath: string): boolean {
  return path.resolve(filePath) === path.resolve("/root/agency.env");
}

function parseEnvFile(filePath: string): Map<string, string> {
  if (!existsSync(filePath)) return new Map();
  const map = new Map<string, string>();
  const raw = readFileSync(filePath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(match[1], value.replace(/\\n/g, "\n"));
  }
  return map;
}

function safeReadJson(filePath: string): any {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function formatEnvAssignment(key: string, value: string): string {
  const needsQuotes = /[\s#"']/g.test(value) || value.includes("=");
  if (!needsQuotes) return `${key}=${value}`;
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  return `${key}="${escaped}"`;
}

function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "*".repeat(value.length);
  const visibleStart = value.slice(0, 2);
  const visibleEnd = value.slice(-2);
  const hidden = "*".repeat(Math.min(Math.max(value.length - 4, 4), 12));
  return `${visibleStart}${hidden}${visibleEnd}`;
}

function listEnvEntries(filePath: string): EnvEntry[] {
  const map = parseEnvFile(filePath);
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      key,
      maskedValue: maskSecret(value),
    }));
}

function collectReferencedEnvKeysFromObject(node: unknown, out: Set<string>): void {
  if (typeof node === "string") {
    for (const key of extractEnvPlaceholders(node)) out.add(key);
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) collectReferencedEnvKeysFromObject(item, out);
    return;
  }

  if (!node || typeof node !== "object") return;
  for (const val of Object.values(node as Record<string, unknown>)) {
    collectReferencedEnvKeysFromObject(val, out);
  }
}

function collectReferencedMcpEnvKeys(config: YaswarmMcpConfig | null): Set<string> {
  const out = new Set<string>();
  const servers = config?.servers;
  if (!servers || typeof servers !== "object") return out;
  collectReferencedEnvKeysFromObject(servers, out);
  return out;
}

function isMcpApiKeyName(key: string): boolean {
  const upper = key.toUpperCase();
  if (upper.endsWith("_KEY_PATH")) return false;
  return (
    upper.includes("API_KEY") ||
    upper.includes("TOKEN") ||
    upper.includes("SECRET") ||
    upper.endsWith("_KEY")
  );
}

function collectReferencedMcpApiKeys(config: YaswarmMcpConfig | null): Set<string> {
  const all = collectReferencedMcpEnvKeys(config);
  return new Set(Array.from(all).filter(isMcpApiKeyName));
}

function normalizeBackend(input: string): string {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw) return "unknown";
  if (raw.startsWith("opencode/")) return "opencode";
  if (raw.startsWith("claude")) return "claude-code";
  if (raw.startsWith("gemini")) return "gemini-cli";
  if (raw.startsWith("gpt") || raw === "o3" || raw === "o4-mini") return "codex";
  if (raw.startsWith("glm")) return "glm";
  return raw;
}

function backendSupportsMcp(backend: string): boolean {
  const b = normalizeBackend(backend);
  return new Set([
    "opencode",
    "codex",
    "claude-code",
    "gemini-cli",
    "codebuff",
    "pi-mono",
    "pi",
  ]).has(b);
}

async function runMcpDoctorChecks(config: YaswarmMcpConfig | null): Promise<McpServerCheck[]> {
  const servers = (config?.servers && typeof config.servers === "object" ? config.servers : {}) as Record<string, any>;
  const envPath = resolveEnvFilePath();
  const envMap = parseEnvFile(envPath);
  const envBag: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === "string") envBag[k] = v;
  }
  for (const [k, v] of envMap.entries()) envBag[k] = v;

  return Promise.all(Object.entries(servers).map(async ([name, raw]) => {
    const s = raw && typeof raw === "object" ? raw : {};
    const enabled = (s as any).enabled !== false;
    const required: string[] = Array.isArray((s as any).required_env)
      ? (s as any).required_env.map((v: unknown) => String(v))
      : [];
    const missingEnv = required.filter((key) => !String(envBag[key] || "").trim());
    const transport = String((s as any).transport || ((s as any).url ? "http" : "stdio"));
    const hasUrl = typeof (s as any).url === "string" && String((s as any).url).trim().length > 0;
    const command = String((s as any).command || "").trim();
    const commandOk = hasUrl ? true : isExecutableOnPath(command);
    const urlReachable = hasUrl ? await checkRemoteUrl(String((s as any).url || "")) : true;
    const args = Array.isArray((s as any).args) ? (s as any).args.map((v: unknown) => String(v)) : [];
    const extraEnv: Record<string, string> = {};
    if (s && typeof (s as any).env === "object" && (s as any).env) {
      for (const [k, v] of Object.entries((s as any).env as Record<string, unknown>)) {
        const resolved = resolvePlaceholderValue(String(v || ""), envBag).trim();
        if (resolved) extraEnv[String(k)] = resolved;
      }
    }
    const remoteHeaders = resolveServerHeaders(s as Record<string, any>, envBag);
    const startup = hasUrl
      ? await probeRemoteInitialize(String((s as any).url || ""), remoteHeaders)
      : commandOk
      ? probeLocalStartup(command, args, extraEnv)
      : { ok: false, note: "Command not found on PATH" };
    const urlOk = hasUrl ? (urlReachable || startup.ok) : true;

    let status: "healthy" | "warning" | "error" | "disabled" = "healthy";
    if (!enabled) status = "disabled";
    else if (!commandOk || !urlOk || !startup.ok) status = "error";
    else if (missingEnv.length > 0) status = "warning";

    return {
      name,
      enabled,
      transport,
      type: hasUrl ? "remote" : "local",
      status,
      checks: {
        commandOk,
        urlOk,
        startupOk: startup.ok,
        startupNote: startup.note,
        requiredEnvCount: required.length,
        missingEnv,
      },
    };
  }));
}

function configuredServerNames(config: YaswarmMcpConfig | null): Set<string> {
  const out = new Set<string>();
  const servers = config?.servers;
  if (!servers || typeof servers !== "object") return out;
  for (const name of Object.keys(servers)) out.add(name);
  return out;
}

function filterRegistryToConfiguredServers(registry: any[], config: YaswarmMcpConfig | null): any[] {
  const names = configuredServerNames(config);
  if (names.size === 0) return [];
  return (registry || []).filter((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const id = String((entry as any).id || "").trim();
    const name = String((entry as any).name || "").trim();
    return names.has(id) || names.has(name);
  });
}

function upsertEnvFileKey(filePath: string, key: string, value: string): void {
  const newLine = formatEnvAssignment(key, value);
  const raw = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
  const lines = raw ? raw.split(/\r?\n/) : [];
  let replaced = false;

  const updatedLines = lines.map((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match && match[1] === key) {
      replaced = true;
      return newLine;
    }
    return line;
  });

  if (!replaced) {
    if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1].trim() !== "") {
      updatedLines.push("");
    }
    updatedLines.push(newLine);
  }

  writeFileSync(filePath, `${updatedLines.join("\n").replace(/\n*$/, "")}\n`, "utf-8");
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/mcp/servers
 * List configured MCP servers from YaSwarm mcp-config + mcp-registry.yaml.
 */
router.get("/mcp/servers", (_req: Request, res: Response): void => {
  try {
    const config = readYaswarmMcpConfig();
    const registry = filterRegistryToConfiguredServers(readMcpRegistry(), config);

    const servers = config?.servers || {};

    res.json({
      servers,
      registry,
      configPath: firstExistingPath([
        path.join(YASWARM_ROOT, "mcp/mcp-config.json"),
        path.join(AGENCY_ROOT, "config", "mcp-config.json"),
        path.join(YASWARM_ROOT, "projects/yaswarm-mcps-cataloge/imports/agency/mcp-catalog.json"),
      ]) || "not found",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read MCP servers", detail: message });
  }
});

/**
 * GET /api/mcp/tools
 * Aggregate tool/server list from mcp-config servers config.
 */
router.get("/mcp/tools", (_req: Request, res: Response): void => {
  try {
    const config = readYaswarmMcpConfig();
    const toolsConfig = config?.servers || {};
    const tools: Array<{ category: string; name: string; enabled: boolean; details?: any }> = [];

    for (const [category, catConfig] of Object.entries(toolsConfig)) {
      if (typeof catConfig === "object" && catConfig !== null) {
        const catObj = catConfig as Record<string, any>;
        // Check if it has sub-tools
        if ("enabled" in catObj) {
          tools.push({ category, name: category, enabled: !!catObj.enabled, details: catObj });
        } else {
          for (const [subName, subVal] of Object.entries(catObj)) {
            if (typeof subVal === "object" && subVal !== null) {
              tools.push({
                category,
                name: `${category}.${subName}`,
                enabled: !!(subVal as any).enabled,
                details: subVal,
              });
            }
          }
        }
      }
    }

    res.json({ tools, total: tools.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to aggregate MCP tools", detail: message });
  }
});

/**
 * GET /api/mcp/registry
 * Return the MCP server registry from mcp-registry.yaml.
 */
router.get("/mcp/registry", (_req: Request, res: Response): void => {
  try {
    const config = readYaswarmMcpConfig();
    const registry = filterRegistryToConfiguredServers(readMcpRegistry(), config);
    res.json({ registry });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read MCP registry", detail: message });
  }
});

/**
 * GET /api/mcp/config
 * Return the raw YaSwarm mcp-config (for the config viewer/editor).
 */
router.get("/mcp/config", (_req: Request, res: Response): void => {
  try {
    const configPath = resolveMcpConfigPath();
    if (!existsSync(configPath)) {
      res.json({ config: null, path: configPath, exists: false });
      return;
    }
    const raw = readFileSync(configPath, "utf-8");
    res.json({
      config: JSON.parse(raw),
      path: configPath,
      exists: true,
      sizeBytes: Buffer.byteLength(raw),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to read config", detail: message });
  }
});

/**
 * PATCH /api/mcp/servers/:serverName
 * Toggle MCP server enabled/disabled by writing `enabled` field into mcp config.
 */
router.patch("/mcp/servers/:serverName", (req: Request, res: Response): void => {
  try {
    const serverName = String(req.params?.serverName || "").trim();
    if (!serverName) {
      res.status(400).json({ error: "Missing server name" });
      return;
    }
    if (typeof req.body?.enabled !== "boolean") {
      res.status(400).json({ error: "enabled must be boolean" });
      return;
    }
    const enabled = Boolean(req.body.enabled);
    const configPath = resolveMcpConfigPath();
    if (!existsSync(configPath)) {
      res.status(404).json({ error: "MCP config file not found", path: configPath });
      return;
    }
    const raw = readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw) as YaswarmMcpConfig;
    if (!config?.servers || typeof config.servers !== "object") {
      res.status(400).json({ error: "Invalid MCP config (missing servers object)" });
      return;
    }
    if (!(serverName in config.servers)) {
      res.status(404).json({ error: "MCP server not found in config", serverName });
      return;
    }
    const server = config.servers[serverName];
    if (!server || typeof server !== "object") {
      config.servers[serverName] = { enabled };
    } else {
      (config.servers[serverName] as Record<string, unknown>).enabled = enabled;
    }
    writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
    res.json({ ok: true, serverName, enabled, path: configPath });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to update MCP server state", detail: message });
  }
});

/**
 * GET /api/mcp/doctor
 * Run lightweight health checks against configured MCP servers.
 */
router.get("/mcp/doctor", async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = readYaswarmMcpConfig();
    const checks = await runMcpDoctorChecks(config);
    const envPath = resolveEnvFilePath();

    const summary = {
      total: checks.length,
      healthy: checks.filter((c) => c.status === "healthy").length,
      warning: checks.filter((c) => c.status === "warning").length,
      error: checks.filter((c) => c.status === "error").length,
      disabled: checks.filter((c) => c.status === "disabled").length,
    };

    res.json({
      ok: true,
      envPath,
      summary,
      checks: checks.sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to run MCP doctor checks", detail: message });
  }
});

router.get("/mcp/access-audit", async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = readYaswarmMcpConfig();
    const checks = await runMcpDoctorChecks(config);
    const enabledHealthy = checks.filter((c) => c.enabled && c.status === "healthy");
    const enabledUsable = checks.filter((c) => c.enabled && c.status !== "error");
    const canUseEnabledMcps = enabledUsable.length > 0;

    const agencyConfig = safeReadJson(AGENCY_CONFIG_PATH) || {};
    const subAgentsConfig = safeReadJson(DEPT_SUB_AGENTS_PATH) || {};
    const departments = agencyConfig?.departments && typeof agencyConfig.departments === "object"
      ? agencyConfig.departments
      : {};

    const agentChecks = Object.entries(departments).map(([department, deptRaw]) => {
      const dept = (deptRaw && typeof deptRaw === "object" ? deptRaw : {}) as Record<string, any>;
      const backendChain = Array.isArray(dept.backend_chain)
        ? dept.backend_chain.map((v: unknown) => normalizeBackend(String(v)))
        : [];
      const primaryBackend = normalizeBackend(String(dept.backend || backendChain[0] || ""));
      const supportsMcp = backendSupportsMcp(primaryBackend) || backendChain.some(backendSupportsMcp);
      const canReach = supportsMcp ? canUseEnabledMcps : true;
      return {
        department,
        backend: primaryBackend,
        backendChain,
        supportsMcp,
        canReachEnabledMcps: canReach,
        reason: canReach
          ? "runtime has usable MCP path"
          : "no enabled MCP servers are currently usable from runtime",
      };
    });

    const subAgentChecks: Array<{
      department: string;
      id: string;
      model: string;
      backend: string;
      supportsMcp: boolean;
      canReachEnabledMcps: boolean;
      reason: string;
    }> = [];
    const subDepartments = subAgentsConfig?.departments && typeof subAgentsConfig.departments === "object"
      ? subAgentsConfig.departments
      : {};
    for (const [department, deptRaw] of Object.entries(subDepartments)) {
      const dept = (deptRaw && typeof deptRaw === "object" ? deptRaw : {}) as Record<string, any>;
      const subAgents = dept.sub_agents && typeof dept.sub_agents === "object" ? dept.sub_agents : {};
      for (const [id, subRaw] of Object.entries(subAgents)) {
        const sub = (subRaw && typeof subRaw === "object" ? subRaw : {}) as Record<string, any>;
        const model = String(sub.model || "");
        const backend = normalizeBackend(model);
        const supportsMcp = backendSupportsMcp(backend);
        const canReach = supportsMcp ? canUseEnabledMcps : true;
        subAgentChecks.push({
          department,
          id,
          model,
          backend,
          supportsMcp,
          canReachEnabledMcps: canReach,
          reason: canReach
            ? "runtime has usable MCP path"
            : "no enabled MCP servers are currently usable from runtime",
        });
      }
    }

    const enabledUsableNames = new Set(enabledUsable.map((c) => c.name));
    const cliMatrix = [
      { id: "codex", command: "codex" },
      { id: "opencode", command: "opencode" },
      { id: "claude-code", command: "claude" },
      { id: "gemini-cli", command: "gemini" },
      { id: "codebuff", command: "codebuff" },
      { id: "pi-mono", command: "pi" },
    ].map((cli) => {
      const installed = isExecutableOnPath(cli.command);
      const mcpProbe = probeCliMcpConfig(cli.id, cli.command);
      const configured = mcpProbe.configuredServerNames;
      const matchesEnabled = configured.filter((name) => enabledUsableNames.has(name));
      const piBridge = cli.id === "pi-mono" ? getPiBridgeState(enabledUsableNames) : null;
      const piBridgeMatches = piBridge ? piBridge.configured.filter((name) => enabledUsableNames.has(name)) : [];
      const coversAllEnabledWithoutExtraConfig =
        installed &&
        (
          (mcpProbe.mcpSupported &&
            enabledUsableNames.size > 0 &&
            matchesEnabled.length === enabledUsableNames.size) ||
          (cli.id === "pi-mono" && Boolean(piBridge?.ready))
        );
      const missingEnabled = cli.id === "pi-mono" && piBridge
        ? piBridge.missing
        : Array.from(enabledUsableNames).filter((name) => !configured.includes(name));
      const canReach = installed ? canUseEnabledMcps : false;
      let reason = "";
      if (!installed) reason = "CLI not found on PATH";
      else if (!mcpProbe.mcpSupported) reason = "CLI does not expose MCP config management";
      else if (configured.length === 0) reason = "CLI has no MCP servers configured (extra config required)";
      else if (matchesEnabled.length === 0) reason = "CLI MCP config does not include currently enabled YaSwarm MCPs";
      else if (missingEnabled.length > 0) reason = `CLI only has ${matchesEnabled.length}/${enabledUsableNames.size} enabled MCPs configured`;
      else reason = "CLI MCP config includes enabled YaSwarm MCPs";
      if (cli.id === "opencode" && !coversAllEnabledWithoutExtraConfig) {
        reason = "skipped with custom-formula guidance (interactive limitation)";
      }
      if (cli.id === "pi-mono" && !coversAllEnabledWithoutExtraConfig && !piBridge?.ready) {
        reason = "no autosync endpoint (by design), handled via collaboration guidance";
      }
      if (cli.id === "pi-mono" && piBridge?.ready) {
        reason = "bridge mode active via pi-yaswarm wrapper and shared MCP bridge config";
      }
      const customFormula =
        cli.id === "opencode"
          ? "Use OpenCode interactive MCP onboarding or API-level MCP routes."
          : cli.id === "gemini-cli"
          ? "Gemini auto-sync works for HTTP MCPs; stdio MCPs need manual custom formula."
          : cli.id === "pi-mono"
          ? "Activate debugger to build pi bridge mode (pi-yaswarm launcher + bridge config)."
          : cli.id === "codebuff"
          ? "No direct MCP registration command. Use shared runtime MCP access."
          : "";
      const autoSyncSupported = cli.id === "codex" || cli.id === "claude-code" || cli.id === "gemini-cli";
      return {
        id: cli.id,
        command: cli.command,
        installed,
        canReachEnabledMcps: canReach,
        mcpSupported: mcpProbe.mcpSupported,
        cliConfiguredMcpServers: cli.id === "pi-mono" && piBridge ? piBridge.configured : configured,
        enabledMcpMatches: cli.id === "pi-mono" && piBridge ? piBridgeMatches : matchesEnabled,
        missingEnabledMcpServers: missingEnabled,
        canReadEnabledMcpsWithoutExtraConfig: coversAllEnabledWithoutExtraConfig,
        enabledMcpCoverage: cli.id === "pi-mono" && piBridge
          ? piBridge.coverage
          : enabledUsableNames.size
          ? Number((matchesEnabled.length / enabledUsableNames.size).toFixed(3))
          : 0,
        needsCollaboration: !coversAllEnabledWithoutExtraConfig,
        customFormula,
        autoSyncSupported,
        probeCommand: mcpProbe.listCommand,
        probeNote: mcpProbe.note.slice(0, 500),
        reason,
      };
    });

    res.json({
      ok: true,
      summary: {
        enabledServers: checks.filter((c) => c.enabled).length,
        enabledHealthyServers: enabledHealthy.length,
        enabledUsableServers: enabledUsable.length,
        agentsChecked: agentChecks.length,
        agentsReachable: agentChecks.filter((a) => a.canReachEnabledMcps).length,
        subAgentsChecked: subAgentChecks.length,
        subAgentsReachable: subAgentChecks.filter((a) => a.canReachEnabledMcps).length,
        cliChecked: cliMatrix.length,
        cliReachable: cliMatrix.filter((c) => c.canReachEnabledMcps).length,
        cliMcpReadyWithoutExtraConfig: cliMatrix.filter((c) => c.canReadEnabledMcpsWithoutExtraConfig).length,
      },
      mcpChecks: checks.sort((a, b) => a.name.localeCompare(b.name)),
      agents: agentChecks.sort((a, b) => a.department.localeCompare(b.department)),
      subAgents: subAgentChecks.sort((a, b) =>
        a.department === b.department ? a.id.localeCompare(b.id) : a.department.localeCompare(b.department)
      ),
      cli: cliMatrix.sort((a, b) => a.id.localeCompare(b.id)),
      assumptions: [
        "Agent and sub-agent MCP access is evaluated from shared runtime config/environment.",
        "CLI reachability requires binary installed and at least one enabled MCP server usable in runtime.",
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to run MCP access audit", detail: message });
  }
});

router.post("/mcp/cli/sync", async (req: Request, res: Response): Promise<void> => {
  try {
    const cliId = String(req.body?.cliId || "").trim();
    if (!cliId) {
      res.status(400).json({ error: "Missing cliId" });
      return;
    }
    const supported = new Set(["codex", "claude-code", "gemini-cli", "opencode"]);
    if (!supported.has(cliId)) {
      res.status(400).json({ error: "Unsupported CLI for MCP collaboration sync", cliId });
      return;
    }

    const config = readYaswarmMcpConfig();
    const servers = (config?.servers && typeof config.servers === "object" ? config.servers : {}) as Record<string, any>;
    const checks = await runMcpDoctorChecks(config);
    const enabledUsableNames = new Set(
      checks.filter((c) => c.enabled && c.status !== "error").map((c) => c.name)
    );

    const envMap = parseEnvFile(resolveEnvFilePath());
    const envBag: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (typeof v === "string") envBag[k] = v;
    }
    for (const [k, v] of envMap.entries()) envBag[k] = v;

    const results: Array<{ serverName: string; synced: boolean; skipped?: string; detail?: string }> = [];

    for (const [serverName, rawConfig] of Object.entries(servers)) {
      if (!enabledUsableNames.has(serverName)) continue;
      const cmdSet = buildCliSyncCommands(cliId, serverName, rawConfig as Record<string, any>, envBag);
      if (cmdSet.skipped) {
        results.push({ serverName, synced: false, skipped: cmdSet.skipped });
        continue;
      }
      if (cmdSet.removeCmd) runShell(cmdSet.removeCmd, 9000);
      if (!cmdSet.addCmd) {
        results.push({ serverName, synced: false, skipped: "No add command generated" });
        continue;
      }
      const run = runShell(cmdSet.addCmd, 12000);
      results.push({
        serverName,
        synced: run.ok,
        detail: run.ok
          ? "Synced"
          : [run.stdout, run.stderr].filter(Boolean).join("\n").slice(0, 300) || `Exit ${run.code}`,
      });
    }

    res.json({
      ok: true,
      cliId,
      total: results.length,
      synced: results.filter((r) => r.synced).length,
      skipped: results.filter((r) => !r.synced && r.skipped).length,
      failed: results.filter((r) => !r.synced && !r.skipped).length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to run CLI MCP collaboration sync", detail: message });
  }
});

router.post("/mcp/cli/debug-fix", async (req: Request, res: Response): Promise<void> => {
  try {
    const cliId = String(req.body?.cliId || "").trim();
    const note = String(req.body?.note || "").trim();
    const provider = String(req.body?.provider || "glm");
    const model = String(req.body?.model || "GLM-4.7");
    if (!cliId) {
      res.status(400).json({ error: "Missing cliId" });
      return;
    }

    const config = readYaswarmMcpConfig();
    const servers = (config?.servers && typeof config.servers === "object" ? config.servers : {}) as Record<string, any>;
    const checks = await runMcpDoctorChecks(config);
    const enabledUsableNames = new Set(
      checks.filter((c) => c.enabled && c.status !== "error").map((c) => c.name)
    );
    const envMap = parseEnvFile(resolveEnvFilePath());
    const envBag: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (typeof v === "string") envBag[k] = v;
    }
    for (const [k, v] of envMap.entries()) envBag[k] = v;

    const diagnostics: string[] = [];
    diagnostics.push(`debugger=${provider}/${model}`);
    if (note) diagnostics.push(`note=${note.slice(0, 200)}`);

    if (cliId === "opencode") {
      const opencodeConfigPath = "/root/.config/opencode/opencode.json";
      const before = loadJsonObject(opencodeConfigPath);
      const next = { ...before };
      const currentMcp = (next.mcp && typeof next.mcp === "object") ? next.mcp as Record<string, any> : {};
      next.mcp = { ...currentMcp };

      for (const [serverName, rawServer] of Object.entries(servers)) {
        if (!enabledUsableNames.has(serverName)) continue;
        const server = (rawServer && typeof rawServer === "object") ? rawServer as Record<string, any> : {};
        const url = String(server.url || "").trim();
        if (url) {
          (next.mcp as Record<string, any>)[serverName] = {
            type: "remote",
            url,
          };
          continue;
        }
        const command = String(server.command || "").trim();
        const args = Array.isArray(server.args) ? server.args.map((v: unknown) => String(v)) : [];
        const environment: Record<string, string> = {};
        if (server.env && typeof server.env === "object") {
          for (const [k, v] of Object.entries(server.env as Record<string, unknown>)) {
            const resolved = resolvePlaceholderValue(String(v || ""), envBag);
            if (resolved) environment[k] = resolved;
          }
        }
        if (!command) continue;
        const cfg: Record<string, any> = {
          type: "local",
          command: [command, ...args],
        };
        if (Object.keys(environment).length > 0) cfg.environment = environment;
        (next.mcp as Record<string, any>)[serverName] = cfg;
      }

      if (existsSync(opencodeConfigPath)) {
        const backupPath = `${opencodeConfigPath}.bak-${Date.now()}`;
        writeFileSync(backupPath, readFileSync(opencodeConfigPath, "utf-8"), "utf-8");
        diagnostics.push(`backup=${backupPath}`);
      }
      writeJsonObject(opencodeConfigPath, next);
      const verify = runShell("opencode mcp list", 15000);
      const merged = [verify.stdout, verify.stderr].filter(Boolean).join("\n");
      const fixed = !/No MCP servers configured/i.test(merged);
      res.json({
        ok: true,
        cliId,
        fixed,
        action: "updated_opencode_config_mcp_entries",
        details: fixed
          ? "OpenCode MCP entries were injected from enabled YaSwarm MCP config."
          : "OpenCode config was updated, but MCP list still not ready. Check opencode logs.",
        diagnostics: diagnostics.concat(`verify=${merged.slice(0, 240)}`),
        instruction: fixed
          ? "Debugger finished. Reload MCP tab and run Runtime Access Audit again."
          : "Debugger attempted fix. Reload and try again; if still failing, open collaboration details.",
      });
      return;
    }

    const autoSyncResults: Array<{ serverName: string; synced: boolean; skipped?: string; detail?: string }> = [];
    let runnableAutoSyncTargets = 0;
    for (const [serverName, rawConfig] of Object.entries(servers)) {
      if (!enabledUsableNames.has(serverName)) continue;
      const cmdSet = buildCliSyncCommands(cliId, serverName, rawConfig as Record<string, any>, envBag);
      if (cmdSet.skipped) {
        autoSyncResults.push({ serverName, synced: false, skipped: cmdSet.skipped });
        continue;
      }
      if (!cmdSet.addCmd) {
        autoSyncResults.push({ serverName, synced: false, skipped: "No add command generated" });
        continue;
      }
      runnableAutoSyncTargets += 1;
      if (cmdSet.removeCmd) runShell(cmdSet.removeCmd, 9000);
      const run = runShell(cmdSet.addCmd, 12000);
      autoSyncResults.push({
        serverName,
        synced: run.ok,
        detail: run.ok
          ? "Synced"
          : [run.stdout, run.stderr].filter(Boolean).join("\n").slice(0, 300) || `Exit ${run.code}`,
      });
    }

    if (runnableAutoSyncTargets > 0) {
      const total = autoSyncResults.length;
      const synced = autoSyncResults.filter((r) => r.synced).length;
      const skipped = autoSyncResults.filter((r) => !r.synced && r.skipped).length;
      const failed = autoSyncResults.filter((r) => !r.synced && !r.skipped).length;
      const fixed = total > 0 && failed === 0 && skipped === 0 && synced === total;

      res.json({
        ok: true,
        cliId,
        fixed,
        action: "auto_synced_enabled_mcps",
        details: `Debugger executed MCP sync (${synced}/${total} synced, ${skipped} skipped, ${failed} failed).`,
        diagnostics: diagnostics.concat([
          `provider=${provider}`,
          `model=${model}`,
          `total=${total}`,
          `synced=${synced}`,
          `skipped=${skipped}`,
          `failed=${failed}`,
        ]),
        results: autoSyncResults,
        instruction: fixed
          ? "Debugger synced all enabled MCPs. Reload MCP tab and run Runtime Access Audit again."
          : "Debugger applied best effort sync. Reload MCP tab and review collaboration results.",
      });
      return;
    }

    if (cliId === "pi-mono") {
      const enabledServers = Array.from(enabledUsableNames).sort((a, b) => a.localeCompare(b));
      const bridgePayload = {
        generatedAt: new Date().toISOString(),
        strategy: "shared-runtime-bridge",
        sourceConfigPath: resolveMcpConfigPath(),
        enabledServers,
        servers: enabledServers.reduce<Record<string, any>>((acc, name) => {
          const s = servers[name] || {};
          acc[name] = {
            transport: s.transport || (s.url ? "http" : "stdio"),
            url: s.url || null,
            command: s.command || null,
            args: Array.isArray(s.args) ? s.args : [],
          };
          return acc;
        }, {}),
      };
      const dir = path.dirname(PI_BRIDGE_FILE);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeJsonObject(PI_BRIDGE_FILE, bridgePayload);

      const wrapper = `#!/usr/bin/env bash
set -e
export YASWARM_MCP_BRIDGE_PATH=${shellQuote(PI_BRIDGE_FILE)}
echo "[YaSwarm] PI MCP bridge: $YASWARM_MCP_BRIDGE_PATH" >&2
exec pi "$@"
`;
      const wdir = path.dirname(PI_WRAPPER_PATH);
      if (!existsSync(wdir)) mkdirSync(wdir, { recursive: true });
      writeFileSync(PI_WRAPPER_PATH, wrapper, "utf-8");
      chmodSync(PI_WRAPPER_PATH, 0o755);

      res.json({
        ok: true,
        cliId,
        fixed: true,
        action: "activated_pi_bridge_mode",
        details: "Generated pi bridge config and installed pi-yaswarm launcher for shared MCP runtime mode.",
        diagnostics: diagnostics.concat([
          `bridge=${PI_BRIDGE_FILE}`,
          `launcher=${PI_WRAPPER_PATH}`,
          `enabledServers=${enabledServers.length}`,
        ]),
        instruction:
          "Debugger applied bridge mode. Reload MCP tab, run Runtime Access Audit again, and use `pi-yaswarm` for bridged runs.",
      });
      return;
    }

    const sync = runShell(`echo "${cliId}"`, 1000);
    res.json({
      ok: true,
      cliId,
      fixed: false,
      action: "no_special_debugger",
      details: "No specialized debugger routine for this CLI",
      diagnostics: diagnostics.concat(`syncProbe=${sync.ok}`),
      instruction: "Run auto-sync from collaboration panel and retry.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to run CLI debugger fix", detail: message });
  }
});

router.use("/mcp/inspector", (_req: Request, res: Response): void => {
  res.status(410).json({
    error: "MCP Inspector has been removed from Agency UI",
    replacement: "/api/mcp/doctor",
  });
});

/**
 * GET /api/mcp/env
 * Return masked env keys from MCP env file.
 */
router.get("/mcp/env", (_req: Request, res: Response): void => {
  try {
    const envPath = resolveEnvFilePath();
    const config = readYaswarmMcpConfig();
    const referencedKeys = collectReferencedMcpApiKeys(config);
    const filteredEntries = listEnvEntries(envPath).filter((entry) =>
      referencedKeys.has(entry.key)
    );
    res.json({
      path: envPath,
      exists: existsSync(envPath),
      isSharedApiKeysFile: isSharedApiKeysFile(envPath),
      entries: filteredEntries,
      expectedKeys: Array.from(referencedKeys).sort((a, b) => a.localeCompare(b)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to read MCP env keys", detail: message });
  }
});

/**
 * PUT /api/mcp/env
 * Upsert env key/value for MCP servers.
 */
router.put("/mcp/env", (req: Request, res: Response): void => {
  try {
    const key = String(req.body?.key || "").trim();
    const value = String(req.body?.value ?? "");
    if (!key) {
      res.status(400).json({ error: "Missing key" });
      return;
    }
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      res.status(400).json({
        error: "Invalid key format (use A-Z, 0-9, underscore; must start with A-Z or _)",
      });
      return;
    }

    const config = readYaswarmMcpConfig();
    const referencedKeys = collectReferencedMcpApiKeys(config);
    if (referencedKeys.size > 0 && !referencedKeys.has(key)) {
      res.status(400).json({
        error: "Key is not a referenced MCP API key/token",
        allowedKeys: Array.from(referencedKeys).sort((a, b) => a.localeCompare(b)),
      });
      return;
    }

    const envPath = resolveEnvFilePath();
    if (isSharedApiKeysFile(envPath)) {
      res.status(400).json({
        error: "MCP key edits are disabled for shared /root/agency.env. Use the API Keys tab.",
      });
      return;
    }
    upsertEnvFileKey(envPath, key, value);

    res.json({
      ok: true,
      key,
      path: envPath,
      maskedValue: maskSecret(value),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to write MCP env key", detail: message });
  }
});

export default router;
