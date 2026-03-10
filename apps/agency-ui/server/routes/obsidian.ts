import { Router, Request, Response } from "express";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs";
import path from "path";

const router = Router();

const WORKSPACE_ROOT =
  process.env.YASWARM_WORKSPACE_ROOT ||
  "/root/yaswarm-swarm/projects/yaswarm-desk-workspace";
const PROJECT_VAULTS_ROOT =
  process.env.YASWARM_OBSIDIAN_PROJECT_VAULTS_ROOT ||
  path.join(WORKSPACE_ROOT, "project-vaults");
const AGENCY_ROOT =
  process.env.AGENCY_ROOT || path.join(WORKSPACE_ROOT, "agency");
const VAULTS_CONFIG_PATH = path.join(AGENCY_ROOT, "config", "obsidian-vaults.json");
const OBSIDIAN_WEB_URL =
  process.env.YASWARM_OBSIDIAN_WEB_URL || "https://note.yascene.com";

const BOOKS_SOURCE_PATH =
  process.env.YASWARM_BOOKS_PATH ||
  process.env.YASWARM_LEGACY_BOOKS_PATH ||
  path.join(WORKSPACE_ROOT, "books");
const OBSIDIAN_CONFIG_SOURCE_PATH =
  process.env.YASWARM_OBSIDIAN_CONFIG_PATH ||
  process.env.YASWARM_LEGACY_OBSIDIAN_CONFIG_PATH ||
  path.join(WORKSPACE_ROOT, "obsidian-config");
const LOCAL_OBSIDIAN_CONFIG_PATH = path.join(WORKSPACE_ROOT, "obsidian-config");
const BOOKS_VAULT_PATH = path.join(WORKSPACE_ROOT, "books");
const DOCS_VAULT_PATH = path.join(WORKSPACE_ROOT, "docs");
const MIGRATION_STATE_PATH = path.join(AGENCY_ROOT, "config", "obsidian-migration-state.json");
const LEGACY_BOOKS_CANDIDATES = [
  BOOKS_SOURCE_PATH,
  path.join(OBSIDIAN_CONFIG_SOURCE_PATH, "Obsidian Vault"),
];

type VaultEntry = {
  id: string;
  name: string;
  path: string;
  category: "default" | "project" | "custom";
};

const DEFAULT_VAULTS: VaultEntry[] = [
  {
    id: "books",
    name: "Books Vault",
    path: BOOKS_VAULT_PATH,
    category: "default",
  },
  {
    id: "agency-desk",
    name: "Agency Desk Vault",
    path: AGENCY_ROOT,
    category: "default",
  },
  {
    id: "docs",
    name: "System Docs Vault",
    path: DOCS_VAULT_PATH,
    category: "default",
  },
];

function ensureDir(dirPath: string): void {
  mkdirSync(dirPath, { recursive: true });
}

