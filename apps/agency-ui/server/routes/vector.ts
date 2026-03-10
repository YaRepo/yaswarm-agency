import { Router, Request, Response } from "express";
import { readFileSync, existsSync, readdirSync } from "fs";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import http from "http";
import { createRequire } from "module";
import multer from "multer";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";
const CHROMA_URL =
  process.env.CHROMA_URL || "http://yaswarm-chromadb:8000";
const COLLECTION_NAME = "agency_knowledge";
const DATA_DIR = "/data/yaswarm-dashboard-data";
const VECTOR_EXCLUDE_LEGACY_TERMS = process.env.VECTOR_EXCLUDE_LEGACY_TERMS !== "0";
const LEGACY_VECTOR_TERMS = [
  /\bopenclaw\b/i,
  /\b\.openclaw\b/i,
  /\byamac\b/i,
];

const router = Router();

// ---------------------------------------------------------------------------
// Embedding model — lazy-loaded singleton
// ---------------------------------------------------------------------------

let embedPipeline: any = null;
let modelLoading = false;
let modelLoadPromise: Promise<void> | null = null;

export async function getEmbedder(): Promise<any> {
  if (embedPipeline) return embedPipeline;
  if (modelLoadPromise) {
    await modelLoadPromise;
    return embedPipeline;
  }
  modelLoading = true;
  modelLoadPromise = (async () => {
    try {
      // @xenova/transformers is CJS-compatible
      const require = createRequire(import.meta.url);
      const { pipeline, env } = require("@xenova/transformers");

      // onnxruntime-node is removed in Docker (crashes on Alpine/musl),
      // so transformers automatically uses onnxruntime-web (WASM) instead.
      // Disable multi-threading for WASM in Node.js server context.
      env.backends.onnx.wasm.numThreads = 1;

      console.log("[Vector] Loading all-MiniLM-L6-v2 embedding model (WASM)...");
      embedPipeline = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
      );
      console.log("[Vector] Embedding model loaded successfully");
    } catch (err) {
      console.error(
        "[Vector] Failed to load embedding model:",
        err instanceof Error ? err.message : err,
      );
      throw err;
    } finally {
      modelLoading = false;
    }
  })();
  await modelLoadPromise;
  return embedPipeline;
}

/**
 * Generate embedding for a single text string.
 * Returns a 384-dim float array (all-MiniLM-L6-v2).
 */
async function embed(text: string): Promise<number[]> {
  const extractor = await getEmbedder();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

/**
 * Batch embed multiple texts (one at a time to avoid OOM on small containers).
 */
async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embed(text));
  }
  return results;
}

// ---------------------------------------------------------------------------
// ChromaDB REST client (lightweight, no npm dependency)
// ---------------------------------------------------------------------------

const CHROMA_BASE = (() => {
  const u = new URL(CHROMA_URL);
  return {
    hostname: u.hostname,
    port: Number(u.port) || 8000,
    basePath:
      "/api/v2/tenants/default_tenant/databases/default_database",
  };
})();

function chromaRequest(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : "";
    const headers: Record<string, string | number> = {
      "Content-Type": "application/json",
    };
    if (bodyStr) {
      headers["Content-Length"] = Buffer.byteLength(bodyStr);
    }
    const opts: http.RequestOptions = {
      hostname: CHROMA_BASE.hostname,
      port: CHROMA_BASE.port,
      path: CHROMA_BASE.basePath + path,
      method,
      headers,
      timeout: 30000,
    };

    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (d) => (data += d));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode ?? 500, data: JSON.parse(data || "{}") });
        } catch {
          resolve({ status: res.statusCode ?? 500, data: data });
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("ChromaDB request timed out"));
    });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Collection management
// ---------------------------------------------------------------------------

let collectionId: string | null = null;

async function ensureCollection(): Promise<string> {
  if (collectionId) return collectionId;

  // List existing collections
  const listRes = await chromaRequest("GET", "/collections");
  if (listRes.status === 200 && Array.isArray(listRes.data)) {
    const existing = listRes.data.find(
      (c: any) => c.name === COLLECTION_NAME,
    );
    if (existing) {
      collectionId = existing.id;
      return collectionId!;
    }
  }

  // Create new collection
  const createRes = await chromaRequest("POST", "/collections", {
    name: COLLECTION_NAME,
    metadata: {
      description: "YaSwarm Agency knowledge base for semantic search",
      created: new Date().toISOString(),
    },
  });

  if (createRes.status >= 200 && createRes.status < 300) {
    collectionId = createRes.data.id;
    console.log(`[Vector] Created collection ${COLLECTION_NAME} (${collectionId})`);
    return collectionId!;
  }

  throw new Error(
    `Failed to create ChromaDB collection: ${createRes.status} ${JSON.stringify(createRes.data)}`,
  );
}

