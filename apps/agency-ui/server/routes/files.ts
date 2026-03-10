import { Router, Request, Response } from "express";
import { readFileSync, existsSync, readdirSync, statSync, openSync, readSync, closeSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import multer from "multer";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TreeNode {
  name: string;
  type: "file" | "directory";
  children?: TreeNode[];
  sizeBytes?: number;
}

/**
 * Recursively build a directory tree, capped at a given depth.
 */
function buildTree(dirPath: string, depth: number, maxDepth: number): TreeNode {
  const name = path.basename(dirPath);
  const entries = readdirSync(dirPath);
  const children: TreeNode[] = [];

  for (const entry of entries) {
    // Skip hidden files / node_modules / .git
    if (entry.startsWith(".") || entry === "node_modules") continue;

    const fullPath = path.join(dirPath, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue; // broken symlink, permission error, etc.
    }

    if (stat.isDirectory()) {
      if (depth < maxDepth) {
        children.push(buildTree(fullPath, depth + 1, maxDepth));
      } else {
        children.push({ name: entry, type: "directory" });
      }
    } else {
      children.push({ name: entry, type: "file", sizeBytes: stat.size });
    }
  }

  return { name, type: "directory", children };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/files/tree
 * Returns a directory tree of the agency workspace.
 * Query params:
 *   ?depth=3  — max recursion depth (default 3, max 6)
 *   ?root=…   — relative sub-path within AGENCY_ROOT
 */
router.get("/files/tree", (req: Request, res: Response): void => {
  try {
    const maxDepth = Math.min(Number(req.query.depth) || 3, 6);
    const subPath = (req.query.root as string) ?? "";

    // Prevent directory traversal
    if (subPath.includes("..")) {
      res.status(400).json({ error: "Invalid path" });
      return;
    }

    const targetDir = path.join(AGENCY_ROOT, subPath);
    if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
      res.status(404).json({ error: "Directory not found" });
      return;
    }

    const tree = buildTree(targetDir, 0, maxDepth);
    res.json(tree);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to build file tree", detail: message });
  }
});

/**
 * GET /api/files/read
 * Read the content of a file within the agency workspace.
 * Query params:
 *   ?path=config/agency-config.json  — relative path within AGENCY_ROOT
 *   ?maxSize=102400                  — max bytes to return (default 100 KB)
 */
router.get("/files/read", (req: Request, res: Response): void => {
  try {
    const relativePath = req.query.path as string;
    if (!relativePath) {
      res.status(400).json({ error: "Missing ?path= parameter" });
      return;
    }

    // Prevent directory traversal
    if (relativePath.includes("..")) {
      res.status(400).json({ error: "Invalid path" });
      return;
    }

    const filePath = path.join(AGENCY_ROOT, relativePath);
    if (!existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      res.status(400).json({ error: "Path is a directory, not a file" });
      return;
    }

    const maxSize = Number(req.query.maxSize) || 102400; // 100 KB default
    const ext = path.extname(filePath).toLowerCase();

    if (stat.size > maxSize) {
      // Return truncated content instead of 413 error
      const fd = openSync(filePath, "r");
      const buf = Buffer.alloc(maxSize);
      readSync(fd, buf, 0, maxSize, 0);
      closeSync(fd);
      const truncatedContent = buf.toString("utf-8");

      res.json({
        path: relativePath,
        sizeBytes: stat.size,
        extension: ext,
        content: truncatedContent,
        truncated: true,
        truncatedAt: maxSize,
      });
      return;
    }

    const content = readFileSync(filePath, "utf-8");

    res.json({
      path: relativePath,
      sizeBytes: stat.size,
      extension: ext,
      content,
      truncated: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read file", detail: message });
  }
});

/**
 * POST /api/files/upload
 * Upload a file to the agency workspace via multipart/form-data.
 * Query params:
 *   ?dest=sub/path  — relative sub-path within AGENCY_ROOT (default: "desk/inbox")
 * Max file size: 10 MB
 */
const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dest = ((_req as Request).query.dest as string) ?? "desk/inbox";
    const targetDir = path.join(AGENCY_ROOT, dest);
    mkdirSync(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: uploadStorage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/files/upload", (req: Request, res: Response, next) => {
  const dest = (req.query.dest as string) ?? "desk/inbox";
  if (dest.includes("..")) {
    res.status(400).json({ error: "Invalid destination path" });
    return;
  }
  next();
}, upload.single("file"), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const dest = (req.query.dest as string) ?? "desk/inbox";
    const relativePath = path.join(dest, req.file.filename);
    res.json({ ok: true, path: relativePath, filename: req.file.filename, size: req.file.size });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Upload failed", detail: message });
  }
});

/**
 * PUT /api/files/write
 * Write content to a file in the agency workspace.
 * Body: { path: string, content: string }
 */
router.put("/files/write", (req: Request, res: Response): void => {
  try {
    const { path: filePath, content } = req.body as { path: string; content: string };

    if (!filePath || content == null) {
      res.status(400).json({ error: "Missing path or content in request body" });
      return;
    }

    if (filePath.includes("..")) {
      res.status(400).json({ error: "Invalid path" });
      return;
    }

    const fullPath = path.join(AGENCY_ROOT, filePath);
    mkdirSync(path.dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, "utf-8");

    res.json({ ok: true, path: filePath, size: Buffer.byteLength(content) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to write file", detail: message });
  }
});

export default router;
