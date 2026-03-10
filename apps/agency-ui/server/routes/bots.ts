import { Router, Request, Response } from "express";
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";

const router = Router();
const AGENCY_CONFIG_PATH = path.join(AGENCY_ROOT, "config", "agency-config.json");
const AGENT_REGISTRY_PATH = path.join(AGENCY_ROOT, "config", "agent-registry.json");
const AGENCY_ENV_PATH = path.join(AGENCY_ROOT, ".env");
const DEPT_SUB_AGENTS_PATH = path.join(AGENCY_ROOT, "config", "department-sub-agents.json");
const AGENCY_SKILLS_ROOT = path.join(AGENCY_ROOT, "skills");
const SKILLS_CATALOG_ROOT =
  process.env.YASWARM_SKILLS_CATALOG_ROOT || "/root/yaswarm-swarm/projects/yaswarm-skills-cataloge";
const SKILLS_CATALOG_SKILLS_DIR = path.join(SKILLS_CATALOG_ROOT, "catalog", "skills");
const SKILLS_CATALOG_DEPT_MAP_PATH = path.join(
  SKILLS_CATALOG_ROOT,
  "catalog",
  "skill-system",
  "registry",
  "department-skill-recommendations.json"
);
const MCP_CATALOG_ROOT =
  process.env.YASWARM_MCPS_CATALOG_ROOT || "/root/yaswarm-swarm/projects/yaswarm-mcps-cataloge";
const MCP_CATALOG_PATH = path.join(MCP_CATALOG_ROOT, "imports", "agency", "mcp-catalog.json");
const MCP_DEPT_MAP_PATH = path.join(
  MCP_CATALOG_ROOT,
  "imports",
  "agency",
  "department-mcp-recommendations.json"
);
const MODEL_CATALOG_PATH = path.join(AGENCY_ROOT, "config", "model-catalog.json");
const OPENCODE_AUTH_PATH =
  process.env.YASWARM_OPENCODE_AUTH_PATH ||
  "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/.cli-home/opencode/share/auth.json";
const OPENCODE_MODELS_CACHE_PATH =
  process.env.YASWARM_OPENCODE_MODELS_CACHE_PATH ||
  "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/.cli-home/opencode/cache/models.json";

type AgencyConfig = {
  ceo?: {
    departments?: string[];
    [k: string]: any;
  };
  departments?: Record<string, any>;
  updated_at?: string;
  [k: string]: any;
};

type PackageManager = "npm" | "apk" | "apt" | "brew" | "unknown";

type ToolSpec = {
  id: string;
  label: string;
  kind: "cli" | "runtime";
  binary: string;
  binaryAliases?: string[];
  npmPackage?: string;
  backendKey?: string;
  description?: string;
  install?: Partial<Record<Exclude<PackageManager, "unknown">, string>>;
  update?: Partial<Record<Exclude<PackageManager, "unknown">, string>>;
  versionCmd?: string;
  authCmd?: string;
  connectHint?: string;
};

const BACKEND_TOOLS: ToolSpec[] = [
  {
    id: "pi-mono",
    label: "Pi Mono CLI",
    kind: "cli",
    binary: "pi",
    binaryAliases: ["pi", "pi-mono"],
    npmPackage: "@mariozechner/pi-coding-agent",
    backendKey: "pi-mono",
    description: "Pi-based coding CLI backend",
    install: { npm: "npm i -g @mariozechner/pi-coding-agent" },
    update: { npm: "npm update -g @mariozechner/pi-coding-agent" },
    versionCmd: "pi --version",
    authCmd:
      "grep -Eqs '^(GEMINI_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|ZAI_API_KEY|OPENCODE_API_KEY|AI_GATEWAY_API_KEY)=.+' /root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency/.env /root/agency.env 2>/dev/null",
    connectHint: "Run `pi`, then `/login`, then `/model` to select provider/model.",
  },
  {
    id: "opencode",
    label: "OpenCode CLI",
    kind: "cli",
    binary: "opencode",
    binaryAliases: ["opencode"],
    npmPackage: "opencode-ai",
    backendKey: "opencode",
    description: "OpenCode backend for department heads",
    install: { npm: "npm i -g opencode-ai" },
    update: { npm: "npm update -g opencode-ai" },
    versionCmd: "opencode --version",
    authCmd: "opencode auth list 2>/dev/null | grep -Eq '[1-9][0-9]* credentials'",
  },
  {
    id: "codex",
    label: "OpenAI Codex CLI",
    kind: "cli",
    binary: "codex",
    binaryAliases: ["codex"],
    npmPackage: "@openai/codex",
    backendKey: "codex",
    description: "Codex CLI backend",
    install: { npm: "npm i -g @openai/codex" },
    update: { npm: "npm update -g @openai/codex" },
    versionCmd: "codex --version",
    authCmd: "codex login status",
    connectHint: "Run `codex login` and then `/connect` in CLI.",
  },
  {
    id: "claude-code",
    label: "Claude Code CLI",
    kind: "cli",
    binary: "claude",
    binaryAliases: ["claude", "claude-code"],
    npmPackage: "@anthropic-ai/claude-code",
    backendKey: "claude-code",
    description: "Anthropic Claude Code backend",
    install: { npm: "npm i -g @anthropic-ai/claude-code" },
    update: { npm: "npm update -g @anthropic-ai/claude-code" },
    versionCmd: "claude --version",
    authCmd: "claude auth status",
    connectHint: "Run `claude auth login` and provider setup in Terminal.",
  },
  {
    id: "gemini-cli",
    label: "Gemini CLI",
    kind: "cli",
    binary: "gemini",
    binaryAliases: ["gemini", "gemini-cli"],
    npmPackage: "@google/gemini-cli",
    backendKey: "gemini-cli",
    description: "Google Gemini backend",
    install: { npm: "npm i -g @google/gemini-cli" },
    update: { npm: "npm update -g @google/gemini-cli" },
    versionCmd: "gemini --version",
    authCmd: "test -s /root/.gemini/oauth_creds.json || test -n \"$GEMINI_API_KEY\"",
  },
  {
    id: "codebuff",
    label: "Codebuff CLI",
    kind: "cli",
    binary: "codebuff",
    binaryAliases: ["codebuff"],
    npmPackage: "codebuff",
    backendKey: "codebuff",
    description: "Codebuff coding backend",
    install: { npm: "npm i -g codebuff" },
    update: { npm: "npm update -g codebuff" },
    versionCmd: "codebuff --version",
  },
  {
    id: "nodejs",
    label: "Node.js Runtime",
    kind: "runtime",
    binary: "node",
    description: "Required for npm-based AI CLIs",
    install: {
      apk: "apk add --no-cache nodejs npm",
      apt: "apt-get update && apt-get install -y nodejs npm",
      brew: "brew install node",
    },
    update: {
      apk: "apk upgrade --no-cache nodejs npm",
      apt: "apt-get update && apt-get install -y --only-upgrade nodejs npm",
      brew: "brew upgrade node",
    },
    versionCmd: "node -v && npm -v",
  },
  {
    id: "python3",
    label: "Python 3",
    kind: "runtime",
    binary: "python3",
    description: "General scripting/runtime dependency",
    install: {
      apk: "apk add --no-cache python3 py3-pip",
      apt: "apt-get update && apt-get install -y python3 python3-pip",
      brew: "brew install python",
    },
    update: {
      apk: "apk upgrade --no-cache python3 py3-pip",
      apt: "apt-get update && apt-get install -y --only-upgrade python3 python3-pip",
      brew: "brew upgrade python",
    },
    versionCmd: "python3 --version",
  },
  {
    id: "github-cli",
    label: "GitHub CLI",
    kind: "runtime",
    binary: "gh",
    description: "GitHub command-line tooling",
    install: {
      apk: "apk add --no-cache github-cli",
      apt: "apt-get update && apt-get install -y gh",
      brew: "brew install gh",
    },
    update: {
      apk: "apk upgrade --no-cache github-cli",
      apt: "apt-get update && apt-get install -y --only-upgrade gh",
      brew: "brew upgrade gh",
    },
    versionCmd: "gh --version | head -n 1",
  },
];

