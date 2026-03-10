import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Tag,
  GitCommit,
  Calendar,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";
import api from "@/api/bridge-api";

/* ─── types ────────────────────────────────────────────────── */

interface ChangelogEntry {
  date: string;
  version?: string;
  type?: "feature" | "fix" | "enhancement" | "refactor" | "docs";
  title?: string;
  description?: string;
  body?: string;
  author?: string;
  commitHash?: string;
}

/* ─── constants ────────────────────────────────────────────── */

const typeBadge: Record<string, { bg: string; text: string }> = {
  feature:     { bg: "bg-green-500/15",  text: "text-green-400" },
  fix:         { bg: "bg-red-500/15",    text: "text-red-400" },
  enhancement: { bg: "bg-blue-500/15",   text: "text-blue-400" },
  refactor:    { bg: "bg-purple-500/15", text: "text-purple-400" },
  docs:        { bg: "bg-gray-500/15",   text: "text-gray-400" },
};

const typeIcon: Record<string, string> = {
  feature:     "text-green-400",
  fix:         "text-red-400",
  enhancement: "text-blue-400",
  refactor:    "text-purple-400",
  docs:        "text-gray-400",
};

/* ─── helpers ──────────────────────────────────────────────── */

function friendlyDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    const dist = formatDistanceToNow(d, { addSuffix: true });
    return `${format(d, "MMM d, yyyy")} (${dist})`;
  } catch {
    return dateStr;
  }
}

/* ─── skeleton ─────────────────────────────────────────────── */

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-yaswarm-border/40 rounded ${className}`} />;
}

/* ─── component ────────────────────────────────────────────── */

export default function ChangelogPanel() {
  const changelogQ = useQuery({
    queryKey: ["changelog"],
    queryFn: async () => {
      const res = await api.changelog.entries();
      if (!res.ok) throw new Error(res.error ?? "Failed to load changelog");
      const raw = res.data as any;
      return (raw?.entries ?? []) as ChangelogEntry[];
    },
  });

  /* group entries by date */
  const grouped = useMemo(() => {
    const entries = changelogQ.data ?? [];
    const map = new Map<string, ChangelogEntry[]>();
    for (const entry of entries) {
      const dateKey = entry.date?.slice(0, 10) ?? "unknown";
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(entry);
    }
    // Sort date keys descending
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [changelogQ.data]);

  const totalEntries = changelogQ.data?.length ?? 0;

  /* count by type */
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of changelogQ.data ?? []) {
      const t = entry.type ?? "docs";
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [changelogQ.data]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-yaswarm-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-yaswarm-text">Changelog</h2>
          <p className="text-xs text-yaswarm-muted">Version history and release notes</p>
        </div>
      </div>

      {/* Error */}
      {changelogQ.isError && (
        <div className="yaswarm-card border-yaswarm-error/40 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yaswarm-error shrink-0" />
          <div>
            <p className="text-sm font-medium text-yaswarm-error">
              Failed to load changelog
            </p>
            <p className="text-xs text-yaswarm-muted mt-0.5">
              {changelogQ.error?.message ?? "Unknown error"}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {changelogQ.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="yaswarm-card">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))
        ) : (
          <>
            <div className="yaswarm-card">
              <p className="text-xs text-yaswarm-muted">Total Entries</p>
              <p className="text-2xl font-bold text-yaswarm-text mt-1">{totalEntries}</p>
            </div>
            <div className="yaswarm-card">
              <p className="text-xs text-yaswarm-muted">Date Groups</p>
              <p className="text-2xl font-bold text-yaswarm-text mt-1">{grouped.length}</p>
            </div>
            <div className="yaswarm-card">
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(typeCounts).map(([type, count]) => {
                  const style = typeBadge[type] ?? typeBadge.docs;
                  return (
                    <span
                      key={type}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}
                    >
                      {type}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Loading skeleton */}
      {changelogQ.isLoading && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="yaswarm-card space-y-3">
              <Skeleton className="h-5 w-40" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!changelogQ.isLoading && !changelogQ.isError && totalEntries === 0 && (
        <div className="yaswarm-card flex flex-col items-center justify-center py-16">
          <BookOpen className="w-10 h-10 text-yaswarm-muted/40 mb-3" />
          <p className="text-sm text-yaswarm-muted">No changelog entries found</p>
          <p className="text-[10px] text-yaswarm-muted mt-1">
            Create CHANGELOG.md in the agency workspace to track changes.
          </p>
        </div>
      )}

      {/* Timeline */}
      {grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([dateKey, entries]) => (
            <div key={dateKey} className="relative">
              {/* Date header */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-yaswarm-accent shrink-0" />
                <span className="text-sm font-semibold text-yaswarm-text">
                  {friendlyDate(dateKey)}
                </span>
                <div className="flex-1 border-t border-yaswarm-border/40 ml-2" />
                <span className="text-[10px] text-yaswarm-muted">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              {/* Entries in this date group */}
              <div className="space-y-3 ml-6 border-l-2 border-yaswarm-border/30 pl-4">
                {entries.map((entry, i) => {
                  const entryType = entry.type ?? "docs";
                  const entryTitle = entry.title ?? entry.version ?? "Untitled";
                  const entryDescription = entry.description ?? entry.body ?? "";
                  const style = typeBadge[entryType] ?? typeBadge.docs;
                  const iconColor = typeIcon[entryType] ?? typeIcon.docs;
                  return (
                    <div key={i} className="yaswarm-card relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[calc(1rem+7px)] top-4 w-3 h-3 rounded-full border-2 border-yaswarm-card bg-yaswarm-border" />

                      {/* Entry header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
                          >
                            {entryType}
                          </span>
                          <span className="text-sm font-medium text-yaswarm-text">
                            {entryTitle}
                          </span>
                        </div>
                        {entry.version && (
                          <span className="yaswarm-badge-accent shrink-0">
                            <Tag className="w-3 h-3 mr-1 inline" />
                            {entry.version}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {entryDescription && (
                        <p className="text-xs text-yaswarm-muted leading-relaxed whitespace-pre-wrap">
                          {entryDescription}
                        </p>
                      )}

                      {/* Footer: author + commit */}
                      {(entry.author || entry.commitHash) && (
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-yaswarm-muted">
                          {entry.author && <span>by {entry.author}</span>}
                          {entry.commitHash && (
                            <span className="flex items-center gap-1 font-mono">
                              <GitCommit className={`w-3 h-3 ${iconColor}`} />
                              {entry.commitHash.slice(0, 7)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
