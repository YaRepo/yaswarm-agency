import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  FolderPlus,
  Loader2,
  RefreshCw,
  ExternalLink,
  HardDriveDownload,
  Boxes,
  Smartphone,
} from "lucide-react";
import api from "@/api/bridge-api";

type Vault = {
  id: string;
  name: string;
  path: string;
  category: "default" | "project" | "custom";
  exists: boolean;
};

export default function ObsidianPanel() {
  const queryClient = useQueryClient();
  const [projectName, setProjectName] = useState("");
  const [withTemplate, setWithTemplate] = useState(true);
  const [mobileTouchEnabled, setMobileTouchEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const detectMobileTouch = () => {
      if (typeof window === "undefined") return false;
      const smallViewport = window.innerWidth <= 1024;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const touch = navigator.maxTouchPoints > 0;
      return smallViewport && (coarse || touch);
    };
    const sync = () => setMobileTouchEnabled(detectMobileTouch());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const statusQ = useQuery({
    queryKey: ["obsidian", "status"],
    queryFn: async () => {
      const res = await api.obsidian.status();
      if (!res.ok) throw new Error(res.error || "Failed to load Obsidian status");
      return res.data as any;
    },
  });

  const vaultsQ = useQuery({
    queryKey: ["obsidian", "vaults"],
    queryFn: async () => {
      const res = await api.obsidian.vaults();
      if (!res.ok) throw new Error(res.error || "Failed to load vaults");
      return res.data as {
        defaultVaults: Vault[];
        configuredVaults: Vault[];
      };
    },
  });

  const bootstrapMutation = useMutation({
    mutationFn: async () => {
      const res = await api.obsidian.bootstrapVaults();
      if (!res.ok) throw new Error(res.error || "Failed to bootstrap vaults");
      return res.data;
    },
    onSuccess: () => {
      setMessage("Default vault topology created");
      queryClient.invalidateQueries({ queryKey: ["obsidian"] });
      setTimeout(() => setMessage(null), 2500);
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : "Failed"),
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await api.obsidian.createProjectVault(projectName.trim(), withTemplate);
      if (!res.ok) throw new Error(res.error || "Failed to create project vault");
      return res.data;
    },
    onSuccess: () => {
      setMessage(withTemplate ? "User project vault + starter templates created" : "User project vault created");
      setProjectName("");
      queryClient.invalidateQueries({ queryKey: ["obsidian", "vaults"] });
      setTimeout(() => setMessage(null), 2500);
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : "Failed"),
  });

  const migrateBooksMutation = useMutation({
    mutationFn: async () => {
      const res = await api.obsidian.migrateLegacyBooks(false);
      if (!res.ok) throw new Error(res.error || "Failed to migrate legacy books");
      return res.data;
    },
    onSuccess: () => {
      setMessage("Legacy books vault migrated");
      queryClient.invalidateQueries({ queryKey: ["obsidian"] });
      queryClient.invalidateQueries({ queryKey: ["obsidian", "vaults"] });
      setTimeout(() => setMessage(null), 2500);
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : "Failed"),
  });

  const migratePluginsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.obsidian.migrateLegacyPlugins();
      if (!res.ok) throw new Error(res.error || "Failed to copy legacy plugins/config");
      return res.data;
    },
    onSuccess: () => {
      setMessage("Legacy Obsidian plugins/config copied into workspace");
      queryClient.invalidateQueries({ queryKey: ["obsidian"] });
      setTimeout(() => setMessage(null), 2500);
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : "Failed"),
  });

  const loading = statusQ.isLoading || vaultsQ.isLoading;
  const migrationState = statusQ.data?.migrationState;
  const needsBooksMigration = Boolean(migrationState?.needsBooksMigration);
  const needsPluginsMigration = Boolean(migrationState?.needsPluginsMigration);
  const migrationDone = Boolean(migrationState?.booksMigrated || migrationState?.pluginsMigrated);

  const mergedVaults = useMemo(() => {
    const configured = vaultsQ.data?.configuredVaults || [];
    const defaults = vaultsQ.data?.defaultVaults || [];
    const seen = new Set<string>();
    const out: Vault[] = [];
    for (const v of [...defaults, ...configured]) {
      if (seen.has(v.path)) continue;
      seen.add(v.path);
      out.push(v);
    }
    return out;
  }, [vaultsQ.data]);

  const webUrl = statusQ.data?.webUrl || "https://note.yascene.com";
  const isMixedContentBlocked =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    webUrl.startsWith("http://");

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="yaswarm-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-yaswarm-accent" />
          <h2 className="text-sm font-semibold text-yaswarm-text">Obsidian Knowledge Hub</h2>
        </div>

        <div className="text-xs text-yaswarm-muted leading-relaxed">
          YaSwarm vault topology: separate vaults by mission to avoid overlap.
          Recommended structure: <span className="text-yaswarm-text">books</span>, <span className="text-yaswarm-text">agency-desk</span>, <span className="text-yaswarm-text">docs</span>, and <span className="text-yaswarm-text">project vaults</span> for each new build.
        </div>

        <div className="text-xs text-yaswarm-muted leading-relaxed">
          User project vaults are for your business/client/product projects. They are separate from YaSwarm system folders.
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => bootstrapMutation.mutate()}
            disabled={bootstrapMutation.isPending}
            className="yaswarm-btn-primary px-3 py-2 text-xs flex items-center gap-1.5"
          >
            {bootstrapMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Boxes className="w-3.5 h-3.5" />}
            Bootstrap Default Vaults
          </button>

          {needsBooksMigration && (
            <button
              onClick={() => migrateBooksMutation.mutate()}
              disabled={migrateBooksMutation.isPending}
              className="yaswarm-btn-ghost px-3 py-2 text-xs border border-yaswarm-border flex items-center gap-1.5"
            >
              {migrateBooksMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HardDriveDownload className="w-3.5 h-3.5" />}
              Migrate Legacy Books Vault
            </button>
          )}

          {needsPluginsMigration && (
            <button
              onClick={() => migratePluginsMutation.mutate()}
              disabled={migratePluginsMutation.isPending}
              className="yaswarm-btn-ghost px-3 py-2 text-xs border border-yaswarm-border flex items-center gap-1.5"
            >
              {migratePluginsMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HardDriveDownload className="w-3.5 h-3.5" />}
              Copy Legacy Plugins/Config
            </button>
          )}

          <a
            href={webUrl}
            target="_blank"
            rel="noreferrer"
            className="yaswarm-btn-ghost px-3 py-2 text-xs border border-yaswarm-border flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Obsidian
          </a>

          <div
            className={`yaswarm-btn-ghost px-3 py-2 text-xs border flex items-center gap-1.5 ${
              mobileTouchEnabled ? "border-yaswarm-accent text-yaswarm-text" : "border-yaswarm-border"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile Touch Auto: {mobileTouchEnabled ? "On" : "Off"}
          </div>

          <button
            onClick={() => {
              statusQ.refetch();
              vaultsQ.refetch();
            }}
            className="yaswarm-btn-ghost px-3 py-2 text-xs border border-yaswarm-border flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {migrationDone && !needsBooksMigration && !needsPluginsMigration && (
          <p className="text-[11px] text-yaswarm-muted">
            Legacy migration completed. Migration actions are hidden.
          </p>
        )}

        {mobileTouchEnabled && (
          <p className="text-[11px] text-yaswarm-muted">
            Mobile touch mode enabled: use two-finger pinch in Obsidian web view to zoom.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="project-name"
            className="yaswarm-input"
          />
          <button
            onClick={() => createProjectMutation.mutate()}
            disabled={!projectName.trim() || createProjectMutation.isPending}
            className="yaswarm-btn-primary px-3 py-2 text-xs flex items-center justify-center gap-1.5"
          >
            {createProjectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
            Create User Project Vault
          </button>
          <div className="text-[11px] text-yaswarm-muted flex items-center">
            Creates: <span className="ml-1 font-mono text-yaswarm-text">project-vaults/&lt;project&gt;</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-yaswarm-muted">
          <input
            id="obsidian-with-template"
            type="checkbox"
            checked={withTemplate}
            onChange={(e) => setWithTemplate(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          <label htmlFor="obsidian-with-template">
            Auto-create starter docs/plans/research/tasks structure for this user project vault
          </label>
          </div>

        {message && <p className="text-xs text-yaswarm-muted">{message}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-0 flex-1">
        <div className="yaswarm-card p-4 min-h-0 overflow-auto">
          <h3 className="text-sm font-semibold text-yaswarm-text mb-2">Vault Registry</h3>
          {loading ? (
            <p className="text-xs text-yaswarm-muted flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading vaults...
            </p>
          ) : mergedVaults.length === 0 ? (
            <p className="text-xs text-yaswarm-muted">No vaults registered yet.</p>
          ) : (
            <div className="space-y-2">
              {mergedVaults.map((v) => (
                <div key={v.path} className="border border-yaswarm-border rounded p-2">
                  <p className="text-xs text-yaswarm-text font-medium">{v.name}</p>
                  <p className="text-[11px] text-yaswarm-muted font-mono break-all">{v.path}</p>
                  <p className="text-[10px] mt-1 text-yaswarm-muted">
                    category: <span className="text-yaswarm-text">{v.category}</span> | status:{" "}
                    <span className={v.exists ? "text-yaswarm-success" : "text-yaswarm-warning"}>
                      {v.exists ? "ready" : "missing"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="yaswarm-card p-2 min-h-[420px] flex flex-col">
          <div className="px-2 py-1.5 border-b border-yaswarm-border text-xs text-yaswarm-muted">
            Embedded Obsidian Web View ({webUrl})
          </div>
          <div className="flex-1 mt-2 rounded overflow-hidden border border-yaswarm-border bg-yaswarm-bg">
            {isMixedContentBlocked ? (
              <div className="h-full w-full p-4 text-xs text-yaswarm-muted space-y-2">
                <p>Embedded view is blocked by browser mixed-content policy.</p>
                <p>Use the <span className="text-yaswarm-text">Open Obsidian</span> button to open it in a new tab.</p>
              </div>
            ) : (
              <iframe
                src={webUrl}
                className="w-full h-full"
                title="YaSwarm Obsidian"
                loading="lazy"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
