import { Router, Request, Response } from "express";
import { readFileSync, existsSync } from "fs";
import path from "path";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";
const YASWARM_ROOT =
  process.env.YASWARM_ROOT || "/root/yaswarm-swarm";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ChangelogEntry {
  version: string;
  date: string | null;
  body: string;
}

/**
 * Minimal CHANGELOG.md parser.
 * Splits on `## [version]` or `## version` headings.
 */
function parseChangelog(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const headingRe = /^##\s+\[?([^\]\s]+)\]?\s*[-–—(]?\s*(\d{4}-\d{2}-\d{2})?\)?/;

  const lines = content.split("\n");
  let current: ChangelogEntry | null = null;
  const bodyLines: string[] = [];

  function flush(): void {
    if (current) {
      current.body = bodyLines.join("\n").trim();
      entries.push(current);
      bodyLines.length = 0;
    }
  }

  for (const line of lines) {
    const match = headingRe.exec(line);
    if (match) {
      flush();
      current = {
        version: match[1],
        date: match[2] ?? null,
        body: "",
      };
    } else if (current) {
      bodyLines.push(line);
    }
  }
  flush();

  return entries;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/changelog
 * Parse and return CHANGELOG.md entries.
 * Query params:
 *   ?raw=true  — return raw markdown instead of parsed entries
 */
router.get("/changelog", (req: Request, res: Response): void => {
  try {
    const candidates = [
      path.join(AGENCY_ROOT, "CHANGELOG.md"),
      path.join(AGENCY_ROOT, "changelog.md"),
      path.join(AGENCY_ROOT, "docs/CHANGELOG.md"),
      path.join(YASWARM_ROOT, "CHANGELOG.md"),
      path.join(YASWARM_ROOT, "changelog.md"),
    ];

    const filePath = candidates.find((f) => existsSync(f));
    if (!filePath) {
      res.json({
        entries: [],
        raw: null,
        message: "No CHANGELOG.md found",
      });
      return;
    }

    const content = readFileSync(filePath, "utf-8");

    if (req.query.raw === "true") {
      res.json({ raw: content, sourcePath: filePath });
      return;
    }

    const entries = parseChangelog(content);
    res.json({ entries, total: entries.length, sourcePath: filePath });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read changelog", detail: message });
  }
});

export default router;
