import os from "os";
import path from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";
const GOVERNOR_PATH = path.join(AGENCY_ROOT, "config", "resource-governor.json");
const MCP_CATALOG_PATH =
  process.env.YASWARM_MCP_CATALOG_PATH ||
  "/root/yaswarm-swarm/projects/yaswarm-mcps-cataloge/imports/agency/mcp-catalog.json";

export type GovernorState = "green" | "yellow" | "red";
export type TaskWeight = "light" | "medium" | "heavy";

export type ResourceGovernorConfig = {
  enabled: boolean;
  autoDelayEnabled: boolean;
  requireTremcpForAuto: boolean;
  thresholds: {
    maxLoadPerCoreGreen: number;
    maxLoadPerCoreYellow: number;
    maxMemPercentGreen: number;
    maxMemPercentYellow: number;
    maxTempCGreen: number;
    maxTempCYellow: number;
    minFreeMemMbRed: number;
  };
  scheduling: {
    maxConcurrentHeavy: number;
    yellowDelaySec: number;
    redDelaySec: number;
    taskTtlSec: number;
  };
  updatedAt: string;
};

export type MachineSnapshot = {
  cpuCount: number;
  load1: number;
  loadPerCore: number;
  memTotalMb: number;
  memFreeMb: number;
  memUsedPercent: number;
  uptimeSec: number;
  tempC: number | null;
};

export type TremcpStatus = {
  presentInCatalog: boolean;
  serverPathExists: boolean;
  hasCredentialConfig: boolean;
  riskLevel: "none" | "high";
  warning: string;
  installUrl?: string;
  installHint?: string;
};