type GlmModelCatalogEntry = {
  id: string;
  family: "language" | "vision-language" | "image" | "video" | "audio";
  capabilities: string[];
};

const GLM_MODEL_CATALOG: GlmModelCatalogEntry[] = [
  { id: "GLM-5", family: "language", capabilities: ["thinking", "deep-thinking", "streaming", "function-calling", "structured-output", "context-caching"] },
  { id: "GLM-4.7", family: "language", capabilities: ["thinking", "deep-thinking", "streaming", "function-calling", "structured-output", "context-caching"] },
  { id: "GLM-4.6", family: "language", capabilities: ["thinking", "streaming", "function-calling", "structured-output", "context-caching"] },
  { id: "GLM-4.5", family: "language", capabilities: ["thinking", "streaming", "function-calling", "structured-output", "context-caching"] },
  { id: "GLM-4-32B-0414-128K", family: "language", capabilities: ["streaming", "function-calling", "structured-output", "context-caching"] },
  { id: "GLM-4.6V", family: "vision-language", capabilities: ["thinking", "streaming"] },
  { id: "GLM-OCR", family: "vision-language", capabilities: ["ocr", "streaming"] },
  { id: "AutoGLM-Phone-Multilingual", family: "vision-language", capabilities: ["agentic", "multilingual", "streaming"] },
  { id: "GLM-4.5V", family: "vision-language", capabilities: ["thinking", "streaming"] },
  { id: "GLM-Image", family: "image", capabilities: ["image-generation"] },
  { id: "CogView-4", family: "image", capabilities: ["image-generation"] },
  { id: "CogVideoX-3", family: "video", capabilities: ["video-generation"] },
  { id: "Vidu Q1", family: "video", capabilities: ["video-generation"] },
  { id: "Vidu 2", family: "video", capabilities: ["video-generation"] },
  { id: "GLM-ASR-2512", family: "audio", capabilities: ["speech-to-text"] },
];

const CLOSED_BACKEND_MODELS: Record<string, string[]> = {
  codex: [
    "gpt-5",
    "gpt-5-mini",
    "gpt-4.1",
    "o3",
    "o4-mini",
  ],
  "claude-code": [
    "claude-opus-4.1",
    "claude-sonnet-4",
    "claude-haiku-3.5",
  ],
  "gemini-cli": [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ],
  glm: GLM_MODEL_CATALOG.map((m) => m.id),
};

function readAgencyConfig(): AgencyConfig {
  if (!existsSync(AGENCY_CONFIG_PATH)) {
    throw new Error("agency-config.json not found");
  }
  return JSON.parse(readFileSync(AGENCY_CONFIG_PATH, "utf-8"));
}

