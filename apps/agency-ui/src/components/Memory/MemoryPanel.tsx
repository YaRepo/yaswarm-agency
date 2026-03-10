import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Search,
  Database,
  FileText,
  Calendar,
  Syringe,
  Layers,
  Plus,
  X,
  Loader2,
  Inbox,
  Tag,
  FolderOpen,
  Hash,
  Sparkles,
  RefreshCw,
  Zap,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";
import api from "@/api/bridge-api";
import type { VectorSearchResult, VectorStats } from "@/api/bridge-api";

// ─── Types ──────────────────────────────────────────────────

interface MemoryEntry {
  id?: string;
  source: string;
  department?: string;
  bot_handle?: string;
  task_id?: string;
  status?: string;
  summary?: string;
  project?: string;
  tags?: string[] | string;
  source_path?: string;
  timestamp?: string;
  // Markdown-specific fields
  file?: string;
  title?: string;
  sizeBytes?: number;
  content?: string;
}

type SourceFilter = "all" | "sqlite" | "markdown";
type SearchMode = "keyword" | "semantic";

const SOURCE_TABS: { label: string; value: SourceFilter; icon: typeof Layers }[] = [
  { label: "All", value: "all", icon: Layers },
  { label: "Hive SQL", value: "sqlite", icon: Database },
  { label: "Markdown", value: "markdown", icon: FileText },
];

const SOURCE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  sqlite: { bg: "bg-yaswarm-info/15", text: "text-yaswarm-info", label: "Hive SQL" },
  markdown: { bg: "bg-purple-500/15", text: "text-purple-400", label: "Markdown" },
  hive_sql: { bg: "bg-yaswarm-info/15", text: "text-yaswarm-info", label: "Hive SQL" },
  daily_memory: { bg: "bg-purple-500/15", text: "text-purple-400", label: "Daily Memory" },
  main_memory: { bg: "bg-indigo-500/15", text: "text-indigo-400", label: "MEMORY.md" },
  desk: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Desk" },
  skills: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Skills" },
  bridge_logs: { bg: "bg-cyan-500/15", text: "text-cyan-400", label: "Bridge Logs" },
};

const VECTOR_SOURCES: { label: string; value: string }[] = [
  { label: "All Sources", value: "" },
  { label: "Hive SQL", value: "hive_sql" },
  { label: "Daily Memory", value: "daily_memory" },
  { label: "MEMORY.md", value: "main_memory" },
  { label: "Desk Artifacts", value: "desk" },
  { label: "Skills", value: "skills" },
  { label: "Bridge Logs", value: "bridge_logs" },
];

// ─── Component ──────────────────────────────────────────────

