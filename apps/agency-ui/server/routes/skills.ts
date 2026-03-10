import { Router, Request, Response } from "express";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";
const YASWARM_ROOT = process.env.YASWARM_ROOT || "/root/yaswarm-swarm";

const router = Router();

function firstExistingPath(paths: string[]): string | null {
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

function normalizeSkillCategory(skill: any): string {
  const explicit = String(skill?.category || "").trim().toLowerCase();
  if (explicit) return explicit;

  const id = String(skill?.skill_id || "").toLowerCase();
  const typeFolder = String(skill?.type_folder || "").toLowerCase();
  const bag = `${id} ${typeFolder}`;

  if (/\b(dev|code|coding|mcp|github|frontend|backend|automation)\b/.test(bag)) return "dev";
  if (/\b(writing|story|narrative|book|novel|editor|dialog|plot)\b/.test(bag)) return "writing";
  if (/\b(design|art|cover|canvas|creative)\b/.test(bag)) return "art";
  if (/\b(image|video|vision|whisper|tts|audio|voice)\b/.test(bag)) return "media";
  if (/\b(language|translation|dialect|linguistic)\b/.test(bag)) return "language";
  if (/\b(research|knowledge|digest|search)\b/.test(bag)) return "research";
  if (/\b(business|legal|finance|sales|marketing|growth|ops)\b/.test(bag)) return "business";
  if (/\b(notes|calendar|task|todo|reminder|productivity)\b/.test(bag)) return "productivity";
  if (/\b(core|governance|orchestration|routing|system)\b/.test(bag)) return "system";
  return "system";
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/skills
 * Returns the full skills registry.
 */
router.get("/skills", (_req: Request, res: Response): void => {
  try {
    const filePath = firstExistingPath([
      path.join(AGENCY_ROOT, "skill-system/registry/skills-registry.json"),
      path.join(
        YASWARM_ROOT,
        "projects/yaswarm-skills-cataloge/catalog/skill-system/registry/skills-registry.json",
      ),
    ]);
    if (!filePath || !existsSync(filePath)) {
      res.status(404).json({ error: "skills-registry.json not found" });
      return;
    }
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    if (Array.isArray(data?.skills)) {
      const skillRoot = path.join(AGENCY_ROOT, "skills");
      const available = new Set(
        existsSync(skillRoot)
          ? readdirSync(skillRoot).filter((name) =>
              existsSync(path.join(skillRoot, name, "SKILL.md"))
            )
          : []
      );
      data.skills = data.skills.map((s: any) => ({
        ...s,
        category: normalizeSkillCategory(s),
        installed: available.has(String(s?.skill_id || "")),
      }));
      const categoryCounts = data.skills.reduce((acc: Record<string, number>, s: any) => {
        const c = String(s?.category || "system");
        acc[c] = (acc[c] || 0) + 1;
        return acc;
      }, {});
      data.categories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => a.category.localeCompare(b.category));
    }
    res.json({ ...data, sourcePath: filePath });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read skills registry", detail: message });
  }
});

/**
 * GET /api/skills/routing
 * Returns the YaSwarm routing policy.
 */
router.get("/skills/routing", (_req: Request, res: Response): void => {
  try {
    const filePath = firstExistingPath([
      path.join(AGENCY_ROOT, "skill-system/registry/yaswarm-routing-policy.json"),
      path.join(
        YASWARM_ROOT,
        "projects/yaswarm-skills-cataloge/catalog/skill-system/registry/yaswarm-routing-policy.json",
      ),
    ]);
    if (!filePath || !existsSync(filePath)) {
      res.status(404).json({ error: "yaswarm-routing-policy.json not found" });
      return;
    }
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    res.json({ ...data, sourcePath: filePath });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read routing policy", detail: message });
  }
});

/**
 * GET /api/skills/:name
 * Read a specific skill's SKILL.md from skills/<name>/SKILL.md.
 */
router.get("/skills/:name", (req: Request, res: Response): void => {
  try {
    const rawName = req.params.name;
    const name = Array.isArray(rawName) ? String(rawName[0] || "") : String(rawName || "");
    if (!name) {
      res.status(400).json({ error: "Invalid skill name" });
      return;
    }

    // Prevent directory traversal
    if (name.includes("..") || name.includes("/")) {
      res.status(400).json({ error: "Invalid skill name" });
      return;
    }

    const skillDir = firstExistingPath([
      path.join(AGENCY_ROOT, "skills", name),
      path.join(YASWARM_ROOT, "projects/yaswarm-skills-cataloge/catalog/skills", name),
      path.join(YASWARM_ROOT, "skills", name),
    ]);
    if (!skillDir || !existsSync(skillDir) || !statSync(skillDir).isDirectory()) {
      res.status(404).json({ error: `Skill "${name}" not found` });
      return;
    }

    const mdPath = path.join(skillDir, "SKILL.md");
    if (!existsSync(mdPath)) {
      // Return directory listing if SKILL.md is absent
      const files = readdirSync(skillDir);
      res.json({ name, files, content: null, sourcePath: skillDir });
      return;
    }

    const content = readFileSync(mdPath, "utf-8");
    res.json({ name, content, sourcePath: mdPath });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: "Failed to read skill", detail: message });
  }
});

export default router;
