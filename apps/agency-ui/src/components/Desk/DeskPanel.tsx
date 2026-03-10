import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Inbox,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
} from "lucide-react";
import api from "@/api/bridge-api";
import type { DeskStage } from "@/types";

/* ─── stage config ─────────────────────────────────────────── */

interface StageConfig {
  label: string;
  icon: typeof Inbox;
  color: string;        // text color
  borderColor: string;  // border accent
  badgeClass: string;   // badge style
  bgHint: string;       // subtle bg tint for column header
}

const stageConfigs: Record<DeskStage, StageConfig> = {
  inbox: {
    label: "Inbox",
    icon: Inbox,
    color: "text-blue-400",
    borderColor: "border-blue-500/40",
    badgeClass: "bg-blue-500/15 text-blue-400",
    bgHint: "bg-blue-500/[0.04]",
  },
  wip: {
    label: "WIP",
    icon: Loader2,
    color: "text-amber-400",
    borderColor: "border-amber-500/40",
    badgeClass: "bg-amber-500/15 text-amber-400",
    bgHint: "bg-amber-500/[0.04]",
  },
  review: {
    label: "Review",
    icon: Eye,
    color: "text-purple-400",
    borderColor: "border-purple-500/40",
    badgeClass: "bg-purple-500/15 text-purple-400",
    bgHint: "bg-purple-500/[0.04]",
  },
  done: {
    label: "Done",
    icon: CheckCircle2,
    color: "text-green-400",
    borderColor: "border-green-500/40",
    badgeClass: "bg-green-500/15 text-green-400",
    bgHint: "bg-green-500/[0.04]",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-400",
    borderColor: "border-red-500/40",
    badgeClass: "bg-red-500/15 text-red-400",
    bgHint: "bg-red-500/[0.04]",
  },
};

const STAGES: DeskStage[] = ["inbox", "wip", "review", "done", "rejected"];

/* ─── helpers ──────────────────────────────────────────────── */

const DEPT_BADGE_PALETTE = [
  "yaswarm-badge-info",
  "yaswarm-badge-warning",
  "yaswarm-badge-success",
  "yaswarm-badge-error",
  "yaswarm-badge-accent",
] as const;