function firstExistingPath(candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function safeProjectName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadVaultConfig(): VaultEntry[] {
  if (!existsSync(VAULTS_CONFIG_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync(VAULTS_CONFIG_PATH, "utf-8"));
    if (!Array.isArray(parsed?.vaults)) return [];
    return parsed.vaults.filter(
      (v: any) =>
        typeof v?.id === "string" &&
        typeof v?.name === "string" &&
        typeof v?.path === "string",
    ) as VaultEntry[];
  } catch {
    return [];
  }
}

function saveVaultConfig(vaults: VaultEntry[]): void {
  ensureDir(path.dirname(VAULTS_CONFIG_PATH));
  writeFileSync(
    VAULTS_CONFIG_PATH,
    JSON.stringify(
      {
        version: "1.0.0",
        updated_at: new Date().toISOString(),
        vaults,
      },
      null,
      2,
    ) + "\n",
    "utf-8",
  );
}

type MigrationState = {
  booksMigrated?: boolean;
  pluginsMigrated?: boolean;
  migratedAt?: string;
};

function readMigrationState(): MigrationState {
  if (!existsSync(MIGRATION_STATE_PATH)) return {};
  try {
    const parsed = JSON.parse(readFileSync(MIGRATION_STATE_PATH, "utf-8"));
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeMigrationState(patch: MigrationState): void {
  const current = readMigrationState();
  ensureDir(path.dirname(MIGRATION_STATE_PATH));
  writeFileSync(
    MIGRATION_STATE_PATH,
    JSON.stringify(
      {
        ...current,
        ...patch,
        migratedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
    "utf-8",
  );
}

function touchFile(filePath: string, content: string): void {
  if (existsSync(filePath)) return;
  writeFileSync(filePath, content, "utf-8");
}

function initUserProjectVaultSkeleton(projectVaultPath: string, slug: string): void {
  const docsDir = path.join(projectVaultPath, "docs");
  const plansDir = path.join(projectVaultPath, "plans");
  const researchDir = path.join(projectVaultPath, "research");
  const tasksDir = path.join(projectVaultPath, "tasks");
  const artifactsDir = path.join(projectVaultPath, "artifacts");
  const logsDir = path.join(projectVaultPath, "logs");
  const obsidianDir = path.join(projectVaultPath, ".obsidian");
  const templatesDir = path.join(obsidianDir, "templates");
  const pluginDir = path.join(obsidianDir, "plugins");

  for (const dir of [
    docsDir,
    plansDir,
    researchDir,
    tasksDir,
    artifactsDir,
    logsDir,
    obsidianDir,
    templatesDir,
    pluginDir,
  ]) {
    ensureDir(dir);
  }

  touchFile(
    path.join(projectVaultPath, "README.md"),
    `# ${slug}\n\nUser project vault for YaSwarm project delivery.\n`,
  );
  touchFile(
    path.join(docsDir, "overview.md"),
    `# Project Overview\n\n## Goal\n\n## Scope\n\n## Stakeholders\n`,
  );
  touchFile(
    path.join(plansDir, "execution-plan.md"),
    `# Execution Plan\n\n## Milestones\n\n## Risks\n\n## Dependencies\n`,
  );
  touchFile(
    path.join(researchDir, "notes.md"),
    `# Research Notes\n\n- Sources:\n- Findings:\n- Decisions:\n`,
  );
  touchFile(
    path.join(tasksDir, "backlog.md"),
    `# Backlog\n\n- [ ] Task 1\n`,
  );
  touchFile(
    path.join(logsDir, "changelog.md"),
    `# Changelog\n\n`,
  );
  touchFile(
    path.join(templatesDir, "daily-note.md"),
    `# {{date}}\n\n## Priorities\n\n## Notes\n\n## Blockers\n`,
  );
  touchFile(
    path.join(obsidianDir, "app.json"),
    JSON.stringify({ showLineNumber: false }, null, 2) + "\n",
  );
  touchFile(
    path.join(obsidianDir, "core-plugins.json"),
    JSON.stringify(["file-explorer", "search", "tag-pane", "backlink"], null, 2) + "\n",
  );
}

function discoverProjectVaults(): VaultEntry[] {
  if (!existsSync(PROJECT_VAULTS_ROOT)) return [];
  const entries = readdirSync(PROJECT_VAULTS_ROOT);
  const out: VaultEntry[] = [];
  for (const name of entries) {
    const fullPath = path.join(PROJECT_VAULTS_ROOT, name);
    try {
      if (!statSync(fullPath).isDirectory()) continue;
      out.push({
        id: `project-${name}`,
        name: `Project: ${name}`,
        path: fullPath,
        category: "project",
      });
    } catch {
      continue;
    }
  }
  return out;
}

function withExists(vaults: VaultEntry[]) {
  return vaults.map((v) => ({
    ...v,
    exists: existsSync(v.path),
  }));
}

router.get("/obsidian/status", (_req: Request, res: Response): void => {
  const legacyBooksSource = firstExistingPath(LEGACY_BOOKS_CANDIDATES);
  const legacyVaultObsidianPath = legacyBooksSource
    ? path.join(legacyBooksSource, ".obsidian")
    : null;
  const migrationState = readMigrationState();
  const booksMigrated = Boolean(migrationState.booksMigrated);
  const pluginsMigrated = Boolean(migrationState.pluginsMigrated);
  res.json({
    ok: true,
    workspaceRoot: WORKSPACE_ROOT,
    projectVaultsRoot: PROJECT_VAULTS_ROOT,
    webUrl: OBSIDIAN_WEB_URL,
    configPath: VAULTS_CONFIG_PATH,
    hasConfig: existsSync(VAULTS_CONFIG_PATH),
    legacyBooksPath: legacyBooksSource || BOOKS_SOURCE_PATH,
    legacyBooksExists: Boolean(legacyBooksSource),
    legacyPluginsPath: OBSIDIAN_CONFIG_SOURCE_PATH,
    legacyPluginsExists: existsSync(OBSIDIAN_CONFIG_SOURCE_PATH),
    legacyVaultObsidianPath,
    legacyVaultObsidianExists: Boolean(
      legacyVaultObsidianPath && existsSync(legacyVaultObsidianPath),
    ),
    migrationState: {
      booksMigrated,
      pluginsMigrated,
      migratedAt: migrationState.migratedAt || null,
      needsBooksMigration: !booksMigrated && Boolean(legacyBooksSource),
      needsPluginsMigration:
        !pluginsMigrated &&
        Boolean(legacyVaultObsidianPath && existsSync(legacyVaultObsidianPath)),
    },
    localPluginsPath: LOCAL_OBSIDIAN_CONFIG_PATH,
    localPluginsExists: existsSync(LOCAL_OBSIDIAN_CONFIG_PATH),
  });
});

router.get("/obsidian/vaults", (_req: Request, res: Response): void => {
  const configured = loadVaultConfig();
  const projectVaults = discoverProjectVaults();
  const merged = [...configured];
  for (const projectVault of projectVaults) {
    if (!merged.some((v) => v.path === projectVault.path)) {
      merged.push(projectVault);
    }
  }
  res.json({
    ok: true,
    defaultVaults: withExists(DEFAULT_VAULTS),
    configuredVaults: withExists(merged),
  });
});

router.post("/obsidian/vaults/bootstrap", (_req: Request, res: Response): void => {
  ensureDir(PROJECT_VAULTS_ROOT);
  for (const v of DEFAULT_VAULTS) {
    ensureDir(v.path);
  }

  const current = loadVaultConfig();
  const byPath = new Map<string, VaultEntry>();
  for (const v of current) byPath.set(v.path, v);
  for (const v of DEFAULT_VAULTS) byPath.set(v.path, v);
  saveVaultConfig(Array.from(byPath.values()));

  res.json({
    ok: true,
    message: "Default YaSwarm vaults are ready",
    vaults: withExists(Array.from(byPath.values())),
  });
});

router.post("/obsidian/vaults/project", (req: Request, res: Response): void => {
  const projectNameRaw = String(req.body?.projectName || "");
  const withTemplate = req.body?.withTemplate !== false;
  const slug = safeProjectName(projectNameRaw);
  if (!slug) {
    res.status(400).json({ error: "projectName is required" });
    return;
  }

  const projectVaultPath = path.join(PROJECT_VAULTS_ROOT, slug);
  ensureDir(projectVaultPath);
  if (withTemplate) {
    initUserProjectVaultSkeleton(projectVaultPath, slug);
  }

  const entry: VaultEntry = {
    id: `project-${slug}`,
    name: `Project: ${slug}`,
    path: projectVaultPath,
    category: "project",
  };

  const current = loadVaultConfig();
  const next = current.some((v) => v.path === entry.path) ? current : [...current, entry];
  saveVaultConfig(next);

  res.json({
    ok: true,
    message: `Created user project vault "${slug}"`,
    withTemplate,
    vault: { ...entry, exists: true },
  });
});

router.post("/obsidian/migrate-legacy-books", (req: Request, res: Response): void => {
  const force = Boolean(req.body?.force);
  const targetPath = BOOKS_VAULT_PATH;
  const sourcePath = firstExistingPath(LEGACY_BOOKS_CANDIDATES);

  if (!sourcePath) {
    res.status(404).json({ error: "Legacy books vault path not found" });
    return;
  }

  ensureDir(targetPath);
  const targetEntries = readdirSync(targetPath);
  if (targetEntries.length > 0 && !force) {
    res.status(409).json({
      error: "Target books vault is not empty. Send { force: true } to overwrite-copy.",
    });
    return;
  }

  cpSync(sourcePath, targetPath, { recursive: true, force: true });
  writeMigrationState({ booksMigrated: true });

  res.json({
    ok: true,
    message: "Legacy books vault copied to YaSwarm workspace vaults/books",
    source: sourcePath,
    target: targetPath,
  });
});

router.post("/obsidian/migrate-legacy-plugins", (_req: Request, res: Response): void => {
  const sourceBooksPath = firstExistingPath(LEGACY_BOOKS_CANDIDATES);
  const sourceVaultObsidianPath = sourceBooksPath
    ? path.join(sourceBooksPath, ".obsidian")
    : null;

  if (!sourceVaultObsidianPath || !existsSync(sourceVaultObsidianPath)) {
    res.status(404).json({ error: "Legacy Obsidian vault plugins path not found" });
    return;
  }

  const targetVaultObsidianPath = path.join(BOOKS_VAULT_PATH, ".obsidian");
  ensureDir(BOOKS_VAULT_PATH);
  cpSync(sourceVaultObsidianPath, targetVaultObsidianPath, {
    recursive: true,
    force: true,
  });

  // Keep a local backup copy inside workspace for audit/recovery.
  ensureDir(LOCAL_OBSIDIAN_CONFIG_PATH);
  cpSync(OBSIDIAN_CONFIG_SOURCE_PATH, LOCAL_OBSIDIAN_CONFIG_PATH, {
    recursive: true,
    force: true,
  });

  const pluginDir = path.join(targetVaultObsidianPath, "plugins");
  const pluginCount = existsSync(pluginDir)
    ? readdirSync(pluginDir).filter((entry) => {
        try {
          return statSync(path.join(pluginDir, entry)).isDirectory();
        } catch {
          return false;
        }
      }).length
    : 0;
  writeMigrationState({ pluginsMigrated: true });

  res.json({
    ok: true,
    message: "Legacy Obsidian plugins/config copied into YaSwarm books vault",
    sourceVaultObsidianPath,
    targetVaultObsidianPath,
    backupTarget: LOCAL_OBSIDIAN_CONFIG_PATH,
    pluginCount,
  });
});

export default router;
