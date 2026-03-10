import { Router, Request, Response } from "express";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Known desk stage directories. */
const DESK_STAGES = [
  "inbox",
  "triage",
  "in-progress",
  "review",
  "done",
  "tickets",
] as const;

interface DeskItem {
  id: string;
  stage: string;
  file: string;
  [key: string]: unknown;
}

/**
 * Scan a stage directory and return parsed items.
 */
function readStage(stage: string): DeskItem[] {
  const dir = path.join(AGENCY_ROOT, "desk", stage);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith(".json") || f.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(dir, file);
      const id = path.basename(file, path.extname(file));

      if (file.endsWith(".json")) {
        try {
          const data = JSON.parse(readFileSync(filePath, "utf-8"));
          return { id, stage, file, ...data };
        } catch {
          return { id, stage, file, error: "parse_failed" };
        }
      }

      // Markdown items — return first line as title
      const content = readFileSync(filePath, "utf-8");
      const title = content.split("\n")[0]?.replace(/^#+\s*/, "").trim() || file;
      return { id, stage, file, title, format: "markdown" };
    });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/desk
 * List items across all desk stages.
 * Query params:
 *   ?stage=inbox  — filter to a single stage
 */
router.get("/desk", (req: Request, res: Response): void => {
  try {
    const stageFilter = req.query.stage as string | undefined;
    const stages = stageFilter
      ? [stageFilter]
      : (DESK_STAGES as readonly string[]);

    const items: DeskItem[] = [];
    for (const stage of stages) {
      items.push(...readStage(stage));
    }

    res.json({ items, total: items.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to list desk items", detail: message });
  }
});

/**
 * GET /api/desk/:id
 * Get a specific desk item by scanning all stages for a matching file.
 */
router.get("/desk/:id", (req: Request, res: Response): void => {
  try {
    const targetId = req.params.id;

    for (const stage of DESK_STAGES) {
      const dir = path.join(AGENCY_ROOT, "desk", stage);
      if (!existsSync(dir)) continue;

      const files = readdirSync(dir);
      const match = files.find(
        (f) => path.basename(f, path.extname(f)) === targetId,
      );

      if (match) {
        const filePath = path.join(dir, match);

        if (match.endsWith(".json")) {
          const data = JSON.parse(readFileSync(filePath, "utf-8"));
          res.json({ id: targetId, stage, file: match, ...data });
          return;
        }

        const content = readFileSync(filePath, "utf-8");
        res.json({ id: targetId, stage, file: match, content });
        return;
      }
    }

    res.status(404).json({ error: `Desk item "${targetId}" not found` });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read desk item", detail: message });
  }
});

export default router;