function hashDeptKey(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function isCeoDepartment(dept: string): boolean {
  return dept.trim().toLowerCase() === "ceo";
}

function getDepartmentBadgeClass(dept: string): string {
  if (isCeoDepartment(dept)) return "yaswarm-badge-accent";
  return DEPT_BADGE_PALETTE[hashDeptKey(dept) % DEPT_BADGE_PALETTE.length];
}

function formatDepartmentLabel(dept: string): string {
  if (isCeoDepartment(dept)) return "CEO";
  return dept
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function relativeAge(dateStr: string): string {
  try {
    const ms = Date.now() - new Date(dateStr).getTime();
    if (ms < 60_000) return "just now";
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
    if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
    return `${Math.floor(ms / 86_400_000)}d ago`;
  } catch {
    return dateStr;
  }
}

/* ─── skeleton ─────────────────────────────────────────────── */

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-yaswarm-border/40 rounded ${className}`} />;
}

function ColumnSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full rounded" />
      <Skeleton className="h-24 w-full rounded" />
      <Skeleton className="h-24 w-full rounded" />
    </div>
  );
}

/* ─── component ────────────────────────────────────────────── */

export default function DeskPanel() {
  const deskQ = useQuery({
    queryKey: ["desk", "all"],
    queryFn: async () => {
      const res = await api.desk.items();
      if (!res.ok) throw new Error(res.error ?? "Failed to load desk items");
      const raw = res.data as any;
      return (raw?.items ?? []) as any[];
    },
  });

  /* group items by stage */
  const byStage = useMemo(() => {
    const map: Record<DeskStage, any[]> = {
      inbox: [],
      wip: [],
      review: [],
      done: [],
      rejected: [],
    };
    if (!deskQ.data) return map;

    // Server uses different stage names — map them to frontend stages
    const stageMap: Record<string, DeskStage> = {
      inbox: "inbox",
      triage: "inbox",
      wip: "wip",
      "in-progress": "wip",
      review: "review",
      done: "done",
      rejected: "rejected",
      tickets: "rejected",
    };

    for (const item of deskQ.data) {
      const serverStage = (item.stage as string) ?? "inbox";
      const frontendStage = stageMap[serverStage] ?? "inbox";
      map[frontendStage].push(item);
    }
    return map;
  }, [deskQ.data]);

  const totalItems = deskQ.data?.length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
          <Inbox className="w-5 h-5 text-yaswarm-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-yaswarm-text">Desk</h2>
          <p className="text-xs text-yaswarm-muted">
            Agency task desk — packet lifecycle board
          </p>
        </div>
      </div>

      {/* Error state */}
      {deskQ.isError && (
        <div className="yaswarm-card border-yaswarm-error/40 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yaswarm-error shrink-0" />
          <div>
            <p className="text-sm font-medium text-yaswarm-error">Failed to load desk data</p>
            <p className="text-xs text-yaswarm-muted mt-0.5">
              {deskQ.error?.message ?? "Unknown error"}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {deskQ.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="yaswarm-card">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-8 w-10" />
            </div>
          ))
        ) : (
          <>
            <div className="yaswarm-card">
              <p className="text-xs text-yaswarm-muted">Total</p>
              <p className="text-2xl font-bold text-yaswarm-text mt-1">{totalItems}</p>
            </div>
            {STAGES.slice(0, 4).map((stage) => {
              const cfg = stageConfigs[stage];
              return (
                <div key={stage} className="yaswarm-card">
                  <p className="text-xs text-yaswarm-muted">{cfg.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${cfg.color}`}>
                    {byStage[stage].length}
                  </p>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Kanban board */}
      {deskQ.isLoading ? (
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <ColumnSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {STAGES.map((stage) => {
            const cfg = stageConfigs[stage];
            const items = byStage[stage];
            const Icon = cfg.icon;

            return (
              <div key={stage} className="space-y-2 min-w-0">
                {/* Column header */}
                <div
                  className={`flex items-center gap-2 pb-2 px-2 border-b-2 ${cfg.borderColor} ${cfg.bgHint} rounded-t-md`}
                >
                  <Icon className={`w-4 h-4 ${cfg.color} shrink-0`} />
                  <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
                  <span
                    className={`ml-auto inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeClass}`}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Cards or empty */}
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-yaswarm-muted/50">
                    <p className="text-xs">No items</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item: any) => (
                      <div
                        key={item.id}
                        className="yaswarm-card py-3 hover:border-yaswarm-accent/25 transition-colors cursor-pointer"
                      >
                        {/* ID */}
                        <p className="text-[10px] text-yaswarm-accent font-mono truncate">
                          {item.id}
                        </p>
                        {/* Department badge */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={getDepartmentBadgeClass(item.department ?? "unknown")}
                          >
                            {formatDepartmentLabel(item.department ?? "unknown")}
                          </span>
                        </div>
                        {/* File count + age */}
                        <div className="flex items-center justify-between mt-2 text-[10px] text-yaswarm-muted">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {item.files?.length ?? 0} files
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {relativeAge(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state when loaded but 0 items across all stages */}
      {!deskQ.isLoading && !deskQ.isError && totalItems === 0 && (
        <div className="yaswarm-card flex flex-col items-center justify-center py-12">
          <Inbox className="w-10 h-10 text-yaswarm-muted/40 mb-3" />
          <p className="text-sm text-yaswarm-muted">No desk items found</p>
          <p className="text-[10px] text-yaswarm-muted mt-1">
            Items will appear here when tasks are created in desk/inbox
          </p>
        </div>
      )}
    </div>
  );
}