function writeAgencyConfig(data: AgencyConfig): void {
  writeFileSync(AGENCY_CONFIG_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

function safeReadJson(filePath: string): any {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function safeWriteJson(filePath: string, payload: any): void {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function runShell(command: string, timeoutMs = 20_000): {
  ok: boolean;
  code: number;
  stdout: string;
  stderr: string;
} {
  const npmPrefix = String(process.env.NPM_CONFIG_PREFIX || "").trim();
  const npmBin = npmPrefix ? path.join(npmPrefix, "bin") : "";
  const basePath = String(process.env.PATH || "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin");
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

function detectPackageManager(): PackageManager {
  if (runShell("command -v npm").ok) return "npm";
  if (runShell("command -v apk").ok) return "apk";
  if (runShell("command -v apt-get").ok) return "apt";
  if (runShell("command -v brew").ok) return "brew";
  return "unknown";
}

function pickToolCommand(
  tool: ToolSpec,
  action: "install" | "update",
  packageManager: PackageManager
): string | null {
  const commandMap = action === "install" ? tool.install : tool.update;
  if (!commandMap) return null;

  if (packageManager !== "unknown" && commandMap[packageManager]) {
    return commandMap[packageManager] || null;
  }
  return commandMap.npm || commandMap.apk || commandMap.apt || commandMap.brew || null;
}

function getBackendToolStatus(tool: ToolSpec, packageManager: PackageManager): any {
  const aliases = Array.from(new Set([tool.binary, ...(tool.binaryAliases || [])]));
  const pathCheck = aliases
    .map((alias) => ({ alias, check: runShell(`command -v ${alias}`) }))
    .find((entry) => entry.check.ok) || null;
  const npmCheck =
    tool.npmPackage && runShell("command -v npm").ok
      ? runShell(
          `npm ls -g --depth=0 --json "${tool.npmPackage}" | node -e 'let s=\"\";process.stdin.on(\"data\",d=>s+=d);process.stdin.on(\"end\",()=>{try{const j=JSON.parse(s||\"{}\");const d=j.dependencies||{};const p=d[process.argv[1]];if(p&&p.version){console.log(p.version);process.exit(0)}process.exit(1)}catch{process.exit(1)}})' "${tool.npmPackage}"`
        )
      : null;

  const detected = Boolean(pathCheck?.check.ok || npmCheck?.ok);
  const binaryResolved = pathCheck?.alias || tool.binary;
  const versionResult = detected
    ? (pathCheck?.check.ok
        ? runShell(tool.versionCmd || `${binaryResolved} --version`)
        : npmCheck && npmCheck.ok
        ? { ok: true, code: 0, stdout: `npm:${npmCheck.stdout}`, stderr: "" }
        : null)
    : null;
  const runnable = detected && (versionResult ? versionResult.ok : true);
  const installed = detected && runnable;
  const authResult = installed && tool.authCmd && pathCheck?.check.ok ? runShell(tool.authCmd) : null;
  const installCommand = pickToolCommand(tool, "install", packageManager);
  const updateCommand = pickToolCommand(tool, "update", packageManager);
  const detectionSource = pathCheck?.check.ok
    ? `path:${binaryResolved}`
    : npmCheck?.ok
    ? `npm-global:${tool.npmPackage}`
    : "not-found";

  return {
    id: tool.id,
    label: tool.label,
    kind: tool.kind,
    description: tool.description || "",
    binary: tool.binary,
    backendKey: tool.backendKey || null,
    installed,
    detected,
    runnable,
    version: versionResult?.stdout || null,
    versionError: versionResult && !versionResult.ok ? versionResult.stderr || versionResult.stdout : null,
    authConnected: authResult ? authResult.ok : null,
    authDetails: authResult?.stdout || authResult?.stderr || null,
    installCommand,
    updateCommand,
    connectHint: tool.connectHint || null,
    detectionSource,
    checkedAliases: aliases,
    runtimeContext: "yaswarm-agency-ui dashboard runtime",
  };
}

function normalizeBackendKey(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function resolveToolByBackend(rawBackend: string): ToolSpec | null {
  const backend = normalizeBackendKey(rawBackend);
  const alias: Record<string, string> = {
    claude: "claude-code",
    "claude-cli": "claude-code",
    gemini: "gemini-cli",
    "gemini-code": "gemini-cli",
    "pi": "pi-mono",
    "pi-mono": "pi-mono",
    custom: "",
    glm: "",
  };
  const target = alias[backend] !== undefined ? alias[backend] : backend;
  if (!target) return null;
  return BACKEND_TOOLS.find((t) => t.backendKey === target || t.id === target) || null;
}

function listConnectedProvidersFromCatalog(): Array<{ id: string; name: string; connected: boolean; models: string[] }> {
  const modelCatalog = safeReadJson(MODEL_CATALOG_PATH) || {};
  const providersObj = modelCatalog?.providers || {};
  const providers: Array<{ id: string; name: string; connected: boolean; models: string[] }> = [];

  for (const [id, raw] of Object.entries(providersObj)) {
    const provider = raw as any;
    const models = Array.isArray(provider?.models)
      ? provider.models.map((m: any) => String(m)).filter(Boolean)
      : [];
    providers.push({
      id,
      name: String(provider?.name || id),
      connected: Boolean(provider?.connected !== false),
      models,
    });
  }
  return providers;
}

function readEnvKeys(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, "utf-8");
  const output: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2] || "";
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    output[key] = val.trim();
  }
  return output;
}

function inferProviderConnectionsFromEnv(): Array<{ id: string; name: string; connected: boolean; models: string[] }> {
  const agencyEnv = readEnvKeys(AGENCY_ENV_PATH);
  const rootEnv = readEnvKeys("/root/agency.env");
  const merged = { ...rootEnv, ...agencyEnv };

  const providerHints: Array<{ id: string; label: string; envKeys: string[]; models: string[] }> = [
    {
      id: "openai",
      label: "OpenAI",
      envKeys: ["OPENAI_API_KEY", "YASWARM_OPENAI_API_KEY"],
      models: ["gpt-5", "gpt-5-mini", "o4-mini"],
    },
    {
      id: "anthropic",
      label: "Anthropic",
      envKeys: ["ANTHROPIC_API_KEY", "YASWARM_ANTHROPIC_API_KEY"],
      models: ["claude-opus-4.1", "claude-sonnet-4"],
    },
    {
      id: "google",
      label: "Google Gemini",
      envKeys: ["GOOGLE_API_KEY", "GEMINI_API_KEY", "YASWARM_GOOGLE_API_KEY"],
      models: ["gemini-2.5-pro", "gemini-2.5-flash"],
    },
    {
      id: "zai",
      label: "Z.AI / GLM",
      envKeys: ["ZAI_API_KEY", "YASWARM_ZAI_API_KEY"],
      models: ["GLM-4.7", "GLM-5"],
    },
  ];

  return providerHints
    .filter((p) => p.envKeys.some((k) => Boolean(merged[k])))
    .map((p) => ({
      id: p.id,
      name: p.label,
      connected: true,
      models: p.models,
    }));
}

function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function titleCase(input: string): string {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
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

function parseOpenCodeAuth(filePath: string): Record<string, any> {
  if (!existsSync(filePath)) return {};
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf-8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function derivePiEnvFromOpenCodeAuth(auth: Record<string, any>): Array<{ key: string; value: string; source: string }> {
  const mappings: Array<{ key: string; value: string; source: string }> = [];
  const push = (key: string, value: unknown, source: string): void => {
    const val = String(value || "").trim();
    if (!val) return;
    mappings.push({ key, value: val, source });
  };

  push("GEMINI_API_KEY", auth?.google?.key, "opencode:google.key");
  push("ZAI_API_KEY", auth?.["zai-coding-plan"]?.key, "opencode:zai-coding-plan.key");
  push("OPENCODE_API_KEY", auth?.opencode?.key, "opencode:opencode.key");
  if (!String(auth?.opencode?.key || "").trim()) {
    push("OPENCODE_API_KEY", auth?.["opencode-go"]?.key, "opencode:opencode-go.key");
  }
  push("AI_GATEWAY_API_KEY", auth?.["cloudflare-ai-gateway"]?.key, "opencode:cloudflare-ai-gateway.key");

  return mappings;
}

type ModelOption = {
  id: string;
  providerId: string;
  providerName: string;
  isFree: boolean | null;
};

function isZeroCostObject(cost: any): boolean | null {
  if (!cost || typeof cost !== "object") return null;
  const numericValues = Object.values(cost).filter((v) => typeof v === "number") as number[];
  if (numericValues.length === 0) return null;
  return numericValues.every((n) => Number(n) === 0);
}

function listOpenCodeModelOptionsFromCache(): ModelOption[] {
  const raw = safeReadJson(OPENCODE_MODELS_CACHE_PATH);
  if (!raw || typeof raw !== "object") return [];
  const out: ModelOption[] = [];
  for (const [providerId, providerRaw] of Object.entries(raw as Record<string, any>)) {
    const provider = providerRaw as any;
    const providerName = String(provider?.name || providerId);
    const modelsObj = provider?.models || {};
    if (!modelsObj || typeof modelsObj !== "object") continue;
    for (const [modelId, modelRaw] of Object.entries(modelsObj as Record<string, any>)) {
      const model = modelRaw as any;
      const id = String(model?.id || modelId).trim();
      if (!id) continue;
      out.push({
        id,
        providerId: String(providerId),
        providerName,
        isFree: isZeroCostObject(model?.cost),
      });
    }
  }
  return out;
}

function syncLocalAgents(agencyConfig: AgencyConfig): { synced: Array<{ department: string; status: string; agentId?: string }>; totalAgents: number; registry: string } {
  const departments = agencyConfig.departments || {};
  const deptIds = Object.keys(departments).sort();

  let registry: any = {
    version: "1.0.0",
    updated_at: new Date().toISOString(),
    source: AGENCY_CONFIG_PATH,
    agents: {},
  };

  if (existsSync(AGENT_REGISTRY_PATH)) {
    try {
      registry = JSON.parse(readFileSync(AGENT_REGISTRY_PATH, "utf-8"));
    } catch {
      // Keep default registry.
    }
  }

  const agents = registry.agents || {};
  const synced: Array<{ department: string; status: string; agentId?: string }> = [];

  for (const deptId of deptIds) {
    const workspace = path.join(AGENCY_ROOT, "agents", "departments", deptId);
    if (!existsSync(workspace)) {
      mkdirSync(workspace, { recursive: true });
      synced.push({ department: deptId, status: "created", agentId: deptId });
    } else {
      synced.push({ department: deptId, status: "exists", agentId: deptId });
    }

    agents[deptId] = {
      id: deptId,
      workspace,
      managed_by: "yaswarm",
      status: "ready",
    };
  }

  agents.main = {
    id: "main",
    workspace: AGENCY_ROOT,
    managed_by: "yaswarm",
    status: "ready",
  };

  const allowed = new Set(["main", ...deptIds]);
  for (const key of Object.keys(agents)) {
    if (!allowed.has(key)) delete agents[key];
  }

  registry.agents = agents;
  registry.updated_at = new Date().toISOString();
  registry.source = AGENCY_CONFIG_PATH;
  writeFileSync(AGENT_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, "utf-8");

  return {
    synced,
    totalAgents: Object.keys(agents).length,
    registry: AGENT_REGISTRY_PATH,
  };
}

function detectBusinessTags(text: string): string[] {
  const source = text.toLowerCase();
  const tags = new Set<string>(["general"]);
  const addIf = (pattern: RegExp, tag: string) => {
    if (pattern.test(source)) tags.add(tag);
  };

  addIf(/app|product|saas|platform|software|mobile|web/, "software");
  addIf(/film|movie|cinema|studio|production|vfx/, "film");
  addIf(/book|publisher|publishing|editorial|author|novel/, "publishing");
  addIf(/agency|marketing|brand|campaign|growth/, "marketing");
  addIf(/research|analysis|intelligence|insight/, "research");
  addIf(/ops|operation|support|service|customer/, "operations");
  addIf(/finance|legal|compliance|security/, "governance");

  return Array.from(tags);
}

function listCatalogSkillIds(): string[] {
  if (!existsSync(SKILLS_CATALOG_SKILLS_DIR)) return [];
  try {
    return readdirSync(SKILLS_CATALOG_SKILLS_DIR, { withFileTypes: true })
      .filter((d: any) => d.isDirectory())
      .map((d: any) => d.name);
  } catch {
    return [];
  }
}

function scoreSkills(skillIds: string[], tags: string[], deptId: string): string[] {
  const keywordMap: Record<string, string[]> = {
    software: ["dev", "frontend", "backend", "coding", "mcp-builder", "compliance"],
    film: ["filmmaking", "video", "canvas", "image", "storyboard"],
    publishing: ["writing", "editor", "book", "manuscript", "publishing"],
    marketing: ["marketing", "pitch", "content", "campaign"],
    research: ["research", "digest", "auditor", "analyzer"],
    operations: ["ops", "planner", "tracker", "reminders", "healthcheck"],
    governance: ["legal", "finance", "compliance", "governor"],
    general: ["project", "status", "notes", "assistant-core"],
  };

  const loweredDept = deptId.toLowerCase();
  const scored = skillIds
    .map((id) => {
      let score = 0;
      if (id.includes(loweredDept)) score += 8;
      for (const tag of tags) {
        for (const kw of keywordMap[tag] || []) {
          if (id.includes(kw)) score += 2;
        }
      }
      return { id, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.id);

  return Array.from(new Set(scored));
}

function suggestMcps(tags: string[]): string[] {
  const mcpCatalog = safeReadJson(MCP_CATALOG_PATH);
  const servers = new Set(Object.keys(mcpCatalog?.servers || {}));
  const preferred: string[] = [];

  const add = (id: string) => {
    if (servers.has(id) && !preferred.includes(id)) preferred.push(id);
  };

  add("context7");
  add("web-search-prime");
  add("web-reader");
  add("zread");

  if (tags.includes("software")) {
    add("github");
    add("chrome-devtools");
    add("filesystem");
  }
  if (tags.includes("research")) {
    add("notebooklm");
    add("brave-search");
  }
  if (tags.includes("operations")) {
    add("tremcp-ssh");
    add("memory");
  }
  if (tags.includes("film") || tags.includes("publishing")) {
    add("zai-mcp-server");
  }

  return preferred;
}

function ensureGeneratedSkill(
  departmentId: string,
  prettyName: string,
  companyReference: string,
  recommendedMcps: string[]
): string {
  const skillId = `yaswarm-${departmentId}-ops-playbook`;
  const skillBody = `---\nname: ${skillId}\ndescription: Department-specific operating playbook for ${prettyName}.\nversion: 1.0.0\n---\n\n# ${prettyName} Operations Playbook\n\nCompany Reference\n- ${companyReference || "General business operations"}\n\nPrimary Responsibilities\n- Own planning and execution for ${prettyName}\n- Coordinate with CEO and relevant departments\n- Produce concise updates and clear deliverables\n\nRecommended MCP Tools\n${recommendedMcps.map((m) => `- ${m}`).join("\n") || "- context7"}\n\nExecution Rules\n- Clarify objective, constraints, and deadline first\n- Break work into small deliverable steps\n- Escalate blockers with evidence and options\n`;

  const catalogPath = path.join(SKILLS_CATALOG_SKILLS_DIR, skillId);
  const agencyPath = path.join(AGENCY_SKILLS_ROOT, skillId);
  mkdirSync(catalogPath, { recursive: true });
  mkdirSync(agencyPath, { recursive: true });
  writeFileSync(path.join(catalogPath, "SKILL.md"), skillBody, "utf-8");
  writeFileSync(path.join(agencyPath, "SKILL.md"), skillBody, "utf-8");
  return skillId;
}

function upsertDepartmentSubAgents(
  departmentId: string,
  prettyName: string,
  tags: string[]
): void {
  const payload = safeReadJson(DEPT_SUB_AGENTS_PATH) || {
    description: "YaSwarm department sub-agent definitions.",
    departments: {},
  };
  payload.departments = payload.departments || {};

  const category =
    tags.includes("software") ? "coding" :
    tags.includes("research") ? "research" :
    tags.includes("marketing") ? "outreach" :
    tags.includes("operations") ? "quick" :
    "reasoning";

  payload.departments[departmentId] = {
    name: prettyName,
    role: `${prettyName} Lead`,
    sub_agents: {
      planner: {
        name: `${prettyName} Planner`,
        description: `Planning and scoping tasks for ${prettyName}`,
        category: "reasoning",
        model: "GLM-4.7",
        fallback_chain: ["opencode/minimax-m2.5-free"],
      },
      executor: {
        name: `${prettyName} Executor`,
        description: `Executes day-to-day ${prettyName} tasks`,
        category,
        model: "opencode/minimax-m2.5-free",
        fallback_chain: [],
      },
      reviewer: {
        name: `${prettyName} Reviewer`,
        description: `Reviews output quality and handoff readiness`,
        category: "review",
        model: "GLM-4.7",
        fallback_chain: ["claude-opus-4-6"],
      },
    },
  };

  safeWriteJson(DEPT_SUB_AGENTS_PATH, payload);
}

/**
 * GET /api/bots
 * Returns the top-level agency config (bot list, departments, etc.).
 */
router.get("/bots", (_req: Request, res: Response): void => {
  try {
    const data = readAgencyConfig();
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to read bot config", detail: message });
  }
});

/**
 * GET /api/bots/sub-agents
 * Returns the department → sub-agent mapping.
 */
router.get("/bots/sub-agents", (_req: Request, res: Response): void => {
  try {
    const filePath = path.join(AGENCY_ROOT, "config", "department-sub-agents.json");
    if (!existsSync(filePath)) {
      res.status(404).json({ error: "department-sub-agents.json not found" });
      return;
    }
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to read sub-agent config", detail: message });
  }
});

/**
 * GET /api/bots/models
 * Returns the model configuration per sub-agent.
 */
router.get("/bots/models", (_req: Request, res: Response): void => {
  try {
    const filePath = path.join(AGENCY_ROOT, "config", "sub-agent-models.json");
    if (!existsSync(filePath)) {
      res.status(404).json({ error: "sub-agent-models.json not found" });
      return;
    }
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to read model config", detail: message });
  }
});

/**
 * POST /api/bots/sync-agents
 * Local YaSwarm sync: ensures department workspaces and writes local registry.
 */
router.post("/bots/sync-agents", async (_req: Request, res: Response): Promise<void> => {
  try {
    const agencyConfig = readAgencyConfig();
    const sync = syncLocalAgents(agencyConfig);

    res.json({
      synced: sync.synced,
      totalAgents: sync.totalAgents,
      registry: sync.registry,
      mode: "local",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to sync agents", detail: message });
  }
});

/**
 * POST /api/bots/departments
 * Add department + head bot, optional token, and sync into local YaSwarm registry/workspace.
 */
router.post("/bots/departments", (req: Request, res: Response): void => {
  try {
    const body = (req.body || {}) as {
      departmentId?: string;
      departmentName?: string;
      role?: string;
      botName?: string;
      botId?: string;
      tokenEnv?: string;
      token?: string;
      modelTier?: string;
      backend?: string;
      model?: string;
      fallbackModels?: string[];
      providerIds?: string[];
      backendUrl?: string;
      topicName?: string;
      companyReference?: string;
      autoInstallBackend?: boolean;
    };

    const departmentId = toSlug(String(body.departmentId || body.departmentName || ""));
    if (!departmentId) {
      res.status(400).json({ error: "departmentId or departmentName is required" });
      return;
    }

    const agencyConfig = readAgencyConfig();
    agencyConfig.departments = agencyConfig.departments || {};
    agencyConfig.ceo = agencyConfig.ceo || {};
    agencyConfig.ceo.departments = agencyConfig.ceo.departments || [];

    if (agencyConfig.departments[departmentId]) {
      res.status(409).json({ error: `Department already exists: ${departmentId}` });
      return;
    }

    const prettyName = String(body.departmentName || titleCase(departmentId)).trim() || titleCase(departmentId);
    const botName = String(body.botName || `YaSwarm ${prettyName}`).trim();
    const botId = String(body.botId || `yaswarm_${departmentId.replace(/-/g, "_")}_bot`)
      .trim()
      .replace(/^@+/, "");
    const role = String(body.role || `${prettyName} Lead`).trim();
    const tokenEnv = String(
      body.tokenEnv || `YASWARM_${departmentId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_BOT_TOKEN`
    )
      .trim()
      .toUpperCase();
    const backend = normalizeBackendKey(String(body.backend || "opencode")) || "opencode";
    const modelTier = String(body.modelTier || "medium").trim() || "medium";
    const model = String(body.model || "").trim();
    const fallbackModels = Array.isArray(body.fallbackModels)
      ? body.fallbackModels.map((m) => String(m).trim()).filter(Boolean)
      : [];
    const providerIds = Array.isArray(body.providerIds)
      ? body.providerIds.map((p) => String(p).trim()).filter(Boolean)
      : [];
    const backendUrl = String(body.backendUrl || "").trim();
    const autoInstallBackend = body.autoInstallBackend !== false;
    const topicName = String(body.topicName || `${prettyName} - ${botName}`).trim();
    const companyReference = String(body.companyReference || "").trim();
    const tags = detectBusinessTags(
      `${departmentId} ${prettyName} ${role} ${companyReference}`
    );
    const catalogSkillIds = listCatalogSkillIds();
    const suggestedSkills = scoreSkills(catalogSkillIds, tags, departmentId);
    const suggestedMcps = suggestMcps(tags);
    const generatedSkillId = ensureGeneratedSkill(
      departmentId,
      prettyName,
      companyReference,
      suggestedMcps
    );
    const recommendedSkills = Array.from(new Set([generatedSkillId, ...suggestedSkills]));

    const selectedTool = resolveToolByBackend(backend);
    const packageManager = detectPackageManager();
    let backendInstallAttempt: any = null;
    if (selectedTool && autoInstallBackend) {
      const status = getBackendToolStatus(selectedTool, packageManager);
      if (!status.installed) {
        const cmd = pickToolCommand(selectedTool, "install", packageManager);
        if (cmd) {
          const run = runShell(cmd, 10 * 60_000);
          backendInstallAttempt = {
            toolId: selectedTool.id,
            command: cmd,
            ok: run.ok,
            stdout: run.stdout,
            stderr: run.stderr,
          };
        }
      }
    }

    agencyConfig.departments[departmentId] = {
      bot_id: botId,
      bot_name: botName,
      token_env: tokenEnv,
      role,
      department: prettyName,
      topic_name: topicName,
      topic_thread_id: null,
      system_context: `You are ${botName}, lead for ${prettyName}. Execute tasks and report clearly to CEO.`,
      skills: recommendedSkills.slice(0, 10),
      company_reference: companyReference || null,
      capability_tags: tags,
      recommended_mcps: suggestedMcps,
      backend,
      model_tier: modelTier,
      model: model || null,
      fallback_models: fallbackModels,
      provider_ids: providerIds,
      backend_url: backend === "custom" ? backendUrl || null : null,
      can_spawn_subagents: true,
      backend_chain: Array.from(new Set([backend, "glm"])),
    };

    if (!agencyConfig.ceo.departments.includes(departmentId)) {
      agencyConfig.ceo.departments.push(departmentId);
    }

    agencyConfig.updated_at = new Date().toISOString();
    writeAgencyConfig(agencyConfig);

    const token = String(body.token || "").trim();
    if (token) {
      upsertEnvFileKey(AGENCY_ENV_PATH, tokenEnv, token);
    }

    upsertDepartmentSubAgents(departmentId, prettyName, tags);

    const skillMap = safeReadJson(SKILLS_CATALOG_DEPT_MAP_PATH) || {
      updated_at: null,
      departments: {},
    };
    skillMap.departments = skillMap.departments || {};
    skillMap.departments[departmentId] = {
      department: prettyName,
      company_reference: companyReference || null,
      tags,
      skills: recommendedSkills,
    };
    skillMap.updated_at = new Date().toISOString();
    safeWriteJson(SKILLS_CATALOG_DEPT_MAP_PATH, skillMap);

    const mcpMap = safeReadJson(MCP_DEPT_MAP_PATH) || {
      updated_at: null,
      departments: {},
    };
    mcpMap.departments = mcpMap.departments || {};
    mcpMap.departments[departmentId] = {
      department: prettyName,
      company_reference: companyReference || null,
      tags,
      recommended_mcps: suggestedMcps,
    };
    mcpMap.updated_at = new Date().toISOString();
    safeWriteJson(MCP_DEPT_MAP_PATH, mcpMap);

    const sync = syncLocalAgents(agencyConfig);

    res.json({
      ok: true,
      departmentId,
      department: agencyConfig.departments[departmentId],
      recommendations: {
        tags,
        skills: recommendedSkills,
        mcps: suggestedMcps,
        generatedSkill: generatedSkillId,
      },
      tokenSaved: Boolean(token),
      backendInstallAttempt,
      sync,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to add department", detail: message });
  }
});

/**
 * PATCH /api/bots/ceo
 * Update CEO/main agent configuration and sync local registry.
 */
router.patch("/bots/ceo", (req: Request, res: Response): void => {
  try {
    const body = (req.body || {}) as {
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
    };

    const agencyConfig = readAgencyConfig();
    agencyConfig.ceo = agencyConfig.ceo || {};
    agencyConfig.ceo.departments = Array.isArray(agencyConfig.ceo.departments)
      ? agencyConfig.ceo.departments
      : [];

    const existing = agencyConfig.ceo || {};
    const backend = body.backend
      ? normalizeBackendKey(String(body.backend))
      : normalizeBackendKey(existing.backend || "opencode");
    const modelTier = String(body.modelTier || existing.model_tier || "high").trim();
    const model =
      body.model !== undefined
        ? String(body.model || "").trim()
        : String(existing.model || "");
    const fallbackModels = Array.isArray(body.fallbackModels)
      ? body.fallbackModels.map((m) => String(m).trim()).filter(Boolean)
      : Array.isArray(existing.fallback_models)
      ? existing.fallback_models.map((m: any) => String(m).trim()).filter(Boolean)
      : [];
    const providerIds = Array.isArray(body.providerIds)
      ? body.providerIds.map((p) => String(p).trim()).filter(Boolean)
      : Array.isArray(existing.provider_ids)
      ? existing.provider_ids.map((p: any) => String(p).trim()).filter(Boolean)
      : [];
    const backendUrl =
      body.backendUrl !== undefined
        ? String(body.backendUrl || "").trim()
        : String(existing.backend_url || "");
    const tokenEnv = String(
      body.tokenEnv || existing.token_env || "YASWARM_CEO_BOT_TOKEN"
    )
      .trim()
      .toUpperCase();
    const autoInstallBackend = body.autoInstallBackend !== false;

    const selectedTool = resolveToolByBackend(backend);
    const packageManager = detectPackageManager();
    let backendInstallAttempt: any = null;
    if (selectedTool && autoInstallBackend) {
      const status = getBackendToolStatus(selectedTool, packageManager);
      if (!status.installed) {
        const cmd = pickToolCommand(selectedTool, "install", packageManager);
        if (cmd) {
          const run = runShell(cmd, 10 * 60_000);
          backendInstallAttempt = {
            toolId: selectedTool.id,
            command: cmd,
            ok: run.ok,
            stdout: run.stdout,
            stderr: run.stderr,
          };
        }
      }
    }

    const botName = String(body.botName || existing.bot_name || "YaSwarm CEO").trim();
    const botId = String(body.botId || existing.bot_id || "yaswarm_ceo_bot")
      .trim()
      .replace(/^@+/, "");
    const role = String(body.role || existing.role || "CEO").trim();

    agencyConfig.ceo = {
      ...existing,
      role,
      bot_name: botName,
      bot_id: botId,
      token_env: tokenEnv,
      topic_name: String(body.topicName || existing.topic_name || `CEO - ${botName}`).trim(),
      backend,
      model_tier: modelTier,
      model: model || null,
      fallback_models: fallbackModels,
      provider_ids: providerIds,
      backend_url: backend === "custom" ? backendUrl || null : null,
      backend_chain: Array.from(new Set([backend, "glm"])),
      departments: agencyConfig.ceo.departments,
    };

    agencyConfig.updated_at = new Date().toISOString();
    writeAgencyConfig(agencyConfig);

    const token = String(body.token || "").trim();
    if (token) {
      upsertEnvFileKey(AGENCY_ENV_PATH, tokenEnv, token);
    }

    const sync = syncLocalAgents(agencyConfig);
    res.json({
      ok: true,
      ceo: agencyConfig.ceo,
      backendInstallAttempt,
      tokenSaved: Boolean(token),
      sync,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to update CEO", detail: message });
  }
});

/**
 * PATCH /api/bots/departments/:departmentId
 * Update existing department head configuration and sync local registry.
 */
router.patch("/bots/departments/:departmentId", (req: Request, res: Response): void => {
  try {
    const departmentId = toSlug(String(req.params.departmentId || ""));
    if (!departmentId) {
      res.status(400).json({ error: "departmentId is required" });
      return;
    }

    const body = (req.body || {}) as {
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
    };

    const agencyConfig = readAgencyConfig();
    agencyConfig.departments = agencyConfig.departments || {};
    const existing = agencyConfig.departments[departmentId];
    if (!existing) {
      res.status(404).json({ error: `Department not found: ${departmentId}` });
      return;
    }

    const backend = body.backend ? normalizeBackendKey(String(body.backend)) : normalizeBackendKey(existing.backend || "opencode");
    const modelTier = String(body.modelTier || existing.model_tier || "medium").trim();
    const model = body.model !== undefined ? String(body.model || "").trim() : String(existing.model || "");
    const fallbackModels = Array.isArray(body.fallbackModels)
      ? body.fallbackModels.map((m) => String(m).trim()).filter(Boolean)
      : Array.isArray(existing.fallback_models)
      ? existing.fallback_models.map((m: any) => String(m).trim()).filter(Boolean)
      : [];
    const providerIds = Array.isArray(body.providerIds)
      ? body.providerIds.map((p) => String(p).trim()).filter(Boolean)
      : Array.isArray(existing.provider_ids)
      ? existing.provider_ids.map((p: any) => String(p).trim()).filter(Boolean)
      : [];
    const backendUrl = body.backendUrl !== undefined ? String(body.backendUrl || "").trim() : String(existing.backend_url || "");
    const tokenEnv = String(
      body.tokenEnv ||
      existing.token_env ||
      `YASWARM_${departmentId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_BOT_TOKEN`
    ).trim().toUpperCase();
    const autoInstallBackend = body.autoInstallBackend !== false;

    const selectedTool = resolveToolByBackend(backend);
    const packageManager = detectPackageManager();
    let backendInstallAttempt: any = null;
    if (selectedTool && autoInstallBackend) {
      const status = getBackendToolStatus(selectedTool, packageManager);
      if (!status.installed) {
        const cmd = pickToolCommand(selectedTool, "install", packageManager);
        if (cmd) {
          const run = runShell(cmd, 10 * 60_000);
          backendInstallAttempt = {
            toolId: selectedTool.id,
            command: cmd,
            ok: run.ok,
            stdout: run.stdout,
            stderr: run.stderr,
          };
        }
      }
    }

    const updatedDepartmentName = String(body.departmentName || existing.department || titleCase(departmentId)).trim();
    const updatedBotName = String(body.botName || existing.bot_name || `YaSwarm ${updatedDepartmentName}`).trim();
    const updatedBotId = String(body.botId || existing.bot_id || `yaswarm_${departmentId.replace(/-/g, "_")}_bot`)
      .trim()
      .replace(/^@+/, "");

    agencyConfig.departments[departmentId] = {
      ...existing,
      department: updatedDepartmentName,
      role: String(body.role || existing.role || `${updatedDepartmentName} Lead`).trim(),
      bot_name: updatedBotName,
      bot_id: updatedBotId,
      token_env: tokenEnv,
      topic_name: String(body.topicName || existing.topic_name || `${updatedDepartmentName} - ${updatedBotName}`).trim(),
      backend,
      model_tier: modelTier,
      model: model || null,
      fallback_models: fallbackModels,
      provider_ids: providerIds,
      backend_url: backend === "custom" ? backendUrl || null : null,
      backend_chain: Array.from(new Set([backend, "glm"])),
    };

    agencyConfig.updated_at = new Date().toISOString();
    writeAgencyConfig(agencyConfig);

    const token = String(body.token || "").trim();
    if (token) {
      upsertEnvFileKey(AGENCY_ENV_PATH, tokenEnv, token);
    }

    const sync = syncLocalAgents(agencyConfig);

    res.json({
      ok: true,
      departmentId,
      department: agencyConfig.departments[departmentId],
      backendInstallAttempt,
      tokenSaved: Boolean(token),
      sync,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to update department", detail: message });
  }
});

/**
 * GET /api/bots/backend-tools
 * Inspect installed CLI/runtime tools and return install/update capabilities.
 */
router.get("/bots/backend-tools", (_req: Request, res: Response): void => {
  try {
    const packageManager = detectPackageManager();
    const tools = BACKEND_TOOLS.map((tool) => getBackendToolStatus(tool, packageManager));
    const backendOptions = [
      { value: "glm", label: "GLM Direct Backend", type: "provider", installed: true },
      ...tools
        .filter((t) => Boolean(t.backendKey))
        .map((t) => ({
          value: String(t.backendKey),
          label: t.label,
          type: "cli",
          installed: Boolean(t.installed),
          authConnected: t.authConnected,
        })),
      { value: "custom", label: "Custom Provider Backend", type: "custom", installed: true },
    ];

    res.json({
      ok: true,
      packageManager,
      tools,
      backendOptions,
      runtimeContext: {
        scope: "dashboard-runtime",
        note: "Detection is performed inside the YaSwarm dashboard runtime/container.",
      },
      notes: {
        terminalTab: "Use the Terminal tab for CLI auth flows and /connect provider links.",
        apiKeys: "Use API Keys tab to add provider credentials for custom backends.",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to inspect backend tools", detail: message });
  }
});

/**
 * POST /api/bots/backend-tools/install
 * Install missing CLI/runtime tools.
 */
router.post("/bots/backend-tools/install", (req: Request, res: Response): void => {
  try {
    const toolId = String(req.body?.toolId || "").trim();
    if (!toolId) {
      res.status(400).json({ error: "toolId is required" });
      return;
    }
    const tool = BACKEND_TOOLS.find((t) => t.id === toolId);
    if (!tool) {
      res.status(404).json({ error: `Unknown tool: ${toolId}` });
      return;
    }

    const packageManager = detectPackageManager();
    const command = pickToolCommand(tool, "install", packageManager);
    if (!command) {
      res.status(400).json({
        error: `No install command configured for ${tool.label} on package manager ${packageManager}`,
      });
      return;
    }

    const run = runShell(command, 15 * 60_000);
    const status = getBackendToolStatus(tool, packageManager);
    if (!run.ok) {
      res.status(500).json({
        error: `Install failed for ${tool.label}`,
        command,
        stdout: run.stdout,
        stderr: run.stderr,
        status,
      });
      return;
    }
    if (!status.installed) {
      res.status(500).json({
        error: `Install command finished but ${tool.label} is still not detected`,
        command,
        stdout: run.stdout,
        stderr: run.stderr,
        status,
      });
      return;
    }

    res.json({
      ok: true,
      action: "install",
      toolId,
      command,
      stdout: run.stdout,
      status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to install backend tool", detail: message });
  }
});

/**
 * POST /api/bots/backend-tools/update
 * Update already installed CLI/runtime tools.
 */
router.post("/bots/backend-tools/update", (req: Request, res: Response): void => {
  try {
    const toolId = String(req.body?.toolId || "").trim();
    if (!toolId) {
      res.status(400).json({ error: "toolId is required" });
      return;
    }
    const tool = BACKEND_TOOLS.find((t) => t.id === toolId);
    if (!tool) {
      res.status(404).json({ error: `Unknown tool: ${toolId}` });
      return;
    }

    const packageManager = detectPackageManager();
    const command = pickToolCommand(tool, "update", packageManager);
    if (!command) {
      res.status(400).json({
        error: `No update command configured for ${tool.label} on package manager ${packageManager}`,
      });
      return;
    }

    const run = runShell(command, 15 * 60_000);
    const status = getBackendToolStatus(tool, packageManager);
    if (!run.ok) {
      res.status(500).json({
        error: `Update failed for ${tool.label}`,
        command,
        stdout: run.stdout,
        stderr: run.stderr,
        status,
      });
      return;
    }

    res.json({
      ok: true,
      action: "update",
      toolId,
      command,
      stdout: run.stdout,
      status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to update backend tool", detail: message });
  }
});

/**
 * POST /api/bots/import-opencode-credentials
 * Import compatible provider keys from OpenCode auth.json into env.
 */
router.post("/bots/import-opencode-credentials", (req: Request, res: Response): void => {
  try {
    const scopeRaw = String(req.body?.scope || "agency").toLowerCase();
    const scope = scopeRaw === "root" ? "root" : "agency";
    const overwrite = Boolean(req.body?.overwrite);
    const envPath = scope === "root" ? "/root/agency.env" : AGENCY_ENV_PATH;

    const auth = parseOpenCodeAuth(OPENCODE_AUTH_PATH);
    const derived = derivePiEnvFromOpenCodeAuth(auth);
    if (derived.length === 0) {
      res.status(400).json({
        error: "No compatible credentials found in OpenCode auth file",
        authPath: OPENCODE_AUTH_PATH,
      });
      return;
    }

    const existing = readEnvKeys(envPath);
    const imported: Array<{ key: string; source: string; overwritten: boolean }> = [];
    const skipped: Array<{ key: string; reason: string }> = [];

    for (const item of derived) {
      if (existing[item.key] && !overwrite) {
        skipped.push({ key: item.key, reason: "already-set" });
        continue;
      }
      upsertEnvFileKey(envPath, item.key, item.value);
      process.env[item.key] = item.value;
      imported.push({ key: item.key, source: item.source, overwritten: Boolean(existing[item.key]) });
    }

    res.json({
      ok: true,
      scope,
      envPath,
      authPath: OPENCODE_AUTH_PATH,
      imported,
      skipped,
      note: "Compatible API-key credentials imported for Pi-style provider routing.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to import OpenCode credentials", detail: message });
  }
});

/**
 * GET /api/bots/backend-capabilities?backend=<id>
 * Returns backend-specific model/provider options for department configuration.
 */
router.get("/bots/backend-capabilities", (req: Request, res: Response): void => {
  try {
    const backend = normalizeBackendKey(String(req.query.backend || ""));
    if (!backend) {
      res.status(400).json({ error: "backend query param is required" });
      return;
    }

    const resolvedTool = resolveToolByBackend(backend);
    const packageManager = detectPackageManager();
    const toolStatus = resolvedTool ? getBackendToolStatus(resolvedTool, packageManager) : null;

    const closedModels = CLOSED_BACKEND_MODELS[backend] || [];
    if (closedModels.length > 0) {
      const modelOptions: ModelOption[] = closedModels.map((m) => ({
        id: String(m),
        providerId: backend,
        providerName: backend,
        isFree: null,
      }));
      const glmCatalog = backend === "glm" ? GLM_MODEL_CATALOG : [];
      res.json({
        ok: true,
        backend,
        mode: "closed",
        installed: toolStatus?.installed ?? true,
        authenticated: toolStatus?.authConnected ?? null,
        models: closedModels,
        modelOptions,
        modelCatalog: glmCatalog,
        capabilityHints:
          backend === "glm"
            ? [
                "thinking",
                "deep-thinking",
                "streaming-messages",
                "tool-streaming-output",
                "function-calling",
                "context-caching",
                "structured-output",
              ]
            : [],
        providers: [],
        multiSelect: true,
        guidance:
          toolStatus?.installed === false
            ? "Selected CLI is not installed. Install it from Terminal tab."
            : backend === "glm"
            ? "Select GLM model(s) for your department. Multimodal models may require provider-specific prompts/tooling."
            : "Select one primary model and optional fallback models.",
      });
      return;
    }

    if (backend === "custom") {
      res.json({
        ok: true,
        backend,
        mode: "custom",
        installed: true,
        authenticated: null,
        models: [],
        modelOptions: [],
        providers: [],
        multiSelect: true,
        guidance:
          "Set custom provider URL + model, then add API key from API Keys tab.",
      });
      return;
    }

    const catalogProviders = listConnectedProvidersFromCatalog();
    const envProviders = inferProviderConnectionsFromEnv();
    const providerMap = new Map<string, { id: string; name: string; connected: boolean; models: string[] }>();
    for (const p of [...catalogProviders, ...envProviders]) {
      const existing = providerMap.get(p.id);
      if (!existing) {
        providerMap.set(p.id, { ...p });
      } else {
        providerMap.set(p.id, {
          id: p.id,
          name: p.name || existing.name,
          connected: existing.connected || p.connected,
          models: Array.from(new Set([...existing.models, ...p.models])),
        });
      }
    }
    const providers = Array.from(providerMap.values());
    const providerSet = new Set(providers.map((p) => p.id));
    const catalogModelOptions: ModelOption[] = providers.flatMap((p) =>
      (p.models || [])
        .map((m) => String(m).trim())
        .filter(Boolean)
        .map((m) => ({
          id: m,
          providerId: p.id,
          providerName: p.name,
          isFree: null,
        }))
    );
    const cacheModelOptions = listOpenCodeModelOptionsFromCache().filter(
      (m) => providerSet.size === 0 || providerSet.has(m.providerId)
    );
    const modelOptionMap = new Map<string, ModelOption>();
    for (const opt of [...catalogModelOptions, ...cacheModelOptions]) {
      const existing = modelOptionMap.get(opt.id);
      if (!existing) {
        modelOptionMap.set(opt.id, opt);
      } else if (existing.isFree == null && opt.isFree != null) {
        modelOptionMap.set(opt.id, opt);
      }
    }
    const modelOptions = Array.from(modelOptionMap.values()).sort((a, b) =>
      a.id.localeCompare(b.id)
    );
    const models = modelOptions.map((m) => m.id);

    const isOpenCli = ["pi-mono", "opencode", "codebuff"].includes(backend);
    res.json({
      ok: true,
      backend,
      mode: isOpenCli ? "provider-connected" : "generic",
      installed: toolStatus?.installed ?? true,
      authenticated: toolStatus?.authConnected ?? null,
      models,
      modelOptions,
      providers,
      multiSelect: true,
      requiresConnect: providers.length === 0,
      guidance:
        providers.length === 0
          ? "No connected providers detected. Use Terminal tab to run CLI auth/connect, then refresh."
          : "Choose provider(s), primary model, and optional fallback models for this department.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to load backend capabilities", detail: message });
  }
});

export default router;