async function purgeLegacyVectors(cid?: string): Promise<void> {
  if (!VECTOR_EXCLUDE_LEGACY_TERMS) return;
  const targetCollectionId = cid || (await ensureCollection());
  const purgeTerms = ["openclaw", ".openclaw", "yamac"];
  for (const term of purgeTerms) {
    const res = await chromaRequest(
      "POST",
      `/collections/${targetCollectionId}/delete`,
      { where_document: { $contains: term } },
    );
    if (res.status >= 200 && res.status < 300) {
      console.log(`[Vector] Purged legacy vectors for term "${term}"`);
    } else {
      console.warn(
        `[Vector] Legacy purge failed for term "${term}":`,
        res.status,
        res.data,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Indexing state
// ---------------------------------------------------------------------------

interface IndexState {
  lastIndexed: string | null;
  totalDocs: number;
  sourceCounts: Record<string, number>;
  indexing: boolean;
  lastError: string | null;
}

let indexState: IndexState = {
  lastIndexed: null,
  totalDocs: 0,
  sourceCounts: {},
  indexing: false,
  lastError: null,
};

function loadIndexState(): void {
  const stateFile = path.join(DATA_DIR, "vector-index-state.json");
  if (existsSync(stateFile)) {
    try {
      const raw = JSON.parse(readFileSync(stateFile, "utf-8"));
      indexState = { ...indexState, ...raw, indexing: false };
    } catch {
      // ignore
    }
  }
}

function saveIndexState(): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(
      path.join(DATA_DIR, "vector-index-state.json"),
      JSON.stringify(indexState, null, 2),
    );
  } catch {
    // non-fatal
  }
}

loadIndexState();

// ---------------------------------------------------------------------------
// Content source extractors
// ---------------------------------------------------------------------------

interface DocChunk {
  id: string;
  text: string;
  metadata: Record<string, string>;
}

function isLegacyChunk(chunk: DocChunk): boolean {
  if (!VECTOR_EXCLUDE_LEGACY_TERMS) return false;
  const haystack = `${chunk.id}\n${chunk.text}\n${Object.values(chunk.metadata || {}).join("\n")}`;
  return LEGACY_VECTOR_TERMS.some((pattern) => pattern.test(haystack));
}

/**
 * Source 1: Hive SQL task_events
 */
function extractHiveEvents(): DocChunk[] {
  const chunks: DocChunk[] = [];
  let BetterSqlite3: any = null;
  try {
    const require = createRequire(import.meta.url);
    BetterSqlite3 = require("better-sqlite3");
  } catch {
    return chunks;
  }

  const dbPath = path.join(AGENCY_ROOT, "logs", "hive_memory.sqlite");
  if (!existsSync(dbPath)) return chunks;

  try {
    const db = new BetterSqlite3(dbPath, { readonly: true });
    const rows = db
      .prepare(
        "SELECT id, created_at, department, bot_handle, task_id, project, status, summary, details, tags FROM task_events ORDER BY created_at DESC",
      )
      .all() as any[];
    db.close();

    for (const row of rows) {
      const parts = [row.summary || ""];
      if (row.details) parts.push(row.details);
      if (row.tags) parts.push(`Tags: ${row.tags}`);
      if (row.project) parts.push(`Project: ${row.project}`);

      const text = parts.filter(Boolean).join("\n").trim();
      if (!text) continue;

      chunks.push({
        id: `hive-${row.id}`,
        text,
        metadata: {
          source: "hive_sql",
          department: row.department || "",
          status: row.status || "",
          project: row.project || "",
          task_id: row.task_id || "",
          timestamp: row.created_at || "",
        },
      });
    }
  } catch (err) {
    console.error("[Vector] Failed to extract hive events:", err);
  }

  return chunks;
}

/**
 * Source 2: Daily memory notes (memory/*.md)
 */
function extractDailyMemory(): DocChunk[] {
  const chunks: DocChunk[] = [];
  const dir = path.join(AGENCY_ROOT, "memory");
  if (!existsSync(dir)) return chunks;

  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    try {
      const content = readFileSync(path.join(dir, file), "utf-8");
      const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
      const date = dateMatch ? dateMatch[1] : file;

      // Split by ## headers into sections
      const sections = content.split(/(?=^## )/m).filter((s) => s.trim());
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (section.length < 20) continue; // Skip tiny sections

        // Further chunk large sections (~500 chars each)
        if (section.length > 800) {
          const paragraphs = section.split(/\n\n+/);
          let chunk = "";
          let chunkIdx = 0;
          for (const para of paragraphs) {
            if (chunk.length + para.length > 600 && chunk.length > 100) {
              chunks.push({
                id: `memory-${file}-s${i}-c${chunkIdx}`,
                text: chunk.trim(),
                metadata: {
                  source: "daily_memory",
                  file,
                  date,
                },
              });
              chunkIdx++;
              chunk = para;
            } else {
              chunk += (chunk ? "\n\n" : "") + para;
            }
          }
          if (chunk.trim().length > 20) {
            chunks.push({
              id: `memory-${file}-s${i}-c${chunkIdx}`,
              text: chunk.trim(),
              metadata: { source: "daily_memory", file, date },
            });
          }
        } else {
          chunks.push({
            id: `memory-${file}-s${i}`,
            text: section,
            metadata: { source: "daily_memory", file, date },
          });
        }
      }
    } catch {
      // skip unreadable files
    }
  }

  return chunks;
}

/**
 * Source 3: MEMORY.md (long-term curated memory)
 */
function extractMainMemory(): DocChunk[] {
  const chunks: DocChunk[] = [];
  const memPath = path.join(AGENCY_ROOT, "MEMORY.md");
  if (!existsSync(memPath)) return chunks;

  try {
    const content = readFileSync(memPath, "utf-8");
    const sections = content.split(/(?=^## )/m).filter((s) => s.trim());
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (section.length < 20) continue;

      // Chunk large sections
      if (section.length > 800) {
        const paragraphs = section.split(/\n\n+/);
        let chunk = "";
        let chunkIdx = 0;
        for (const para of paragraphs) {
          if (chunk.length + para.length > 600 && chunk.length > 100) {
            chunks.push({
              id: `mainmem-s${i}-c${chunkIdx}`,
              text: chunk.trim(),
              metadata: { source: "main_memory", file: "MEMORY.md" },
            });
            chunkIdx++;
            chunk = para;
          } else {
            chunk += (chunk ? "\n\n" : "") + para;
          }
        }
        if (chunk.trim().length > 20) {
          chunks.push({
            id: `mainmem-s${i}-c${chunkIdx}`,
            text: chunk.trim(),
            metadata: { source: "main_memory", file: "MEMORY.md" },
          });
        }
      } else {
        chunks.push({
          id: `mainmem-s${i}`,
          text: section,
          metadata: { source: "main_memory", file: "MEMORY.md" },
        });
      }
    }
  } catch {
    // skip
  }

  return chunks;
}

/**
 * Source 4: Desk artifacts (desk/review/*, desk/done/*)
 */
function extractDeskArtifacts(): DocChunk[] {
  const chunks: DocChunk[] = [];
  const stages = ["review", "done"];

  for (const stage of stages) {
    const stageDir = path.join(AGENCY_ROOT, "desk", stage);
    if (!existsSync(stageDir)) continue;

    try {
      const entries = readdirSync(stageDir, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(stageDir, entry.name);

        if (entry.isDirectory()) {
          // Task folder — read files inside
          try {
            const taskFiles = readdirSync(entryPath);
            for (const tf of taskFiles) {
              if (!tf.endsWith(".md") && !tf.endsWith(".json") && !tf.endsWith(".txt")) continue;
              try {
                const content = readFileSync(path.join(entryPath, tf), "utf-8");
                if (content.length < 20) continue;
                chunks.push({
                  id: `desk-${stage}-${entry.name}-${tf}`,
                  text: content.slice(0, 1500),
                  metadata: {
                    source: "desk",
                    stage,
                    task_id: entry.name,
                    file: tf,
                  },
                });
              } catch {
                // skip unreadable
              }
            }
          } catch {
            // skip
          }
        } else if (
          entry.name.endsWith(".md") ||
          entry.name.endsWith(".json") ||
          entry.name.endsWith(".txt")
        ) {
          try {
            const content = readFileSync(entryPath, "utf-8");
            if (content.length < 20) continue;
            chunks.push({
              id: `desk-${stage}-${entry.name}`,
              text: content.slice(0, 1500),
              metadata: { source: "desk", stage, file: entry.name },
            });
          } catch {
            // skip
          }
        }
      }
    } catch {
      // skip
    }
  }

  return chunks;
}

/**
 * Source 5: Skill docs (skills/* /SKILL.md)
 */
function extractSkillDocs(): DocChunk[] {
  const chunks: DocChunk[] = [];
  const skillsDir = path.join(AGENCY_ROOT, "skills");
  if (!existsSync(skillsDir)) return chunks;

  try {
    const dirs = readdirSync(skillsDir, { withFileTypes: true }).filter(
      (d) => d.isDirectory(),
    );

    for (const dir of dirs) {
      const skillMd = path.join(skillsDir, dir.name, "SKILL.md");
      if (!existsSync(skillMd)) continue;

      try {
        const content = readFileSync(skillMd, "utf-8");
        if (content.length < 20) continue;

        chunks.push({
          id: `skill-${dir.name}`,
          text: content.slice(0, 2000),
          metadata: {
            source: "skills",
            skill_name: dir.name,
            file: `skills/${dir.name}/SKILL.md`,
          },
        });
      } catch {
        // skip
      }
    }
  } catch {
    // skip
  }

  return chunks;
}

/**
 * Source 6: Bridge logs (telegram events + dept history)
 */
function extractBridgeLogs(): DocChunk[] {
  const chunks: DocChunk[] = [];

  // telegram-bridge.events.jsonl
  const eventsPath = path.join(
    AGENCY_ROOT,
    "logs",
    "telegram-bridge.events.jsonl",
  );
  if (existsSync(eventsPath)) {
    try {
      const lines = readFileSync(eventsPath, "utf-8")
        .split("\n")
        .filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        try {
          const event = JSON.parse(lines[i]);
          const text = event.text || event.message || "";
          if (!text || text.length < 10) continue;

          chunks.push({
            id: `tg-event-${i}`,
            text: `[${event.from_username || "unknown"}] ${text}`,
            metadata: {
              source: "bridge_logs",
              type: "telegram_event",
              thread_id: String(event.thread_id || ""),
              timestamp: event.timestamp || event.date || "",
            },
          });
        } catch {
          // skip malformed lines
        }
      }
    } catch {
      // skip
    }
  }

  // dept-*.history.json
  const logsDir = path.join(AGENCY_ROOT, "logs");
  if (existsSync(logsDir)) {
    try {
      const histFiles = readdirSync(logsDir).filter(
        (f) => f.startsWith("dept-") && f.endsWith(".history.json"),
      );

      for (const file of histFiles) {
        const deptMatch = file.match(/^dept-(.+)\.history\.json$/);
        const dept = deptMatch ? deptMatch[1] : "unknown";

        try {
          const content = JSON.parse(
            readFileSync(path.join(logsDir, file), "utf-8"),
          );

          // Content is keyed by chat_id:thread_id
          for (const [chatKey, messages] of Object.entries(content)) {
            if (!Array.isArray(messages)) continue;

            // Group into conversation chunks (5 messages each)
            for (let i = 0; i < messages.length; i += 5) {
              const batch = (messages as any[]).slice(i, i + 5);
              const text = batch
                .map((m: any) => `[${m.role}] ${m.text || ""}`)
                .join("\n")
                .trim();
              if (text.length < 20) continue;

              chunks.push({
                id: `dept-${dept}-${chatKey}-${i}`,
                text: text.slice(0, 1000),
                metadata: {
                  source: "bridge_logs",
                  type: "dept_history",
                  department: dept,
                  chat_key: chatKey,
                },
              });
            }
          }
        } catch {
          // skip
        }
      }
    } catch {
      // skip
    }
  }

  return chunks;
}

// Source name -> extractor mapping
const SOURCE_EXTRACTORS: Record<string, () => DocChunk[]> = {
  hive_sql: extractHiveEvents,
  daily_memory: extractDailyMemory,
  main_memory: extractMainMemory,
  desk: extractDeskArtifacts,
  skills: extractSkillDocs,
  bridge_logs: extractBridgeLogs,
};

// ---------------------------------------------------------------------------
// Indexing pipeline
// ---------------------------------------------------------------------------

/**
 * Index documents into ChromaDB. Handles batching to avoid large payloads.
 */
async function indexDocuments(
  chunks: DocChunk[],
  source: string,
): Promise<number> {
  if (chunks.length === 0) return 0;

  const filteredChunks = chunks.filter((chunk) => !isLegacyChunk(chunk));
  const skippedLegacy = chunks.length - filteredChunks.length;
  if (skippedLegacy > 0) {
    console.log(
      `[Vector] Skipped ${skippedLegacy} legacy chunks for ${source} (openclaw/yamac filter)`,
    );
  }
  if (filteredChunks.length === 0) return 0;

  const cid = await ensureCollection();
  const BATCH_SIZE = 20;
  let indexed = 0;

  for (let i = 0; i < filteredChunks.length; i += BATCH_SIZE) {
    const batch = filteredChunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.text);
    const embeddings = await embedBatch(texts);

    const addRes = await chromaRequest(
      "POST",
      `/collections/${cid}/add`,
      {
        ids: batch.map((c) => c.id),
        documents: texts,
        embeddings,
        metadatas: batch.map((c) => c.metadata),
      },
    );

    if (addRes.status >= 200 && addRes.status < 300) {
      indexed += batch.length;
    } else if (addRes.status === 400 && addRes.data?.message?.includes?.("already exists")) {
      // IDs already exist — try upsert approach: delete then re-add
      await chromaRequest("POST", `/collections/${cid}/delete`, {
        ids: batch.map((c) => c.id),
      });
      const retryRes = await chromaRequest(
        "POST",
        `/collections/${cid}/add`,
        {
          ids: batch.map((c) => c.id),
          documents: texts,
          embeddings,
          metadatas: batch.map((c) => c.metadata),
        },
      );
      if (retryRes.status >= 200 && retryRes.status < 300) {
        indexed += batch.length;
      } else {
        console.error(
          `[Vector] Failed to index batch ${i}-${i + batch.length} for ${source}:`,
          retryRes.data,
        );
      }
    } else {
      console.error(
        `[Vector] Failed to index batch ${i}-${i + batch.length} for ${source}:`,
        addRes.data,
      );
    }
  }

  console.log(`[Vector] Indexed ${indexed}/${filteredChunks.length} chunks for ${source}`);
  return indexed;
}

/**
 * Run full indexing pipeline for all sources or a specific source.
 */
async function runIndexing(source?: string): Promise<{
  totalChunks: number;
  indexed: number;
  sourceCounts: Record<string, number>;
  errors: string[];
}> {
  const sourceCounts: Record<string, number> = {};
  const errors: string[] = [];
  let totalChunks = 0;
  let totalIndexed = 0;

  const sources = source
    ? { [source]: SOURCE_EXTRACTORS[source] }
    : SOURCE_EXTRACTORS;

  if (source && !SOURCE_EXTRACTORS[source]) {
    throw new Error(
      `Unknown source: ${source}. Available: ${Object.keys(SOURCE_EXTRACTORS).join(", ")}`,
    );
  }

  // If re-indexing everything, clear the collection first
  if (!source) {
    try {
      const cid = await ensureCollection();
      // Delete and recreate for clean re-index
      await chromaRequest("DELETE", `/collections/${cid}`);
      collectionId = null; // Force re-creation
      await ensureCollection();
      console.log("[Vector] Collection cleared for full re-index");
    } catch (err) {
      console.warn("[Vector] Could not clear collection:", err);
    }
  }

  for (const [srcName, extractor] of Object.entries(sources)) {
    try {
      console.log(`[Vector] Extracting ${srcName}...`);
      const chunks = extractor();
      totalChunks += chunks.length;
      console.log(`[Vector] Extracted ${chunks.length} chunks from ${srcName}`);

      const indexed = await indexDocuments(chunks, srcName);
      sourceCounts[srcName] = indexed;
      totalIndexed += indexed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${srcName}: ${msg}`);
      console.error(`[Vector] Error indexing ${srcName}:`, msg);
    }
  }

  if (!source) {
    try {
      const cid = await ensureCollection();
      await purgeLegacyVectors(cid);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`legacy_purge: ${msg}`);
      console.warn("[Vector] Legacy purge step failed:", msg);
    }
  }

  return { totalChunks, indexed: totalIndexed, sourceCounts, errors };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/vector/stats
 * Return collection statistics and index state.
 */
router.get("/vector/stats", async (_req: Request, res: Response) => {
  try {
    let collectionStats: any = null;

    try {
      const cid = await ensureCollection();
      const countRes = await chromaRequest(
        "GET",
        `/collections/${cid}/count`,
      );
      // ChromaDB v1.0 count returns a raw number (e.g. 416), not JSON
      const countVal = typeof countRes.data === "number"
        ? countRes.data
        : typeof countRes.data === "string"
        ? parseInt(countRes.data, 10) || 0
        : 0;
      collectionStats = {
        id: cid,
        name: COLLECTION_NAME,
        count: countVal,
      };
    } catch {
      collectionStats = { error: "ChromaDB not reachable" };
    }

    res.json({
      collection: collectionStats,
      lastIndexed: indexState.lastIndexed,
      totalDocs: indexState.totalDocs,
      sourceCounts: indexState.sourceCounts,
      indexing: indexState.indexing,
      lastError: indexState.lastError,
      modelLoaded: embedPipeline !== null,
      modelLoading,
      availableSources: Object.keys(SOURCE_EXTRACTORS),
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to get vector stats",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * POST /api/vector/index
 * Trigger full re-indexing of all content sources.
 * Body: { source?: string } — optional, index specific source only
 */
router.post("/vector/index", async (req: Request, res: Response) => {
  if (indexState.indexing) {
    res.status(409).json({
      error: "Indexing already in progress",
      startedAt: indexState.lastIndexed,
    });
    return;
  }

  const { source } = req.body || {};

  // Start indexing in background (respond immediately)
  indexState.indexing = true;
  indexState.lastError = null;

  // Non-blocking — start the indexing pipeline
  runIndexing(source as string | undefined)
    .then((result) => {
      indexState.lastIndexed = new Date().toISOString();
      indexState.totalDocs = result.indexed;
      indexState.sourceCounts = result.sourceCounts;
      indexState.lastError =
        result.errors.length > 0 ? result.errors.join("; ") : null;
      indexState.indexing = false;
      saveIndexState();
      console.log(
        `[Vector] Indexing complete: ${result.indexed}/${result.totalChunks} chunks indexed`,
      );
    })
    .catch((err) => {
      indexState.indexing = false;
      indexState.lastError = err instanceof Error ? err.message : String(err);
      saveIndexState();
      console.error("[Vector] Indexing failed:", err);
    });

  res.json({
    status: "started",
    message: source
      ? `Indexing source: ${source}`
      : "Full re-indexing started for all sources",
    availableSources: Object.keys(SOURCE_EXTRACTORS),
  });
});

/**
 * GET /api/vector/search
 * Semantic search across indexed content.
 * Query params:
 *   ?q=search+query (required)
 *   ?n=10 (number of results, default 10)
 *   ?source=hive_sql (optional source filter)
 */
router.get("/vector/search", async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) ?? "";
    const nResults = Math.min(Number(req.query.n) || 10, 50);
    const sourceFilter = req.query.source as string | undefined;

    if (!query.trim()) {
      res.status(400).json({ error: "Missing search query (?q=...)" });
      return;
    }

    // Generate query embedding
    const queryEmbedding = await embed(query);

    const cid = await ensureCollection();

    // Build query payload
    const queryPayload: any = {
      query_embeddings: [queryEmbedding],
      n_results: nResults,
      include: ["documents", "metadatas", "distances"],
    };

    // Add source filter if specified
    if (sourceFilter) {
      queryPayload.where = { source: sourceFilter };
    }

    const queryRes = await chromaRequest(
      "POST",
      `/collections/${cid}/query`,
      queryPayload,
    );

    if (queryRes.status !== 200) {
      res.status(502).json({
        error: "ChromaDB query failed",
        detail: queryRes.data,
      });
      return;
    }

    // Transform results
    const documents = queryRes.data.documents?.[0] ?? [];
    const metadatas = queryRes.data.metadatas?.[0] ?? [];
    const distances = queryRes.data.distances?.[0] ?? [];
    const ids = queryRes.data.ids?.[0] ?? [];

    const results = documents.map((doc: string, i: number) => ({
      id: ids[i],
      text: doc,
      metadata: metadatas[i] || {},
      distance: distances[i],
      // Convert L2 distance to similarity score (0-1, higher = more similar)
      similarity: Math.max(0, 1 - distances[i] / 2),
    }));

    res.json({
      query,
      results,
      total: results.length,
      source: sourceFilter || "all",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: "Semantic search failed",
      detail: message,
    });
  }
});

/**
 * DELETE /api/vector/entries
 * Remove specific vector documents from ChromaDB by ID.
 * Body: { ids: string[] }
 */
router.delete("/vector/entries", async (req: Request, res: Response) => {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? (req.body.ids as unknown[]).map((v) => String(v)).filter(Boolean)
      : [];

    if (ids.length === 0) {
      res.status(400).json({ error: "Missing ids[] for deletion" });
      return;
    }

    const cid = await ensureCollection();
    const delRes = await chromaRequest(
      "POST",
      `/collections/${cid}/delete`,
      { ids },
    );

    if (delRes.status < 200 || delRes.status >= 300) {
      res.status(502).json({
        error: "ChromaDB delete failed",
        detail: delRes.data,
      });
      return;
    }

    // Refresh total count from ChromaDB after deletion
    const countRes = await chromaRequest("GET", `/collections/${cid}/count`);
    const countVal = typeof countRes.data === "number"
      ? countRes.data
      : typeof countRes.data === "string"
      ? parseInt(countRes.data, 10) || 0
      : indexState.totalDocs;
    indexState.totalDocs = countVal;
    saveIndexState();

    res.json({
      ok: true,
      deleted: ids.length,
      count: countVal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: "Vector deletion failed",
      detail: message,
    });
  }
});

/**
 * POST /api/vector/purge-legacy
 * Remove legacy-system references from vector DB (openclaw/yamac).
 */
router.post("/vector/purge-legacy", async (_req: Request, res: Response) => {
  try {
    const cid = await ensureCollection();
    await purgeLegacyVectors(cid);
    const countRes = await chromaRequest("GET", `/collections/${cid}/count`);
    const countVal = typeof countRes.data === "number"
      ? countRes.data
      : typeof countRes.data === "string"
      ? parseInt(countRes.data, 10) || 0
      : indexState.totalDocs;
    indexState.totalDocs = countVal;
    saveIndexState();
    res.json({ ok: true, count: countVal });
  } catch (err) {
    res.status(500).json({
      error: "Legacy purge failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * GET /api/vector/health
 * Quick health check for ChromaDB connectivity.
 */
router.get("/vector/health", async (_req: Request, res: Response) => {
  try {
    const cid = await ensureCollection();
    const countRes = await chromaRequest("GET", `/collections/${cid}/count`);
    const connected = countRes.status >= 200 && countRes.status < 300;
    res.json({
      chromadb: connected ? "connected" : "error",
      modelLoaded: embedPipeline !== null,
      modelLoading,
      collection: cid,
      count: connected ? countRes.data : 0,
    });
  } catch (err) {
    res.json({
      chromadb: "unreachable",
      error: err instanceof Error ? err.message : String(err),
      modelLoaded: embedPipeline !== null,
      modelLoading,
    });
  }
});

// ---------------------------------------------------------------------------
// File upload to vector database
// ---------------------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/**
 * Extract text content from uploaded file buffer.
 * Supports: .txt, .md, .json, .yaml, .yml, .toml, .csv, .log, .py, .ts, .js,
 *           .tsx, .jsx, .html, .css, .sh, .sql, .xml, and other plain-text formats.
 */
function extractTextFromFile(
  buffer: Buffer,
  filename: string,
): string | null {
  const ext = path.extname(filename).toLowerCase();

  // Plain-text formats — just decode UTF-8
  const textExtensions = new Set([
    ".txt", ".md", ".markdown", ".json", ".yaml", ".yml", ".toml", ".csv",
    ".tsv", ".log", ".py", ".ts", ".js", ".tsx", ".jsx", ".html", ".htm",
    ".css", ".scss", ".less", ".sh", ".bash", ".zsh", ".sql", ".xml",
    ".rst", ".tex", ".cfg", ".ini", ".env", ".conf", ".diff", ".patch",
    ".r", ".rb", ".go", ".rs", ".java", ".kt", ".swift", ".c", ".cpp",
    ".h", ".hpp", ".lua", ".pl", ".php", ".dockerfile", "",
  ]);

  if (textExtensions.has(ext) || ext === "") {
    const text = buffer.toString("utf-8");
    // Basic binary detection — if it has too many null bytes, reject
    if (text.includes("\0")) return null;
    return text;
  }

  // JSONL — join lines
  if (ext === ".jsonl" || ext === ".ndjson") {
    return buffer.toString("utf-8");
  }

  return null; // Unsupported binary format
}

/**
 * Chunk text into pieces suitable for embedding (~500 chars each).
 * Tries to split on section headers, then paragraphs, then by size.
 */
function chunkText(
  text: string,
  fileId: string,
  filename: string,
): DocChunk[] {
  const chunks: DocChunk[] = [];
  const CHUNK_SIZE = 600;

  // Try splitting by markdown headers first
  const sections = text.split(/(?=^#{1,3} )/m).filter((s) => s.trim());

  if (sections.length > 1) {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section) continue;

      // If section is too large, split further by paragraphs
      if (section.length > CHUNK_SIZE * 2) {
        const paragraphs = section.split(/\n\n+/).filter((p) => p.trim());
        let current = "";
        let partIdx = 0;
        for (const para of paragraphs) {
          if (current.length + para.length > CHUNK_SIZE && current.length > 0) {
            chunks.push({
              id: `upload-${fileId}-s${i}-p${partIdx}`,
              text: current.trim(),
              metadata: { source: "upload", filename, section: String(i), part: String(partIdx) },
            });
            partIdx++;
            current = "";
          }
          current += (current ? "\n\n" : "") + para;
        }
        if (current.trim()) {
          chunks.push({
            id: `upload-${fileId}-s${i}-p${partIdx}`,
            text: current.trim(),
            metadata: { source: "upload", filename, section: String(i), part: String(partIdx) },
          });
        }
      } else {
        chunks.push({
          id: `upload-${fileId}-s${i}`,
          text: section,
          metadata: { source: "upload", filename, section: String(i) },
        });
      }
    }
  } else {
    // No headers — split by paragraphs or fixed size
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
    let current = "";
    let partIdx = 0;

    for (const para of paragraphs) {
      if (current.length + para.length > CHUNK_SIZE && current.length > 0) {
        chunks.push({
          id: `upload-${fileId}-${partIdx}`,
          text: current.trim(),
          metadata: { source: "upload", filename, chunk: String(partIdx) },
        });
        partIdx++;
        current = "";
      }
      current += (current ? "\n\n" : "") + para;
    }
    if (current.trim()) {
      chunks.push({
        id: `upload-${fileId}-${partIdx}`,
        text: current.trim(),
        metadata: { source: "upload", filename, chunk: String(partIdx) },
      });
    }
  }

  // Fallback: if no chunks produced (e.g. no paragraphs), treat as single chunk
  if (chunks.length === 0 && text.trim()) {
    // Split by fixed size for very long single-paragraph texts
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push({
        id: `upload-${fileId}-${chunks.length}`,
        text: text.slice(i, i + CHUNK_SIZE).trim(),
        metadata: { source: "upload", filename, chunk: String(chunks.length) },
      });
    }
  }

  return chunks;
}

// Track per-file upload indexing status
interface UploadJob {
  fileId: string;
  filename: string;
  status: "processing" | "done" | "error";
  chunks: number;
  indexed: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

const uploadJobs: Map<string, UploadJob> = new Map();

/**
 * POST /api/vector/upload
 * Upload a file to be embedded and indexed into the vector database.
 * Multipart form-data with field name "file".
 * Returns immediately with a job ID; indexing runs in background.
 * Poll GET /api/vector/upload/:jobId for status.
 */
router.post(
  "/vector/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded. Use field name 'file'." });
      return;
    }

    const filename = file.originalname || "unknown";
    const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Extract text
    const text = extractTextFromFile(file.buffer, filename);
    if (!text || text.trim().length === 0) {
      res.status(400).json({
        error: "Could not extract text from file",
        detail: `File "${filename}" appears to be binary or empty. Supported: text, markdown, JSON, YAML, CSV, code files, logs.`,
      });
      return;
    }

    // Create chunks
    const chunks = chunkText(text, fileId, filename);
    if (chunks.length === 0) {
      res.status(400).json({
        error: "No content to index",
        detail: "File produced zero text chunks after processing.",
      });
      return;
    }

    // Create job tracking entry
    const job: UploadJob = {
      fileId,
      filename,
      status: "processing",
      chunks: chunks.length,
      indexed: 0,
      startedAt: new Date().toISOString(),
    };
    uploadJobs.set(fileId, job);

    // Respond immediately — indexing runs async
    res.json({
      status: "processing",
      fileId,
      filename,
      chunks: chunks.length,
      textLength: text.length,
      message: `File accepted. Embedding ${chunks.length} chunks. Poll /api/vector/upload/${fileId} for status.`,
    });

    // Background indexing
    (async () => {
      try {
        const indexed = await indexDocuments(chunks, "upload");
        job.indexed = indexed;
        job.status = "done";
        job.completedAt = new Date().toISOString();

        // Update index state to reflect upload
        indexState.totalDocs += indexed;
        indexState.sourceCounts.upload =
          (indexState.sourceCounts.upload || 0) + indexed;
        saveIndexState();

        console.log(
          `[Vector] Upload indexed: ${indexed}/${chunks.length} chunks from "${filename}"`,
        );
      } catch (err) {
        job.status = "error";
        job.error = err instanceof Error ? err.message : String(err);
        job.completedAt = new Date().toISOString();
        console.error(`[Vector] Upload indexing failed for "${filename}":`, err);
      }
    })();
  },
);

/**
 * GET /api/vector/upload/:fileId
 * Poll the status of an upload indexing job.
 */
router.get("/vector/upload/:fileId", (req: Request, res: Response) => {
  const fileId = String(req.params.fileId ?? "");
  const job = uploadJobs.get(fileId);
  if (!job) {
    res.status(404).json({ error: "Upload job not found" });
    return;
  }
  res.json(job);
});

export default router;