export function defaultGovernorConfig(): ResourceGovernorConfig {
  return {
    enabled: true,
    autoDelayEnabled: true,
    requireTremcpForAuto: false,
    thresholds: {
      maxLoadPerCoreGreen: 0.7,
      maxLoadPerCoreYellow: 1.0,
      maxMemPercentGreen: 70,
      maxMemPercentYellow: 85,
      maxTempCGreen: 72,
      maxTempCYellow: 82,
      minFreeMemMbRed: 350,
    },
    scheduling: {
      maxConcurrentHeavy: 2,
      yellowDelaySec: 60,
      redDelaySec: 180,
      taskTtlSec: 1800,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function readGovernorConfig(): ResourceGovernorConfig {
  if (!existsSync(GOVERNOR_PATH)) {
    const cfg = defaultGovernorConfig();
    writeGovernorConfig(cfg);
    return cfg;
  }
  try {
    const parsed = JSON.parse(readFileSync(GOVERNOR_PATH, "utf-8"));
    return {
      ...defaultGovernorConfig(),
      ...parsed,
      thresholds: {
        ...defaultGovernorConfig().thresholds,
        ...(parsed?.thresholds || {}),
      },
      scheduling: {
        ...defaultGovernorConfig().scheduling,
        ...(parsed?.scheduling || {}),
      },
    };
  } catch {
    const cfg = defaultGovernorConfig();
    writeGovernorConfig(cfg);
    return cfg;
  }
}

export function writeGovernorConfig(config: ResourceGovernorConfig): void {
  const payload = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(GOVERNOR_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function readThermalCelsius(): number | null {
  const candidates = [
    "/sys/class/thermal/thermal_zone0/temp",
    "/sys/class/thermal/thermal_zone1/temp",
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      const raw = readFileSync(candidate, "utf-8").trim();
      const value = Number(raw);
      if (!Number.isFinite(value)) continue;
      if (value > 1000) return value / 1000;
      return value;
    } catch {
      // ignore
    }
  }
  return null;
}

export function collectMachineSnapshot(): MachineSnapshot {
  const cpuCount = Math.max(1, os.cpus().length);
  const load1 = os.loadavg()[0] || 0;
  const loadPerCore = load1 / cpuCount;
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const memTotalMb = Math.round(memTotal / (1024 * 1024));
  const memFreeMb = Math.round(memFree / (1024 * 1024));
  const memUsedPercent = memTotal > 0 ? ((memTotal - memFree) / memTotal) * 100 : 0;

  return {
    cpuCount,
    load1,
    loadPerCore,
    memTotalMb,
    memFreeMb,
    memUsedPercent,
    uptimeSec: os.uptime(),
    tempC: readThermalCelsius(),
  };
}

export function evaluateGovernorState(
  snapshot: MachineSnapshot,
  cfg: ResourceGovernorConfig,
  activeHeavyTasks: number
): { state: GovernorState; reasons: string[] } {
  const reasons: string[] = [];
  const t = cfg.thresholds;

  if (
    snapshot.loadPerCore > t.maxLoadPerCoreYellow ||
    snapshot.memUsedPercent > t.maxMemPercentYellow ||
    (snapshot.tempC !== null && snapshot.tempC > t.maxTempCYellow) ||
    snapshot.memFreeMb < t.minFreeMemMbRed
  ) {
    reasons.push("System pressure exceeds red threshold");
    return { state: "red", reasons };
  }

  if (
    snapshot.loadPerCore > t.maxLoadPerCoreGreen ||
    snapshot.memUsedPercent > t.maxMemPercentGreen ||
    (snapshot.tempC !== null && snapshot.tempC > t.maxTempCGreen)
  ) {
    reasons.push("System in caution range");
    return { state: "yellow", reasons };
  }

  if (activeHeavyTasks >= cfg.scheduling.maxConcurrentHeavy) {
    reasons.push("Heavy task concurrency cap reached");
    return { state: "yellow", reasons };
  }

  reasons.push("System healthy");
  return { state: "green", reasons };
}

export function adviseTaskRun(input: {
  state: GovernorState;
  taskWeight: TaskWeight;
  config: ResourceGovernorConfig;
  tremcp: TremcpStatus;
}): { allow: boolean; delaySec: number; reason: string } {
  const { state, taskWeight, config, tremcp } = input;
  if (!config.enabled || !config.autoDelayEnabled) {
    return { allow: true, delaySec: 0, reason: "Governor disabled" };
  }

  if (config.requireTremcpForAuto && !tremcp.presentInCatalog) {
    return {
      allow: false,
      delaySec: config.scheduling.yellowDelaySec,
      reason: "tremcp-ssh required but not configured",
    };
  }

  if (state === "green") return { allow: true, delaySec: 0, reason: "System green" };
  if (state === "yellow") {
    if (taskWeight === "light") {
      return { allow: true, delaySec: 0, reason: "Yellow state allows light tasks" };
    }
    return {
      allow: false,
      delaySec: config.scheduling.yellowDelaySec,
      reason: "Yellow state delays medium/heavy tasks",
    };
  }
  if (state === "red") {
    if (taskWeight === "light") {
      return {
        allow: false,
        delaySec: config.scheduling.yellowDelaySec,
        reason: "Red state delays even light tasks",
      };
    }
    return {
      allow: false,
      delaySec: config.scheduling.redDelaySec,
      reason: "Red state blocks non-critical tasks",
    };
  }
  return { allow: true, delaySec: 0, reason: "No restriction" };
}

export function detectTremcpStatus(): TremcpStatus {
  const installUrl = "https://github.com/YaRepo/tremcp-ssh";
  const installHint =
    "Install tremcp-ssh, then register it in MCP catalog to enable VPS-aware scheduling.";

  const candidates = Array.from(
    new Set(
      [
        process.env.YASWARM_MCP_CATALOG_PATH,
        MCP_CATALOG_PATH,
        "/root/yaswarm-swarm/projects/yaswarm-mcps-cataloge/imports/agency/mcp-catalog.json",
        path.join(AGENCY_ROOT, "config", "mcp-catalog.json"),
      ].filter(Boolean) as string[]
    )
  );

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      const catalog = JSON.parse(readFileSync(candidate, "utf-8"));
      const server = catalog?.servers?.["tremcp-ssh"] || null;
      if (!server) continue;
      const serverPath = Array.isArray(server?.args) && server.args[0] ? String(server.args[0]) : "";
      const hasCredentialConfig = Boolean(
        server?.environment?.TREMCP_SSH_PASSWORD ||
          server?.environment?.TREMCP_SSH_KEY_PATH ||
          server?.environment?.TREMCP_SSH_HOST
      );
      return {
        presentInCatalog: true,
        serverPathExists: serverPath ? existsSync(serverPath) : false,
        hasCredentialConfig,
        riskLevel: hasCredentialConfig ? "high" : "none",
        warning: hasCredentialConfig
          ? "tremcp-ssh can grant broad machine/VPS access. Enable only for trusted operators."
          : "tremcp-ssh present but not fully credentialed.",
        installUrl,
        installHint,
      };
    } catch {
      // continue to next candidate
    }
  }

  return {
    presentInCatalog: false,
    serverPathExists: false,
    hasCredentialConfig: false,
    riskLevel: "none",
    warning:
      "tremcp-ssh is not configured in MCP catalog. Install it from https://github.com/YaRepo/tremcp-ssh",
    installUrl,
    installHint,
  };
}
