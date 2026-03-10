import { Router, Request, Response } from "express";
import {
  readFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
  appendFileSync,
  writeFileSync,
  unlinkSync,
} from "fs";
import path from "path";
import { createRequire } from "module";
import multer from "multer";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";

const router = Router();

// ---------------------------------------------------------------------------
// SQLite helper – lazy-loaded so the server still starts if the DB is missing.
// ---------------------------------------------------------------------------

let BetterSqlite3: any = null;
try {
  const require = createRequire(import.meta.url);
  BetterSqlite3 = require("better-sqlite3");
  console.log("[Memory] better-sqlite3 loaded successfully");
} catch (err) {
  console.warn("[Memory] better-sqlite3 not available:", err instanceof Error ? err.message : err);
}

function openHiveDb(readonly = true): any {
  if (!BetterSqlite3) return null;
  try {
    const dbPath = path.join(AGENCY_ROOT, "logs", "hive_memory.sqlite");
    if (!existsSync(dbPath)) {
      console.warn("[Memory] Hive DB not found at:", dbPath);
      return null;
    }
    return new BetterSqlite3(dbPath, { readonly });
  } catch (err) {
    console.error("[Memory] Failed to open hive DB:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MemoryEntry {
  source: "sqlite" | "markdown";
  timestamp?: string;
  [key: string]: unknown;
}

function safeMemoryFilePath(file: string): string | null {
  const normalized = path.normalize(file).replace(/^(\.\.(\/|\\|$))+/, "");
  if (normalized.includes("..")) return null;
  if (normalized === "MEMORY.md") return path.join(AGENCY_ROOT, "MEMORY.md");
  if (!normalized.endsWith(".md")) return null;
  return path.join(AGENCY_ROOT, "memory", path.basename(normalized));
}

/**
 * Read all *.md files from memory/ and MEMORY.md, return structured entries.
 */
function readMarkdownMemories(): MemoryEntry[] {
  const results: MemoryEntry[] = [];

  // MEMORY.md at agency root
  const memoryMdPath = path.join(AGENCY_ROOT, "MEMORY.md");
  if (existsSync(memoryMdPath)) {
    const content = readFileSync(memoryMdPath, "utf-8");
    const firstLine = content.split("\n")[0] ?? "";
    results.push({
      source: "markdown",
      file: "MEMORY.md",
      title: firstLine.replace(/^#+\s*/, "").trim() || "MEMORY.md",
      summary: firstLine.replace(/^#+\s*/, "").trim() || "Long-term memory file",
      sizeBytes: Buffer.byteLength(content, "utf-8"),
      content: content.slice(0, 2000),
    });
  }

  // Daily notes: memory/*.md
  const dir = path.join(AGENCY_ROOT, "memory");
  if (!existsSync(dir)) return results;

  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort().reverse();
  for (const file of files) {
    const content = readFileSync(path.join(dir, file), "utf-8");
    const firstLine = content.split("\n")[0] ?? "";
    // Extract date from filename if it matches YYYY-MM-DD.md pattern
    const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
    const timestamp = dateMatch ? `${dateMatch[1]}T00:00:00` : undefined;

    results.push({
      source: "markdown",
      file,
      title: firstLine.replace(/^#+\s*/, "").trim() || file,
      summary: firstLine.replace(/^#+\s*/, "").trim() || file.replace(/\.md$/, ""),
      sizeBytes: Buffer.byteLength(content, "utf-8"),
      timestamp,
      content: content.slice(0, 2000),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/memory/timeline
 * Unified timeline built from hive_memory.sqlite rows + memory/*.md files.
 * Query params:
 *   ?limit=50
 */
router.get("/memory/timeline", (req: Request, res: Response): void => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const source = ((req.query.source as string) || "all").toLowerCase();
    const department = ((req.query.department as string) || "").trim().toLowerCase();
    const entries: MemoryEntry[] = [];

    // SQLite rows (table: task_events, column: created_at)
    const db = openHiveDb(true);
    if (db) {
      try {
        const rows = db
          .prepare(
            "SELECT id, created_at, department, bot_handle, task_id, project, status, summary, tags, source_path FROM task_events ORDER BY created_at DESC LIMIT ?",
          )
          .all(limit) as Record<string, unknown>[];

        for (const row of rows) {
          const rowDepartment = String(row.department ?? "");
          if (department && rowDepartment.toLowerCase() !== department) continue;
          entries.push({
            source: "sqlite",
            timestamp: row.created_at as string,
            id: String(row.id),
            department: row.department as string,
            bot_handle: row.bot_handle as string,
            task_id: row.task_id as string,
            project: row.project as string,
            status: row.status as string,
            summary: row.summary as string,
            tags: typeof row.tags === "string" ? (row.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean) : [],
            source_path: row.source_path as string,
          });
        }
      } catch {
        // Table may not exist yet — that's fine
      } finally {
        db.close();
      }
    }

    // Markdown files
    if (source !== "sqlite") {
      const markdownEntries = readMarkdownMemories().filter((entry) => {
        if (!department) return true;
        const haystack = `${String(entry.title ?? "")} ${String(entry.summary ?? "")} ${String(entry.content ?? "")}`.toLowerCase();
        return haystack.includes(department);
      });
      entries.push(...markdownEntries);
    }

    // Sort by timestamp descending where available
    entries.sort(
      (a, b) =>
        new Date(b.timestamp ?? 0).getTime() -
        new Date(a.timestamp ?? 0).getTime(),
    );

    const filteredBySource =
      source === "all" ? entries : entries.filter((entry) => entry.source === source);

    res.json({ entries: filteredBySource.slice(0, limit), total: filteredBySource.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to build memory timeline", detail: message });
  }
});

/**
 * PATCH /api/memory/entry
 * Update one memory entry (sqlite or markdown).
 */
router.patch("/memory/entry", (req: Request, res: Response): void => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const source = String(body.source ?? "");

    if (source === "sqlite") {
      const id = String(body.id ?? "");
      if (!id) {
        res.status(400).json({ error: "Missing sqlite memory id" });
        return;
      }

      const updates: string[] = [];
      const values: unknown[] = [];
      const allowed: Array<keyof typeof body> = ["summary", "status", "project", "department", "tags"];

      for (const field of allowed) {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`);
          if (field === "tags" && Array.isArray(body.tags)) {
            values.push((body.tags as unknown[]).map((v) => String(v).trim()).filter(Boolean).join(","));
          } else {
            values.push(body[field]);
          }
        }
      }

      if (updates.length === 0) {
        res.status(400).json({ error: "No updatable fields provided" });
        return;
      }

      const db = openHiveDb(false);
      if (!db) {
        res.status(404).json({ error: "No hive memory database" });
        return;
      }

      try {
        const statement = `UPDATE task_events SET ${updates.join(", ")} WHERE id = ?`;
        const result = db.prepare(statement).run(...values, id);
        if (!result.changes) {
          res.status(404).json({ error: "Memory entry not found" });
          return;
        }
      } finally {
        db.close();
      }

      res.json({ ok: true });
      return;
    }

    if (source === "markdown") {
      const file = String(body.file ?? "");
      const filePath = safeMemoryFilePath(file);
      if (!file || !filePath) {
        res.status(400).json({ error: "Invalid markdown file path" });
        return;
      }
      if (!existsSync(filePath)) {
        res.status(404).json({ error: "Markdown memory file not found" });
        return;
      }

      const current = readFileSync(filePath, "utf-8");
      let nextContent = current;

      if (typeof body.content === "string") {
        nextContent = body.content;
      } else if (typeof body.title === "string") {
        const lines = current.split("\n");
        const title = body.title.trim();
        if (lines.length === 0) {
          nextContent = title ? `# ${title}\n` : "";
        } else if (lines[0].startsWith("#")) {
          lines[0] = title ? `# ${title}` : lines[0];
          nextContent = lines.join("\n");
        } else if (title) {
          nextContent = `# ${title}\n\n${current}`;
        }
      }

      writeFileSync(filePath, nextContent, "utf-8");
      res.json({ ok: true });
      return;
    }

    res.status(400).json({ error: "Unsupported source" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Memory update failed", detail: message });
  }
});

/**
 * DELETE /api/memory/entry
 * Delete one memory entry (sqlite or markdown).
 */
router.delete("/memory/entry", (req: Request, res: Response): void => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const source = String(body.source ?? "");

    if (source === "sqlite") {
      const id = String(body.id ?? "");
      if (!id) {
        res.status(400).json({ error: "Missing sqlite memory id" });
        return;
      }
      const db = openHiveDb(false);
      if (!db) {
        res.status(404).json({ error: "No hive memory database" });
        return;
      }
      try {
        const result = db.prepare("DELETE FROM task_events WHERE id = ?").run(id);
        if (!result.changes) {
          res.status(404).json({ error: "Memory entry not found" });
          return;
        }
      } finally {
        db.close();
      }
      res.json({ ok: true });
      return;
    }

    if (source === "markdown") {
      const file = String(body.file ?? "");
      const filePath = safeMemoryFilePath(file);
      if (!file || !filePath) {
        res.status(400).json({ error: "Invalid markdown file path" });
        return;
      }
      if (!existsSync(filePath)) {
        res.status(404).json({ error: "Markdown memory file not found" });
        return;
      }
      unlinkSync(filePath);
      res.json({ ok: true });
      return;
    }

    res.status(400).json({ error: "Unsupported source" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Memory deletion failed", detail: message });
  }
});

/**
 * GET /api/memory/search
 * Full-text search across hive_memory.sqlite.
 * Query params:
 *   ?q=search+term
 *   ?limit=20
 */
router.get("/memory/search", (req: Request, res: Response): void => {
  try {
    const query = (req.query.q as string) ?? "";
    const limit = Math.min(Number(req.query.limit) || 20, 200);

    if (!query) {
      res.status(400).json({ error: "Missing search query (?q=…)" });
      return;
    }

    const db = openHiveDb();
    if (!db) {
      res.json({ results: [], total: 0, message: "No hive memory database" });
      return;
    }

    try {
      // Use FTS if available, fallback to LIKE on task_events table.
      const rows = db
        .prepare(
          `SELECT id, created_at, department, bot_handle, task_id, project, status, summary, tags, source_path
           FROM task_events
           WHERE summary LIKE ? OR tags LIKE ? OR project LIKE ?
           ORDER BY created_at DESC
           LIMIT ?`,
        )
        .all(`%${query}%`, `%${query}%`, `%${query}%`, limit) as Record<string, unknown>[];

      const results = rows.map((row) => ({
        source: "sqlite" as const,
        timestamp: row.created_at as string,
        id: String(row.id),
        department: row.department as string,
        bot_handle: row.bot_handle as string,
        task_id: row.task_id as string,
        project: row.project as string,
        status: row.status as string,
        summary: row.summary as string,
        tags: typeof row.tags === "string" ? (row.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        source_path: row.source_path as string,
      }));

      res.json({ results, total: results.length });
    } catch {
      res.json({ results: [], total: 0, message: "Query failed — table may not exist" });
    } finally {
      db.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Memory search failed", detail: message });
  }
});

/**
 * POST /api/memory/inject
 * Accept a file upload and append its content to the daily memory markdown.
 * Uses multer memory storage; field name: "file".
 */
const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/memory/inject", memoryUpload.single("file"), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const memoryDir = path.join(AGENCY_ROOT, "memory");
    mkdirSync(memoryDir, { recursive: true });

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const targetFile = path.join(memoryDir, `${today}.md`);
    const content = req.file.buffer.toString("utf-8");
    const header = `\n\n---\n**Injected: ${req.file.originalname}** (${new Date().toISOString()})\n\n`;

    appendFileSync(targetFile, header + content, "utf-8");

    res.json({ ok: true, message: "Injected", file: req.file.originalname });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Memory injection failed", detail: message });
  }
});

export default router;
