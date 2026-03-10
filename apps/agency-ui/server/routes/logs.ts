import { Router, Request, Response } from "express";
import { readFileSync, existsSync, statSync } from "fs";
import path from "path";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read the last N lines of a text file (poor-man's `tail`).
 */
function tailFile(filePath: string, lines: number): string[] {
  const content = readFileSync(filePath, "utf-8");
  const allLines = content.split("\n");
  return allLines.slice(-lines).filter((l) => l.trim() !== "");
}

/**
 * Parse a JSONL file into an array, skipping bad lines.
 */
function parseJsonl(filePath: string): Record<string, unknown>[] {
  const content = readFileSync(filePath, "utf-8");
  const results: Record<string, unknown>[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      results.push(JSON.parse(trimmed));
    } catch {
      // skip
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/logs/recent
 * Tail the bridge.log file.
 * Query params:
 *   ?lines=100  — number of lines to return (default 100, max 1000)
 */
router.get("/logs/recent", (req: Request, res: Response): void => {
  try {
    const lines = Math.min(Number(req.query.lines) || 100, 1000);

    const candidates = [
      path.join(AGENCY_ROOT, "logs/bridge.log"),
      path.join(AGENCY_ROOT, "bridge.log"),
    ];

    const logFile = candidates.find((f) => existsSync(f));
    if (!logFile) {
      res.json({ lines: [], message: "No bridge.log found" });
      return;
    }

    const stat = statSync(logFile);
    const tailLines = tailFile(logFile, lines);

    res.json({
      file: path.relative(AGENCY_ROOT, logFile),
      sizeBytes: stat.size,
      lines: tailLines,
      total: tailLines.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read logs", detail: message });
  }
});

/**
 * GET /api/logs/desk
 * Read the desk index JSONL file.
 * Query params:
 *   ?limit=50  — max entries to return (default 50)
 */
router.get("/logs/desk", (req: Request, res: Response): void => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 500);

    const filePath = path.join(AGENCY_ROOT, "desk/index.jsonl");
    if (!existsSync(filePath)) {
      res.json({ entries: [], message: "No desk/index.jsonl found" });
      return;
    }

    const entries = parseJsonl(filePath);

    // Most recent last in the file, reverse for API consumers
    const recent = entries.reverse().slice(0, limit);

    res.json({ entries: recent, total: entries.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read desk log", detail: message });
  }
});

export default router;
