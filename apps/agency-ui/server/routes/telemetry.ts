import { Router, Request, Response } from "express";
import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TelemetryEvent {
  timestamp?: string;
  type?: string;
  [key: string]: unknown;
}

/**
 * Parse a JSONL file into an array of objects, skipping malformed lines.
 */
function parseJsonl(filePath: string): TelemetryEvent[] {
  const content = readFileSync(filePath, "utf-8");
  const events: TelemetryEvent[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      // skip malformed lines
    }
  }
  return events;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/telemetry/events
 * Read telemetry JSONL files from logs/telemetry/.
 * Query params:
 *   ?limit=100  — max events to return (default 200)
 *   ?type=…     — filter by event type
 */
router.get("/telemetry/events", (req: Request, res: Response): void => {
  try {
    const dir = path.join(AGENCY_ROOT, "logs/telemetry");
    if (!existsSync(dir)) {
      res.json({ events: [], total: 0 });
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 200, 5000);
    const typeFilter = req.query.type as string | undefined;

    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".jsonl"))
      .sort()
      .reverse(); // newest first

    let events: TelemetryEvent[] = [];
    for (const file of files) {
      const batch = parseJsonl(path.join(dir, file));
      events.push(...batch);
      if (events.length >= limit * 2) break; // read enough to filter
    }

    if (typeFilter) {
      events = events.filter((e) => e.type === typeFilter);
    }

    // Most recent first, capped at limit
    events = events
      .sort(
        (a, b) =>
          new Date(b.timestamp ?? 0).getTime() -
          new Date(a.timestamp ?? 0).getTime(),
      )
      .slice(0, limit);

    res.json({ events, total: events.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read telemetry events", detail: message });
  }
});

/**
 * GET /api/telemetry/performance
 * Returns the model performance report if it exists.
 */
router.get("/telemetry/performance", (_req: Request, res: Response): void => {
  try {
    const filePath = path.join(
      AGENCY_ROOT,
      "logs/model-performance-report.json",
    );
    if (!existsSync(filePath)) {
      res.json({ report: null, message: "No performance report available" });
      return;
    }
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read performance report", detail: message });
  }
});

/**
 * GET /api/telemetry/summary
 * Aggregate stats across all telemetry events.
 */
router.get("/telemetry/summary", (_req: Request, res: Response): void => {
  try {
    const dir = path.join(AGENCY_ROOT, "logs/telemetry");
    if (!existsSync(dir)) {
      res.json({
        totalEvents: 0,
        byType: {},
        firstEvent: null,
        lastEvent: null,
      });
      return;
    }

    const files = readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
    let allEvents: TelemetryEvent[] = [];
    for (const file of files) {
      allEvents.push(...parseJsonl(path.join(dir, file)));
    }

    const byType: Record<string, number> = {};
    let earliest: string | null = null;
    let latest: string | null = null;

    for (const evt of allEvents) {
      const t = evt.type ?? "unknown";
      byType[t] = (byType[t] || 0) + 1;

      if (evt.timestamp) {
        if (!earliest || evt.timestamp < earliest) earliest = evt.timestamp;
        if (!latest || evt.timestamp > latest) latest = evt.timestamp;
      }
    }

    res.json({
      totalEvents: allEvents.length,
      byType,
      firstEvent: earliest,
      lastEvent: latest,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to build telemetry summary", detail: message });
  }
});

export default router;