export default function MemoryPanel() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSource, setActiveSource] = useState<SourceFilter>("all");
  const [activeDepartment, setActiveDepartment] = useState("all");
  const [showInjectForm, setShowInjectForm] = useState(false);
  const [injectContent, setInjectContent] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("keyword");
  const [vectorSource, setVectorSource] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedSemanticIds, setSelectedSemanticIds] = useState<string[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    summary: string;
    status: string;
    project: string;
    department: string;
    tags: string;
    title: string;
    content: string;
  }>({
    summary: "",
    status: "",
    project: "",
    department: "",
    tags: "",
    title: "",
    content: "",
  });

  // Fetch timeline
  const timelineQuery = useQuery({
    queryKey: ["memory", "timeline", activeSource, activeDepartment],
    queryFn: async () => {
      const params: { limit?: number; source?: string; department?: string } = { limit: 100 };
      if (activeSource !== "all") params.source = activeSource;
      if (activeDepartment !== "all") params.department = activeDepartment;
      const res = await api.memory.timeline(params);
      if (!res.ok) throw new Error(res.error || "Failed to fetch memory timeline");
      const raw = res.data as any;
      return (raw?.entries ?? []) as MemoryEntry[];
    },
  });

  // Keyword search query
  const keywordSearchResult = useQuery({
    queryKey: ["memory", "search", "keyword", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      const res = await api.memory.search(searchQuery);
      if (!res.ok) throw new Error(res.error || "Search failed");
      const raw = res.data as any;
      return (raw?.results ?? []) as MemoryEntry[];
    },
    enabled: searchQuery.trim().length > 0 && searchMode === "keyword",
  });

  // Semantic search query
  const semanticSearchResult = useQuery({
    queryKey: ["memory", "search", "semantic", searchQuery, vectorSource],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      const res = await api.vector.search(searchQuery, 20, vectorSource || undefined);
      if (!res.ok) throw new Error(res.error || "Semantic search failed");
      const raw = res.data as any;
      return (raw?.results ?? []) as VectorSearchResult[];
    },
    enabled: searchQuery.trim().length > 0 && searchMode === "semantic",
  });

  // Vector stats
  const vectorStatsQuery = useQuery({
    queryKey: ["vector", "stats"],
    queryFn: async () => {
      const res = await api.vector.stats();
      if (!res.ok) throw new Error(res.error || "Failed to get vector stats");
      return res.data as VectorStats;
    },
    refetchInterval: (query) => {
      // Poll faster while indexing
      const data = query.state.data;
      return data?.indexing ? 3000 : 30000;
    },
  });

  // Index mutation
  const indexMutation = useMutation({
    mutationFn: async (source?: string) => {
      const res = await api.vector.index(source);
      if (!res.ok) throw new Error(res.error || "Indexing failed");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vector", "stats"] });
    },
  });

  // Inject mutation
  const injectMutation = useMutation({
    mutationFn: async (content: string) => {
      const formData = new FormData();
      const blob = new Blob([content], { type: "text/markdown" });
      formData.append("file", blob, "injected.md");
      const res = await api.memory.inject(formData);
      if (!res.ok) throw new Error(res.error || "Injection failed");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory"] });
      setInjectContent("");
      setShowInjectForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.memory.updateEntry(payload);
      if (!res.ok) throw new Error(res.error || "Update failed");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory"] });
      setEditingKey(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.memory.deleteEntry(payload);
      if (!res.ok) throw new Error(res.error || "Delete failed");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory"] });
    },
  });

  const deleteVectorEntriesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.vector.deleteEntries(ids);
      if (!res.ok) throw new Error(res.error || "Vector delete failed");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory", "search", "semantic"] });
      queryClient.invalidateQueries({ queryKey: ["vector", "stats"] });
      setSelectedSemanticIds([]);
    },
  });

  // Use search results if searching, otherwise timeline (with source filter)
  const entries = useMemo(() => {
    if (searchQuery.trim() && searchMode === "keyword" && keywordSearchResult.data) {
      return keywordSearchResult.data.filter((entry) => {
        const sourceOk = activeSource === "all" ? true : entry.source === activeSource;
        const departmentOk =
          activeDepartment === "all"
            ? true
            : (entry.department || "").toLowerCase() === activeDepartment.toLowerCase();
        return sourceOk && departmentOk;
      });
    }
    const all = timelineQuery.data ?? [];
    if (activeSource === "all") return all;
    return all.filter((e) => e.source === activeSource);
  }, [searchQuery, searchMode, keywordSearchResult.data, timelineQuery.data, activeSource, activeDepartment]);

  useEffect(() => {
    const valid = new Set(entries.map((entry, i) => entryKey(entry, i)));
    setSelectedKeys((prev) => prev.filter((key) => valid.has(key)));
  }, [entries]);

  useEffect(() => {
    const valid = new Set((semanticSearchResult.data ?? []).map((result) => result.id));
    setSelectedSemanticIds((prev) => prev.filter((id) => valid.has(id)));
  }, [semanticSearchResult.data]);

  const departments = useMemo(() => {
    const all = timelineQuery.data ?? [];
    return Array.from(
      new Set(all.map((e) => (e.department || "").trim()).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }, [timelineQuery.data]);

  // Compute stats
  const stats = useMemo(() => {
    const all = timelineQuery.data ?? [];
    const sources = new Set(all.map((e) => e.source));
    const departments = new Set(all.filter((e) => e.department).map((e) => e.department));
    return {
      total: all.length,
      sources: sources.size,
      departments: departments.size,
    };
  }, [timelineQuery.data]);

  const isLoading =
    timelineQuery.isLoading ||
    (searchQuery.trim().length > 0 && searchMode === "keyword" && keywordSearchResult.isLoading) ||
    (searchQuery.trim().length > 0 && searchMode === "semantic" && semanticSearchResult.isLoading);

  const isSearching = searchQuery.trim().length > 0;
  const showSemanticResults = isSearching && searchMode === "semantic" && semanticSearchResult.data;

  // ─── Helpers ────────────────────────────────────────────

  function formatTimestamp(ts: string): string {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return ts;
    }
  }

  function getSourceBadge(source: string) {
    const cfg = SOURCE_COLORS[source] ?? {
      bg: "bg-yaswarm-muted/15",
      text: "text-yaswarm-muted",
      label: source,
    };
    return (
      <span className={`yaswarm-badge ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
    );
  }

  function getSimilarityColor(similarity: number): string {
    if (similarity >= 0.8) return "text-yaswarm-success";
    if (similarity >= 0.6) return "text-yaswarm-warning";
    return "text-yaswarm-muted";
  }

  function getSimilarityBar(similarity: number): string {
    if (similarity >= 0.8) return "bg-yaswarm-success";
    if (similarity >= 0.6) return "bg-yaswarm-warning";
    return "bg-yaswarm-muted";
  }

  function entryKey(entry: MemoryEntry, i: number): string {
    if (entry.source === "sqlite") return `sqlite:${entry.id ?? i}`;
    return `markdown:${entry.file ?? i}`;
  }

  function startEdit(entry: MemoryEntry) {
    setEditingKey(entry.source === "sqlite" ? `sqlite:${entry.id}` : `markdown:${entry.file}`);
    setEditForm({
      summary: entry.summary || "",
      status: entry.status || "",
      project: entry.project || "",
      department: entry.department || "",
      tags: Array.isArray(entry.tags) ? entry.tags.join(", ") : String(entry.tags || ""),
      title: entry.title || "",
      content: entry.content || "",
    });
  }

  async function saveEdit(entry: MemoryEntry) {
    if (entry.source === "sqlite") {
      await updateMutation.mutateAsync({
        source: "sqlite",
        id: entry.id,
        summary: editForm.summary,
        status: editForm.status,
        project: editForm.project,
        department: editForm.department,
        tags: editForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      return;
    }

    await updateMutation.mutateAsync({
      source: "markdown",
      file: entry.file,
      title: editForm.title,
      content: editForm.content,
    });
  }

  async function deleteOne(entry: MemoryEntry) {
    await deleteMutation.mutateAsync(
      entry.source === "sqlite"
        ? { source: "sqlite", id: entry.id }
        : { source: "markdown", file: entry.file },
    );
    setSelectedKeys((prev) =>
      prev.filter((k) => k !== (entry.source === "sqlite" ? `sqlite:${entry.id}` : `markdown:${entry.file}`)),
    );
  }

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-yaswarm-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-yaswarm-text">Memory Hub</h2>
            <p className="text-xs text-yaswarm-muted">
              Unified view of agency memory — keyword & semantic search
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`yaswarm-btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5 border ${
              showStats ? "border-yaswarm-accent/30 text-yaswarm-accent" : "border-yaswarm-border"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Index Stats
          </button>
          <button
            onClick={() => setShowInjectForm(!showInjectForm)}
            className="yaswarm-btn-primary flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Inject Document
          </button>
        </div>
      </div>

      {/* Vector Index Stats Panel */}
      {showStats && (
        <div className="yaswarm-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-yaswarm-text flex items-center gap-2">
              <Zap className="w-4 h-4 text-yaswarm-accent" />
              Vector Index
            </h3>
            <div className="flex items-center gap-2">
              {vectorStatsQuery.data?.indexing && (
                <span className="text-xs text-yaswarm-warning flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Indexing...
                </span>
              )}
              <button
                onClick={() => indexMutation.mutate(undefined)}
                disabled={indexMutation.isPending || vectorStatsQuery.data?.indexing}
                className="yaswarm-btn-primary text-xs px-3 py-1 flex items-center gap-1.5 disabled:opacity-50"
              >
                {indexMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Re-index All
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-yaswarm-surface/50 rounded-lg p-3 border border-yaswarm-border">
              <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider">ChromaDB</p>
              <div className="flex items-center gap-1.5 mt-1">
                {vectorStatsQuery.data?.collection?.count != null ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-yaswarm-success" />
                    <span className="text-sm font-semibold text-yaswarm-text">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-yaswarm-error" />
                    <span className="text-sm font-semibold text-yaswarm-text">Offline</span>
                  </>
                )}
              </div>
            </div>
            <div className="bg-yaswarm-surface/50 rounded-lg p-3 border border-yaswarm-border">
              <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider">Indexed Docs</p>
              <p className="text-xl font-bold text-yaswarm-text mt-1">
                {typeof vectorStatsQuery.data?.collection?.count === "number" ? vectorStatsQuery.data.collection.count : "--"}
              </p>
            </div>
            <div className="bg-yaswarm-surface/50 rounded-lg p-3 border border-yaswarm-border">
              <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider">Model</p>
              <div className="flex items-center gap-1.5 mt-1">
                {vectorStatsQuery.data?.modelLoaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-yaswarm-success" />
                    <span className="text-xs text-yaswarm-text">MiniLM-L6-v2</span>
                  </>
                ) : vectorStatsQuery.data?.modelLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-yaswarm-warning animate-spin" />
                    <span className="text-xs text-yaswarm-text">Loading...</span>
                  </>
                ) : (
                  <span className="text-xs text-yaswarm-muted">Not loaded</span>
                )}
              </div>
            </div>
            <div className="bg-yaswarm-surface/50 rounded-lg p-3 border border-yaswarm-border">
              <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider">Last Indexed</p>
              <p className="text-xs text-yaswarm-text mt-1.5">
                {vectorStatsQuery.data?.lastIndexed
                  ? formatTimestamp(vectorStatsQuery.data.lastIndexed)
                  : "Never"}
              </p>
            </div>
          </div>

          {/* Source breakdown */}
          {vectorStatsQuery.data?.sourceCounts && Object.keys(vectorStatsQuery.data.sourceCounts).length > 0 && (
            <div>
              <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider mb-2">Sources Breakdown</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(vectorStatsQuery.data.sourceCounts).map(([source, count]) => (
                  <span key={source} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-yaswarm-surface border border-yaswarm-border text-xs">
                    {getSourceBadge(source)}
                    <span className="text-yaswarm-text font-medium">{typeof count === "number" ? count : String(count)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Last error */}
          {vectorStatsQuery.data?.lastError && (
            <div className="flex items-start gap-2 p-2 rounded bg-yaswarm-error/10 border border-yaswarm-error/20">
              <AlertCircle className="w-3.5 h-3.5 text-yaswarm-error mt-0.5 shrink-0" />
              <p className="text-xs text-yaswarm-error">{vectorStatsQuery.data.lastError}</p>
            </div>
          )}

          {indexMutation.isError && (
            <p className="text-xs text-yaswarm-error">
              {indexMutation.error instanceof Error ? indexMutation.error.message : "Indexing failed"}
            </p>
          )}
        </div>
      )}

      {/* Inject form */}
      {showInjectForm && (
        <div className="yaswarm-card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-yaswarm-text">Inject Markdown Content</p>
            <button onClick={() => setShowInjectForm(false)} className="text-yaswarm-muted hover:text-yaswarm-text">
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={injectContent}
            onChange={(e) => setInjectContent(e.target.value)}
            placeholder="Paste markdown content to inject into memory..."
            className="yaswarm-input w-full h-32 resize-y font-mono text-xs"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowInjectForm(false)}
              className="yaswarm-btn-ghost text-xs px-3 py-1.5 border border-yaswarm-border"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (injectContent.trim()) injectMutation.mutate(injectContent);
              }}
              disabled={!injectContent.trim() || injectMutation.isPending}
              className="yaswarm-btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
            >
              {injectMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Inject"
              )}
            </button>
          </div>
          {injectMutation.isError && (
            <p className="text-xs text-yaswarm-error">
              {injectMutation.error instanceof Error ? injectMutation.error.message : "Injection failed"}
            </p>
          )}
        </div>
      )}

      {/* Search mode toggle + Search bar */}
      <div className="space-y-3">
        {/* Search mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchMode("keyword")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              searchMode === "keyword"
                ? "bg-yaswarm-accent/15 text-yaswarm-accent border border-yaswarm-accent/25"
                : "text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover border border-transparent"
            }`}
          >
            <Search className="w-3 h-3" />
            Keyword
          </button>
          <button
            onClick={() => setSearchMode("semantic")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              searchMode === "semantic"
                ? "bg-purple-500/15 text-purple-400 border border-purple-500/25"
                : "text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover border border-transparent"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Semantic
          </button>

          {searchMode === "semantic" && (
            <select
              value={vectorSource}
              onChange={(e) => setVectorSource(e.target.value)}
              className="yaswarm-input text-xs py-1 px-2 ml-auto"
            >
              {VECTOR_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          {searchMode === "semantic" ? (
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yaswarm-muted" />
          )}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              searchMode === "semantic"
                ? "Ask a question or describe what you're looking for..."
                : "Search memory entries..."
            }
            className={`yaswarm-input w-full pl-10 ${
              searchMode === "semantic" ? "border-purple-500/20 focus:border-purple-500/40" : ""
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-yaswarm-muted hover:text-yaswarm-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Source filter tabs (only for keyword mode / timeline) */}
      {searchMode === "keyword" && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {SOURCE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveSource(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 ${
                  activeSource === tab.value
                    ? "bg-yaswarm-accent/15 text-yaswarm-accent border border-yaswarm-accent/25"
                    : "text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover border border-transparent"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-yaswarm-muted">Department</span>
            <select
              value={activeDepartment}
              onChange={(e) => setActiveDepartment(e.target.value)}
              className="yaswarm-input text-xs py-1 px-2"
            >
              <option value="all">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Total Entries</p>
          <p className="text-2xl font-bold text-yaswarm-text mt-1">
            {timelineQuery.isLoading ? "--" : stats.total}
          </p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Sources</p>
          <p className="text-2xl font-bold text-yaswarm-text mt-1">
            {timelineQuery.isLoading ? "--" : stats.sources}
          </p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">
            {searchMode === "semantic" ? "Vector Index" : "Departments"}
          </p>
          <p className="text-2xl font-bold text-yaswarm-text mt-1">
            {searchMode === "semantic"
              ? (typeof vectorStatsQuery.data?.collection?.count === "number" ? vectorStatsQuery.data.collection.count : "--")
              : timelineQuery.isLoading
              ? "--"
              : stats.departments}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-yaswarm-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-40" />
          <p className="text-xs">
            {searchMode === "semantic" ? "Running semantic search..." : "Loading memory entries..."}
          </p>
        </div>
      )}

      {/* Semantic search results */}
      {showSemanticResults && !isLoading && (
        <div className="space-y-1">
          <p className="text-xs text-yaswarm-muted mb-2">
            {semanticSearchResult.data!.length} semantic matches for "{searchQuery}"
          </p>
          <div className="yaswarm-card flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setSelectedSemanticIds((prev) =>
                    prev.length === semanticSearchResult.data!.length
                      ? []
                      : semanticSearchResult.data!.map((result) => result.id),
                  )
                }
                className="yaswarm-btn-ghost text-xs px-2 py-1 border border-yaswarm-border"
              >
                {selectedSemanticIds.length === semanticSearchResult.data!.length
                  ? "Clear Selection"
                  : "Select All"}
              </button>
              <span className="text-xs text-yaswarm-muted">{selectedSemanticIds.length} selected</span>
            </div>
            <button
              disabled={selectedSemanticIds.length === 0 || deleteVectorEntriesMutation.isPending}
              onClick={async () => {
                await deleteVectorEntriesMutation.mutateAsync(selectedSemanticIds);
                await semanticSearchResult.refetch();
              }}
              className="yaswarm-btn-ghost text-xs px-2 py-1 border border-yaswarm-border text-yaswarm-error inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              Remove Selected
            </button>
          </div>
          {deleteVectorEntriesMutation.isError && (
            <p className="text-xs text-yaswarm-error">
              {deleteVectorEntriesMutation.error instanceof Error
                ? deleteVectorEntriesMutation.error.message
                : "Vector delete failed"}
            </p>
          )}
          {semanticSearchResult.data!.map((result, i) => (
            <div
              key={result.id}
              className="yaswarm-card hover:border-purple-500/20 transition-colors"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedSemanticIds.includes(result.id)}
                  onChange={(e) =>
                    setSelectedSemanticIds((prev) =>
                      e.target.checked
                        ? [...prev, result.id]
                        : prev.filter((id) => id !== result.id),
                    )
                  }
                  className="mt-1 accent-yaswarm-accent"
                />
                {/* Similarity indicator */}
                <div className="flex flex-col items-center pt-1 shrink-0 w-12">
                  <span className={`text-xs font-bold ${getSimilarityColor(result.similarity)}`}>
                    {(result.similarity * 100).toFixed(0)}%
                  </span>
                  <div className="w-full h-1 bg-yaswarm-surface rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getSimilarityBar(result.similarity)}`}
                      style={{ width: `${result.similarity * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Meta row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-yaswarm-muted font-mono">#{i + 1}</span>
                    {getSourceBadge(result.metadata.source || "unknown")}
                    {result.metadata.department && (
                      <span className="yaswarm-badge bg-yaswarm-accent/15 text-yaswarm-accent">
                        {result.metadata.department}
                      </span>
                    )}
                    {result.metadata.file && (
                      <span className="yaswarm-badge bg-yaswarm-surface text-yaswarm-muted border border-yaswarm-border">
                        {result.metadata.file}
                      </span>
                    )}
                    {result.metadata.skill_name && (
                      <span className="yaswarm-badge bg-emerald-500/15 text-emerald-400">
                        {result.metadata.skill_name}
                      </span>
                    )}
                    {result.metadata.stage && (
                      <span className="yaswarm-badge bg-amber-500/15 text-amber-400">
                        {result.metadata.stage}
                      </span>
                    )}
                    {result.metadata.status && (
                      <span
                        className={`yaswarm-badge ${
                          result.metadata.status === "completed"
                            ? "bg-yaswarm-success/15 text-yaswarm-success"
                            : result.metadata.status === "blocked"
                            ? "bg-yaswarm-error/15 text-yaswarm-error"
                            : "bg-yaswarm-warning/15 text-yaswarm-warning"
                        }`}
                      >
                        {result.metadata.status}
                      </span>
                    )}
                    {result.metadata.timestamp && (
                      <span className="text-[10px] text-yaswarm-muted font-mono">
                        {formatTimestamp(result.metadata.timestamp)}
                      </span>
                    )}
                    {result.metadata.date && (
                      <span className="text-[10px] text-yaswarm-muted font-mono">
                        {result.metadata.date}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <p className="text-sm text-yaswarm-text mt-1.5 whitespace-pre-line line-clamp-4">
                    {result.text}
                  </p>

                  {/* Additional metadata */}
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {result.metadata.project && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-yaswarm-muted">
                        <FolderOpen className="w-2.5 h-2.5" />
                        {result.metadata.project}
                      </span>
                    )}
                    {result.metadata.task_id && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-yaswarm-muted font-mono">
                        <Hash className="w-2.5 h-2.5" />
                        {result.metadata.task_id}
                      </span>
                    )}
                    {result.metadata.chat_key && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-yaswarm-muted font-mono">
                        <Hash className="w-2.5 h-2.5" />
                        {result.metadata.chat_key}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {semanticSearchResult.data!.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-yaswarm-muted">
              <Inbox className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-xs">No semantic matches found</p>
              <p className="text-[10px] mt-1">
                {typeof vectorStatsQuery.data?.collection?.count === "number" && vectorStatsQuery.data.collection.count > 0
                   ? "Try a different query or broader search terms"
                   : "Index your content first using the Index Stats panel above"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Keyword results / Timeline (hide when showing semantic results) */}
      {!showSemanticResults && !isLoading && (
        <>
          {/* Empty state */}
          {entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-yaswarm-muted">
              <Inbox className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-xs">
                {searchQuery.trim() ? "No entries match your search" : "No memory entries found"}
              </p>
            </div>
          )}

          {/* Timeline */}
          {entries.length > 0 && (
            <div className="space-y-1">
              <div className="yaswarm-card flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setSelectedKeys((prev) =>
                        prev.length === entries.length ? [] : entries.map((entry, i) => entryKey(entry, i)),
                      )
                    }
                    className="yaswarm-btn-ghost text-xs px-2 py-1 border border-yaswarm-border"
                  >
                    {selectedKeys.length === entries.length ? "Clear Selection" : "Select All"}
                  </button>
                  <span className="text-xs text-yaswarm-muted">{selectedKeys.length} selected</span>
                </div>
                <button
                  disabled={selectedKeys.length === 0 || deleteMutation.isPending}
                  onClick={async () => {
                    const selected = entries.filter((entry, i) =>
                      selectedKeys.includes(entryKey(entry, i)),
                    );
                    for (const entry of selected) {
                      await deleteOne(entry);
                    }
                    setSelectedKeys([]);
                  }}
                  className="yaswarm-btn-ghost text-xs px-2 py-1 border border-yaswarm-border text-yaswarm-error disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove Selected
                </button>
              </div>
              {entries.map((entry, i) => (
                <div
                  key={entryKey(entry, i)}
                  className="yaswarm-card flex items-start gap-3 hover:border-yaswarm-accent/20 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedKeys.includes(entryKey(entry, i))}
                    onChange={(e) => {
                      const key = entryKey(entry, i);
                      setSelectedKeys((prev) =>
                        e.target.checked ? [...prev, key] : prev.filter((k) => k !== key),
                      );
                    }}
                    className="mt-1 accent-yaswarm-accent"
                  />
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center pt-1.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-yaswarm-accent" />
                    {i < entries.length - 1 && (
                      <div className="w-px h-full min-h-[24px] bg-yaswarm-border mt-1" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Meta row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.timestamp && (
                        <span className="text-[10px] text-yaswarm-muted font-mono">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      )}
                      {getSourceBadge(entry.source)}
                      {entry.department && (
                        <span className="yaswarm-badge bg-yaswarm-accent/15 text-yaswarm-accent">
                          {entry.department}
                        </span>
                      )}
                      {entry.file && (
                        <span className="yaswarm-badge bg-yaswarm-surface text-yaswarm-muted border border-yaswarm-border">
                          {entry.file}
                        </span>
                      )}
                      {entry.status && (
                        <span
                          className={`yaswarm-badge ${
                            entry.status === "completed"
                              ? "bg-yaswarm-success/15 text-yaswarm-success"
                              : entry.status === "blocked"
                              ? "bg-yaswarm-error/15 text-yaswarm-error"
                              : "bg-yaswarm-warning/15 text-yaswarm-warning"
                          }`}
                        >
                          {entry.status}
                        </span>
                      )}
                      {entry.sizeBytes != null && (
                        <span className="text-[10px] text-yaswarm-muted">
                          {(entry.sizeBytes / 1024).toFixed(1)}KB
                        </span>
                      )}
                    </div>

                    {/* Summary / Title */}
                    <p className="text-sm text-yaswarm-text mt-1">
                      {entry.summary || entry.title || entry.file || "(no summary)"}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => startEdit(entry)}
                        className="yaswarm-btn-ghost text-xs px-2 py-1 border border-yaswarm-border inline-flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          await deleteOne(entry);
                        }}
                        disabled={deleteMutation.isPending}
                        className="yaswarm-btn-ghost text-xs px-2 py-1 border border-yaswarm-border text-yaswarm-error inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>

                    {editingKey === entryKey(entry, i) && (
                      <div className="mt-3 p-3 rounded border border-yaswarm-border bg-yaswarm-surface/40 space-y-2">
                        {entry.source === "sqlite" ? (
                          <>
                            <input
                              value={editForm.summary}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, summary: e.target.value }))}
                              className="yaswarm-input w-full text-xs"
                              placeholder="Summary"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                value={editForm.status}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                                className="yaswarm-input w-full text-xs"
                                placeholder="Status"
                              />
                              <input
                                value={editForm.department}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                                className="yaswarm-input w-full text-xs"
                                placeholder="Department"
                              />
                              <input
                                value={editForm.project}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, project: e.target.value }))}
                                className="yaswarm-input w-full text-xs"
                                placeholder="Project"
                              />
                              <input
                                value={editForm.tags}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, tags: e.target.value }))}
                                className="yaswarm-input w-full text-xs"
                                placeholder="Tags (comma separated)"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <input
                              value={editForm.title}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                              className="yaswarm-input w-full text-xs"
                              placeholder="Title"
                            />
                            <textarea
                              value={editForm.content}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                              className="yaswarm-input w-full h-32 resize-y font-mono text-xs"
                              placeholder="Markdown content"
                            />
                          </>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              await saveEdit(entry);
                            }}
                            disabled={updateMutation.isPending}
                            className="yaswarm-btn-primary text-xs px-2 py-1 inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="yaswarm-btn-ghost text-xs px-2 py-1 border border-yaswarm-border"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Content preview for markdown entries */}
                    {entry.source === "markdown" && entry.content && (
                      <p className="text-xs text-yaswarm-muted mt-1 line-clamp-3 whitespace-pre-line">
                        {entry.content.split("\n").slice(1, 6).join("\n").trim().slice(0, 300)}
                      </p>
                    )}

                    {/* Tags row */}
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      {entry.project && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-yaswarm-muted">
                          <FolderOpen className="w-2.5 h-2.5" />
                          {entry.project}
                        </span>
                      )}
                      {entry.task_id && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-yaswarm-muted font-mono">
                          <Hash className="w-2.5 h-2.5" />
                          {entry.task_id}
                        </span>
                      )}
                      {entry.tags && (Array.isArray(entry.tags) ? entry.tags : String(entry.tags).split(",").filter(Boolean)).length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-yaswarm-muted" />
                          {(Array.isArray(entry.tags) ? entry.tags : String(entry.tags).split(",").filter(Boolean)).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded bg-yaswarm-surface border border-yaswarm-border text-[10px] text-yaswarm-muted"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
