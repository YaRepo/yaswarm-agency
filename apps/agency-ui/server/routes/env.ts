import { Router, Request, Response } from "express";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const router = Router();
const AGENCY_ROOT = process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";

type Scope = "agency" | "root";

function scopePath(scope: Scope): string {
  if (scope === "root") return "/root/agency.env";
  return path.join(AGENCY_ROOT, ".env");
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

function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "*".repeat(value.length);
  return `${value.slice(0, 2)}${"*".repeat(Math.min(Math.max(value.length - 4, 4), 16))}${value.slice(-2)}`;
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

router.get("/env/scopes", (_req: Request, res: Response): void => {
  const scopes: Scope[] = ["agency", "root"];
  res.json({
    scopes: scopes.map((scope) => {
      const filePath = scopePath(scope);
      return { scope, path: filePath, exists: existsSync(filePath) };
    }),
  });
});

router.get("/env/entries", (req: Request, res: Response): void => {
  try {
    const scope = String(req.query.scope || "agency") as Scope;
    const filePath = scopePath(scope);
    const entries = Array.from(parseEnv(filePath).entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ key, maskedValue: maskSecret(value) }));

    res.json({ scope, path: filePath, exists: existsSync(filePath), entries });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to list env entries", detail: message });
  }
});

router.put("/env/entries", (req: Request, res: Response): void => {
  try {
    const scope = String(req.body?.scope || "agency") as Scope;
    const key = String(req.body?.key || "").trim().toUpperCase();
    const value = String(req.body?.value ?? "");
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      res.status(400).json({ error: "Invalid key format" });
      return;
    }

    const filePath = scopePath(scope);
    upsertEnvKey(filePath, key, value);
    res.json({ ok: true, scope, key, path: filePath, maskedValue: maskSecret(value) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to save env entry", detail: message });
  }
});

export default router;
