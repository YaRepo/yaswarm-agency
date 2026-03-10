import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Search,
  X,
  Loader2,
  Inbox,
  ChevronDown,
  ChevronUp,
  Filter,
  Zap,
  Globe,
  FolderOpen,
  Layers,
  Circle,
} from "lucide-react";
import api from "@/api/bridge-api";

// ─── Types ──────────────────────────────────────────────────

interface Skill {
  skill_id: string;
  path?: string;
  source?: string;
  type_folder?: string;
  scope?: string;
  contexts?: string[];
  quality_score?: number | null;
  behavior_score?: number | null;
  behavior_status?: string;
  status?: string;
  auto_select?: boolean;
  category?: string;
  installed?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────

function formatSkillName(id: string): string {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getQualityColor(score: number | null | undefined): {
  bar: string;
  text: string;
  label: string;
} {
  if (score == null) return { bar: "bg-yaswarm-muted/30", text: "text-yaswarm-muted", label: "N/A" };
  if (score >= 80) return { bar: "bg-yaswarm-success", text: "text-yaswarm-success", label: `${score}` };
  if (score >= 50) return { bar: "bg-yaswarm-warning", text: "text-yaswarm-warning", label: `${score}` };
  return { bar: "bg-yaswarm-error", text: "text-yaswarm-error", label: `${score}` };
}

function getScopeConfig(scope: string | undefined): { bg: string; text: string; icon: typeof Globe } {
  switch (scope) {
    case "global":
      return { bg: "bg-yaswarm-info/15", text: "text-yaswarm-info", icon: Globe };
    case "project":
      return { bg: "bg-purple-500/15", text: "text-purple-400", icon: FolderOpen };
    case "series":
      return { bg: "bg-yaswarm-success/15", text: "text-yaswarm-success", icon: Layers };
    default:
      return { bg: "bg-yaswarm-muted/15", text: "text-yaswarm-muted", icon: Globe };
  }
}

function getStatusConfig(status: string | undefined): { color: string; label: string } {
  switch (status) {
    case "ready":
      return { color: "bg-yaswarm-success", label: "Ready" };
    case "draft":
      return { color: "bg-yaswarm-warning", label: "Draft" };
    case "deprecated":
      return { color: "bg-yaswarm-error", label: "Deprecated" };
    default:
      return { color: "bg-yaswarm-muted", label: status ?? "Unknown" };
  }
}

// ─── Component ──────────────────────────────────────────────

export default function SkillsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: null as string | null,
    scope: null as string | null,
    category: null as string | null,
    autoSelectOnly: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch skills
  const skillsQuery = useQuery({
    queryKey: ["skills", "list"],
    queryFn: async () => {
      const res = await api.skills.list();
      if (!res.ok) throw new Error(res.error || "Failed to fetch skills");
      // API might return { skills: [...] } or just [...]
      const raw = res.data as any;
      if (Array.isArray(raw)) return raw as Skill[];
      if (raw?.skills && Array.isArray(raw.skills)) return raw.skills as Skill[];
      return [] as Skill[];
    },
  });

  const allSkills = skillsQuery.data ?? [];

  // Filtered skills
  const filteredSkills = useMemo(() => {
    let result = allSkills;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.skill_id.toLowerCase().includes(q) ||
          (s.type_folder && s.type_folder.toLowerCase().includes(q)) ||
          (s.scope && s.scope.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filters.status) {
      result = result.filter((s) => s.status === filters.status);
    }

    // Scope filter
    if (filters.scope) {
      result = result.filter((s) => s.scope === filters.scope);
    }

    // Category filter
    if (filters.category) {
      result = result.filter((s) => (s.category || "system") === filters.category);
    }

    // Auto-select only
    if (filters.autoSelectOnly) {
      result = result.filter((s) => s.auto_select);
    }

    return result;
  }, [allSkills, searchQuery, filters]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of allSkills) {
      const c = s.category || "system";
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [allSkills]);

  const orderedCategories = useMemo(() => {
    const preferred = [
      "dev",
      "writing",
      "art",
      "media",
      "images",
      "language",
      "research",
      "business",
      "productivity",
      "system",
    ];
    const existing = Object.keys(categoryCounts);
    const prioritized = preferred.filter((c) => existing.includes(c));
    const extra = existing.filter((c) => !preferred.includes(c)).sort((a, b) => a.localeCompare(b));
    return [...prioritized, ...extra];
  }, [categoryCounts]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: allSkills.length,
      ready: allSkills.filter((s) => s.status === "ready").length,
      autoSelect: allSkills.filter((s) => s.auto_select).length,
      global: allSkills.filter((s) => s.scope === "global").length,
      installed: allSkills.filter((s) => s.installed).length,
    };
  }, [allSkills]);

  // Toggle filter
  function toggleFilter(key: "status" | "scope" | "category", value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-yaswarm-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-yaswarm-text">Skill System</h2>
          <p className="text-xs text-yaswarm-muted">
            Registered skills, context gates, and orchestration
          </p>
        </div>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yaswarm-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills..."
            className="yaswarm-input w-full pl-10"
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
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`yaswarm-btn-ghost text-xs px-3 py-2 border flex items-center gap-1.5 ${
            showFilters || filters.status || filters.scope || filters.category || filters.autoSelectOnly
              ? "border-yaswarm-accent/30 text-yaswarm-accent"
              : "border-yaswarm-border"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
        </button>
      </div>

      {/* Filter toggles */}
      {showFilters && (
        <div className="yaswarm-card space-y-3">
          {/* Status */}
          <div>
            <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider mb-1.5">Status</p>
            <div className="flex gap-1.5">
              {["ready", "draft", "deprecated"].map((s) => (
                <button
                  key={s}
                  onClick={() => toggleFilter("status", s)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    filters.status === s
                      ? "bg-yaswarm-accent/15 text-yaswarm-accent border border-yaswarm-accent/25"
                      : "text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover border border-yaswarm-border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div>
            <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider mb-1.5">Scope</p>
            <div className="flex gap-1.5">
              {["global", "project", "series"].map((s) => (
                <button
                  key={s}
                  onClick={() => toggleFilter("scope", s)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    filters.scope === s
                      ? "bg-yaswarm-accent/15 text-yaswarm-accent border border-yaswarm-accent/25"
                      : "text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover border border-yaswarm-border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-select */}
          <div>
            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, autoSelectOnly: !prev.autoSelectOnly }))
              }
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                filters.autoSelectOnly
                  ? "bg-yaswarm-accent/15 text-yaswarm-accent border border-yaswarm-accent/25"
                  : "text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover border border-yaswarm-border"
              }`}
            >
              Auto-select only
            </button>
          </div>

          {/* Category */}
          <div>
            <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider mb-1.5">Category</p>
            <div className="flex gap-1.5 flex-wrap">
              {orderedCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleFilter("category", c)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    filters.category === c
                      ? "bg-yaswarm-accent/15 text-yaswarm-accent border border-yaswarm-accent/25"
                      : "text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover border border-yaswarm-border"
                  }`}
                >
                  {c} ({categoryCounts[c] || 0})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Total Skills</p>
          <p className="text-2xl font-bold text-yaswarm-text mt-1">
            {skillsQuery.isLoading ? "--" : stats.total}
          </p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Ready</p>
          <p className="text-2xl font-bold text-yaswarm-success mt-1">
            {skillsQuery.isLoading ? "--" : stats.ready}
          </p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Auto-Select</p>
          <p className="text-2xl font-bold text-yaswarm-accent mt-1">
            {skillsQuery.isLoading ? "--" : stats.autoSelect}
          </p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Global</p>
          <p className="text-2xl font-bold text-yaswarm-info mt-1">
            {skillsQuery.isLoading ? "--" : stats.global}
          </p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Installed</p>
          <p className="text-2xl font-bold text-yaswarm-accent mt-1">
            {skillsQuery.isLoading ? "--" : stats.installed}
          </p>
        </div>
      </div>

      {/* Result count */}
      {!skillsQuery.isLoading && (searchQuery || filters.status || filters.scope || filters.category || filters.autoSelectOnly) && (
        <p className="text-xs text-yaswarm-muted">
          Showing {filteredSkills.length} of {allSkills.length} skills
        </p>
      )}

      {/* Loading state */}
      {skillsQuery.isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-yaswarm-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-40" />
          <p className="text-xs">Loading skills registry...</p>
        </div>
      )}

      {/* Empty state */}
      {!skillsQuery.isLoading && filteredSkills.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-yaswarm-muted">
          <Inbox className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-xs">
            {searchQuery.trim() || filters.status || filters.scope || filters.category || filters.autoSelectOnly
              ? "No skills match the current filters"
              : "No skills registered"}
          </p>
        </div>
      )}

      {/* Skill cards grid */}
      {!skillsQuery.isLoading && filteredSkills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const isExpanded = expandedSkill === skill.skill_id;
            const quality = getQualityColor(skill.quality_score);
            const scope = getScopeConfig(skill.scope);
            const status = getStatusConfig(skill.status);
            const ScopeIcon = scope.icon;

            return (
              <div
                key={skill.skill_id}
                className="yaswarm-card hover:border-yaswarm-accent/30 transition-colors cursor-pointer"
                onClick={() => setExpandedSkill(isExpanded ? null : skill.skill_id)}
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-yaswarm-text truncate">
                      {formatSkillName(skill.skill_id)}
                    </p>
                    {skill.type_folder && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-yaswarm-surface border border-yaswarm-border text-[10px] text-yaswarm-muted">
                        {skill.type_folder}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Circle className={`w-2 h-2 fill-current ${status.color.replace("bg-", "text-")}`} />
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-yaswarm-muted" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-yaswarm-muted" />
                    )}
                  </div>
                </div>

                {/* Quality bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-yaswarm-muted">Quality</span>
                    <span className={`text-[10px] font-mono ${quality.text}`}>{quality.label}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-yaswarm-surface overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${quality.bar}`}
                      style={{ width: `${skill.quality_score ?? 0}%` }}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={`yaswarm-badge ${scope.bg} ${scope.text}`}>
                    <ScopeIcon className="w-2.5 h-2.5 mr-1" />
                    {skill.scope ?? "unknown"}
                  </span>
                  <span className="yaswarm-badge bg-yaswarm-surface text-yaswarm-muted border border-yaswarm-border">
                    {skill.category || "system"}
                  </span>
                  {skill.installed && (
                    <span className="yaswarm-badge bg-yaswarm-success/15 text-yaswarm-success">installed</span>
                  )}
                  {skill.auto_select && (
                    <span className="yaswarm-badge bg-yaswarm-success/15 text-yaswarm-success">
                      <Zap className="w-2.5 h-2.5 mr-0.5" />
                      auto
                    </span>
                  )}
                </div>

                {/* Contexts */}
                {skill.contexts && skill.contexts.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <span className="text-[10px] text-yaswarm-muted">ctx:</span>
                    {skill.contexts.map((ctx) => (
                      <span
                        key={ctx}
                        className="px-1.5 py-0.5 rounded bg-yaswarm-surface border border-yaswarm-border text-[10px] text-yaswarm-muted font-mono"
                      >
                        {ctx}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-yaswarm-border/50 space-y-2">
                    {skill.path && (
                      <div>
                        <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider">Path</p>
                        <p className="text-xs text-yaswarm-text font-mono break-all mt-0.5">
                          {skill.path}
                        </p>
                      </div>
                    )}
                    {skill.source && (
                      <div>
                        <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider">Source</p>
                        <p className="text-xs text-yaswarm-text mt-0.5">{skill.source}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider">Status</p>
                      <p className="text-xs text-yaswarm-text mt-0.5">{status.label}</p>
                    </div>
                    {skill.behavior_status && (
                      <div>
                        <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider">
                          Behavior
                        </p>
                        <p className="text-xs text-yaswarm-text mt-0.5">
                          {skill.behavior_status}
                          {skill.behavior_score != null && ` (score: ${skill.behavior_score})`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
