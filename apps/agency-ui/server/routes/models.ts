import { Router, Request, Response } from "express";
import { readFileSync, existsSync, writeFileSync } from "fs";
import path from "path";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";

const router = Router();
const AGENCY_ENV_PATH = path.join(AGENCY_ROOT, ".env");

type DebugProviderDef = {
  id: string;
  label: string;
  apiKeyEnv: string;
  urlEnv: string;
  defaultUrl: string;
  models: string[];
};

const GLM_PROVIDER_MODELS: string[] = [
  "GLM-5",
  "GLM-4.7",
  "GLM-4.6",
  "GLM-4.5",
  "GLM-4-32B-0414-128K",
  "GLM-4.6V",
  "GLM-OCR",
  "AutoGLM-Phone-Multilingual",
  "GLM-4.5V",
  "GLM-Image",
  "CogView-4",
  "CogVideoX-3",
  "Vidu Q1",
  "Vidu 2",
  "GLM-ASR-2512",
];

function safeReadJson(filePath: string): any {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function parseEnv(filePath: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(filePath)) return map;
  const raw = readFileSync(filePath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let val = match[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    map.set(match[1], val.replace(/\\n/g, "\n"));
  }
  return map;
}

function formatAssignment(key: string, value: string): string {
  const needsQuotes = /[\s#"']/g.test(value) || value.includes("=");
  if (!needsQuotes) return `${key}=${value}`;
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  return `${key}="${escaped}"`;
}

function upsertEnvKey(filePath: string, key: string, value: string): void {
  const line = formatAssignment(key, value);
  const raw = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
  const lines = raw ? raw.split(/\r?\n/) : [];
  let replaced = false;
  const updated = lines.map((l) => {
    const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (m && m[1] === key) {
      replaced = true;
      return line;
    }
    return l;
  });
  if (!replaced) {
    if (updated.length > 0 && updated[updated.length - 1].trim() !== "") updated.push("");
    updated.push(line);
  }
  writeFileSync(filePath, `${updated.join("\n").replace(/\n*$/, "")}\n`, "utf-8");
}

function providerDefs(): DebugProviderDef[] {
  return [
    {
      id: "glm",
      label: "GLM (z.ai)",
      apiKeyEnv: "ZAI_API_KEY",
      urlEnv: "ZAI_BASE_URL",
      defaultUrl: "https://api.z.ai/api/coding/paas/v4",
      models: GLM_PROVIDER_MODELS,
    },
    {
      id: "openai",
      label: "OpenAI",
      apiKeyEnv: "OPENAI_API_KEY",
      urlEnv: "OPENAI_BASE_URL",
      defaultUrl: "https://api.openai.com/v1",
      models: ["gpt-4.1", "gpt-4o", "gpt-5"],
    },
    {
      id: "anthropic",
      label: "Anthropic",
      apiKeyEnv: "ANTHROPIC_API_KEY",
      urlEnv: "ANTHROPIC_BASE_URL",
      defaultUrl: "https://api.anthropic.com",
      models: ["claude-sonnet-4-5", "claude-opus-4-1"],
    },
    {
      id: "gemini",
      label: "Google Gemini",
      apiKeyEnv: "GEMINI_API_KEY",
      urlEnv: "GEMINI_BASE_URL",
      defaultUrl: "https://generativelanguage.googleapis.com/v1beta",
      models: ["gemini-2.5-flash", "gemini-2.5-pro"],
    },
  ];
}

async function runProviderConnectionTest(provider: DebugProviderDef, model: string, apiKey: string, baseUrl: string): Promise<{
  ok: boolean;
  status?: number;
  detail?: string;
}> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 10000);
  try {
    if (provider.id === "anthropic") {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/models`, {
        method: "GET",
        signal: ctrl.signal,
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      });
      return {
        ok: res.ok,
        status: res.status,
        detail: res.ok ? `Connected to ${provider.label}` : `HTTP ${res.status} from ${provider.label}`,
      };
    }
    if (provider.id === "gemini") {
      const res = await fetch(
        `${baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(model)}?key=${encodeURIComponent(apiKey)}`,
        { method: "GET", signal: ctrl.signal }
      );
      return {
        ok: res.ok,
        status: res.status,
        detail: res.ok ? `Connected to ${provider.label}` : `HTTP ${res.status} from ${provider.label}`,
      };
    }
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
      method: "GET",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return {
      ok: res.ok,
      status: res.status,
      detail: res.ok ? `Connected to ${provider.label}` : `HTTP ${res.status} from ${provider.label}`,
    };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function getLocalModelCatalog() {
  const configDir = path.join(AGENCY_ROOT, "config");
  const botConfig = safeReadJson(path.join(configDir, "agency-bot-config.json"));
  const modelMap: Record<string, { alias: string }> = {};
  let primaryModel: string | null = null;

  const bots = botConfig?.bots || {};
  for (const bot of Object.values(bots) as any[]) {
    const model = String(bot?.model || "").trim();
    if (model) {
      modelMap[model] = { alias: model };
      if (!primaryModel) primaryModel = model;
    }
    const backendName = String(bot?.backend || "");
    const avail = bot?.available_backends?.[backendName];
    const models = Array.isArray(avail?.models) ? avail.models : [];
    for (const m of models) {
      const mm = String(m || "").trim();
      if (mm) modelMap[mm] = { alias: mm };
    }
  }

  const models = Object.entries(modelMap).map(([id, val]: [string, any]) => ({
    id,
    alias: val?.alias || id,
    source: "local-config",
  }));

  return { models, modelMap, primaryModel };
}

router.get("/models", (_req: Request, res: Response): void => {
  try {
    const configDir = path.join(AGENCY_ROOT, "config");

    const subAgentModels = safeReadJson(path.join(configDir, "sub-agent-models.json"));
    const agencyBotConfig = safeReadJson(path.join(configDir, "agency-bot-config.json"));
    const codexModelRouting = safeReadJson(path.join(configDir, "codex-model-routing.json"));
    const departmentSubAgents = safeReadJson(path.join(configDir, "department-sub-agents.json"));
    const agencyConfig = safeReadJson(path.join(configDir, "agency-config.json"));
    const { modelMap, primaryModel } = getLocalModelCatalog();

    res.json({
      subAgentModels,
      agencyBotConfig,
      codexModelRouting,
      departmentSubAgents,
      agencyConfig,
      gateway: {
        models: modelMap,
        primaryModel,
      },
      mode: "local",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to load model config", detail: message });
  }
});

router.get("/models/assignments", (_req: Request, res: Response): void => {
  try {
    const configDir = path.join(AGENCY_ROOT, "config");
    const agencyConfig = safeReadJson(path.join(configDir, "agency-config.json"));
    const agencyBotConfig = safeReadJson(path.join(configDir, "agency-bot-config.json"));

    const departments = agencyConfig?.departments || {};
    const assignments: Array<{
      department: string;
      modelTier: string;
      backend: string;
      model?: string;
      fallbackChain?: string[];
    }> = [];

    const ceo = agencyConfig?.ceo || {};
    const ceoBotConf = agencyBotConfig?.bots?.ceo || {};
    assignments.push({
      department: "ceo",
      modelTier: ceo.model_tier || ceoBotConf.model_tier || "high",
      backend: ceo.backend || ceoBotConf.backend || "default",
      model: ceo.model || ceoBotConf.model || undefined,
      fallbackChain: ceo.fallback_models || ceoBotConf.fallback_chain || undefined,
    });

    for (const [deptId, deptConfig] of Object.entries(departments)) {
      const dept = deptConfig as any;
      const botConf = agencyBotConfig?.bots?.[deptId] || {};

      assignments.push({
        department: deptId,
        modelTier: dept.model_tier || botConf.model_tier || "unknown",
        backend: botConf.backend || "default",
        model: botConf.model || undefined,
        fallbackChain: botConf.fallback_chain || undefined,
      });
    }

    res.json({ assignments });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to load assignments", detail: message });
  }
});

router.get("/models/backends", (_req: Request, res: Response): void => {
  try {
    const agencyBotConfig = safeReadJson(
      path.join(AGENCY_ROOT, "config", "agency-bot-config.json")
    );

    const backends: Record<string, { models: string[]; departments: string[] }> = {};

    const bots = agencyBotConfig?.bots || {};
    for (const [deptId, botConf] of Object.entries(bots)) {
      const conf = botConf as any;
      const backendName = conf.backend || "default";

      if (!backends[backendName]) {
        backends[backendName] = { models: [], departments: [] };
      }
      backends[backendName].departments.push(deptId);

      const avail = conf.available_backends?.[backendName];
      if (avail?.models && Array.isArray(avail.models)) {
        for (const m of avail.models) {
          if (!backends[backendName].models.includes(m)) {
            backends[backendName].models.push(m);
          }
        }
      }
    }

    res.json({ backends });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to load backends", detail: message });
  }
});

router.get("/models/catalog", (_req: Request, res: Response): void => {
  try {
    const { models } = getLocalModelCatalog();
    res.json({
      models,
      note: "Loaded from local config",
      mode: "local",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to load local model catalog", detail: message });
  }
});

router.get("/models/debug/providers", (_req: Request, res: Response): void => {
  try {
    res.json({
      providers: providerDefs(),
      envPath: AGENCY_ENV_PATH,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to load debug providers", detail: message });
  }
});

router.post("/models/debug/test", async (req: Request, res: Response): Promise<void> => {
  try {
    const providerId = String(req.body?.provider || "").trim().toLowerCase();
    const requestedModel = String(req.body?.model || "").trim();
    const saveToEnv = Boolean(req.body?.saveToEnv);
    const defs = providerDefs();
    const provider = defs.find((p) => p.id === providerId);
    if (!provider) {
      res.status(400).json({ error: "Unsupported provider" });
      return;
    }
    const envMap = parseEnv(AGENCY_ENV_PATH);
    const bodyApiKey = String(req.body?.apiKey || "").trim();
    const bodyProviderUrl = String(req.body?.providerUrl || "").trim();
    const apiKey = bodyApiKey || process.env[provider.apiKeyEnv] || envMap.get(provider.apiKeyEnv) || "";
    const providerUrl =
      bodyProviderUrl || process.env[provider.urlEnv] || envMap.get(provider.urlEnv) || provider.defaultUrl;
    const model = requestedModel || provider.models[0];

    const missing: string[] = [];
    if (!apiKey) missing.push(provider.apiKeyEnv);
    if (!providerUrl) missing.push(provider.urlEnv);

    if (missing.length > 0) {
      res.json({
        ok: false,
        status: "missing_credentials",
        missing,
        provider,
        model,
        providerUrl,
      });
      return;
    }

    if (saveToEnv) {
      if (bodyApiKey) upsertEnvKey(AGENCY_ENV_PATH, provider.apiKeyEnv, bodyApiKey);
      if (bodyProviderUrl) upsertEnvKey(AGENCY_ENV_PATH, provider.urlEnv, bodyProviderUrl);
    }

    const test = await runProviderConnectionTest(provider, model, apiKey, providerUrl);
    res.json({
      ok: test.ok,
      status: test.ok ? "connected" : "connection_failed",
      provider,
      model,
      providerUrl,
      detail: test.detail || "",
      httpStatus: test.status ?? null,
      envSaved: saveToEnv && Boolean(bodyApiKey || bodyProviderUrl),
      envPath: AGENCY_ENV_PATH,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to run provider test", detail: message });
  }
});

export default router;
