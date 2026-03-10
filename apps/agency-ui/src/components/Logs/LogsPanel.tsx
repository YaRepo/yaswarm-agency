import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ScrollText,
  Search,
  ArrowDown,
  ArrowDownToLine,
  Loader2,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import api from "@/api/bridge-api";

/* ─── types ────────────────────────────────────────────────── */

type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
type TabKey = "bridge" | "desk";

interface ParsedLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  raw: string;
}

/* ─── constants ────────────────────────────────────────────── */

const LEVELS: LogLevel[] = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];

const levelStyle: Record<LogLevel, { badge: string; text: string }> = {
  DEBUG:    { badge: "bg-gray-500/15 text-gray-400",   text: "text-gray-400" },
  INFO:     { badge: "bg-blue-500/15 text-blue-400",   text: "text-blue-400" },
  WARNING:  { badge: "bg-yellow-500/15 text-yellow-400", text: "text-yellow-400" },
  ERROR:    { badge: "bg-red-500/15 text-red-400",     text: "text-red-400" },
  CRITICAL: { badge: "bg-red-600/20 text-red-300",     text: "text-red-300 font-bold" },
};

/* ─── log line parser ──────────────────────────────────────── */

const LOG_RE = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+\[(\w+)\]\s+(.*)$/;

function parseLine(raw: string): ParsedLog {
  const m = raw.match(LOG_RE);
  if (m) {
    return {
      timestamp: m[1],
      level: (m[2].toUpperCase() as LogLevel) || "INFO",
      message: m[3],
      raw,
    };
  }
  return { timestamp: "", level: "INFO", message: raw, raw };
}

/* ─── skeleton ─────────────────────────────────────────────── */

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-yaswarm-border/40 rounded ${className}`} />;
}

/* ─── component ────────────────────────────────────────────── */

export default function LogsPanel() {
  const [tab, setTab] = useState<TabKey>("bridge");
  const [enabledLevels, setEnabledLevels] = useState<Set<LogLevel>>(
    new Set(["INFO", "WARNING", "ERROR", "CRITICAL"]),
  );
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  /* ── queries ───────────────────────────────────────────── */

  const bridgeQ = useQuery({
    queryKey: ["logs", "bridge"],
    queryFn: async () => {
      const res = await api.logs.recent(200);
      if (!res.ok) throw new Error(res.error ?? "Failed to load bridge logs");
      const raw = res.data as any;
      return (raw?.lines ?? []) as any[];
    },
    refetchInterval: 5000,
    enabled: tab === "bridge",
  });

  const deskQ = useQuery({
    queryKey: ["logs", "desk"],
    queryFn: async () => {
      const res = await api.logs.deskEvents(200);
      if (!res.ok) throw new Error(res.error ?? "Failed to load desk events");
      const raw = res.data as any;
      return (raw?.entries ?? []) as any[];
    },
    refetchInterval: 5000,
    enabled: tab === "desk",
  });

  const activeQ = tab === "bridge" ? bridgeQ : deskQ;

  /* ── parsed + filtered logs ────────────────────────────── */

  const entries = useMemo(() => {
    const raw = activeQ.data ?? [];
    // Data can be an array of strings (raw lines) or objects with known shape
    const parsed: ParsedLog[] = raw.map((item: any) => {
      if (typeof item === "string") return parseLine(item);
      // If the server already parsed the line into an object
      const rawMsg = item.message ?? item.raw ?? JSON.stringify(item);
      return {
        timestamp: String(item.timestamp ?? ""),
        level: ((item.level ?? "INFO").toUpperCase() as LogLevel),
        message: typeof rawMsg === "object" ? JSON.stringify(rawMsg) : String(rawMsg),
        raw: typeof item.raw === "object" ? JSON.stringify(item.raw) : String(item.raw ?? ""),
      };
    });
    return parsed;
  }, [activeQ.data]);

  const filtered = useMemo(() => {
    const lc = search.toLowerCase();
    return entries.filter((e) => {
      if (!enabledLevels.has(e.level)) return false;
      if (lc && !e.message.toLowerCase().includes(lc) && !e.timestamp.includes(lc))
        return false;
      return true;
    });
  }, [entries, enabledLevels, search]);

  /* ── auto-scroll ───────────────────────────────────────── */

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filtered, autoScroll]);

  /* ── toggle level ──────────────────────────────────────── */

  const toggleLevel = (level: LogLevel) => {
    setEnabledLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  /* ─── render ───────────────────────────────────────────── */

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
            <ScrollText className="w-5 h-5 text-yaswarm-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-yaswarm-text">Logs</h2>
            <p className="text-xs text-yaswarm-muted">Real-time agency system logs</p>
          </div>
        </div>
        {/* Tab selector */}
        <div className="flex items-center gap-1 bg-yaswarm-surface rounded-lg p-1 border border-yaswarm-border">
          <button
            onClick={() => setTab("bridge")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              tab === "bridge"
                ? "bg-yaswarm-accent/15 text-yaswarm-accent font-medium"
                : "text-yaswarm-muted hover:text-yaswarm-text"
            }`}
          >
            bridge.log
          </button>
          <button
            onClick={() => setTab("desk")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              tab === "desk"
                ? "bg-yaswarm-accent/15 text-yaswarm-accent font-medium"
                : "text-yaswarm-muted hover:text-yaswarm-text"
            }`}
          >
            <span className="flex items-center gap-1">
              <Inbox className="w-3 h-3" /> Desk Events
            </span>
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Level toggles */}
        {LEVELS.map((level) => {
          const active = enabledLevels.has(level);
          const style = levelStyle[level];
          return (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                active ? style.badge : "bg-yaswarm-surface text-yaswarm-muted/50 line-through"
              }`}
            >
              {level}
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Auto-scroll toggle */}
        <button
          onClick={() => setAutoScroll((v) => !v)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
            autoScroll
              ? "text-yaswarm-accent bg-yaswarm-accent/10"
              : "text-yaswarm-muted hover:text-yaswarm-text"
          }`}
        >
          <ArrowDownToLine className="w-3 h-3" />
          Auto-scroll
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yaswarm-muted" />
        <input
          type="text"
          placeholder="Filter logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="yaswarm-input w-full pl-10"
        />
      </div>

      {/* Error state */}
      {activeQ.isError && (
        <div className="yaswarm-card border-yaswarm-error/40 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yaswarm-error shrink-0" />
          <div>
            <p className="text-sm font-medium text-yaswarm-error">Failed to load logs</p>
            <p className="text-xs text-yaswarm-muted mt-0.5">
              {activeQ.error?.message ?? "Unknown error"}
            </p>
          </div>
        </div>
      )}

      {/* Log stream */}
      <div className="yaswarm-card p-0 overflow-hidden">
        <div className="bg-[#08080d] font-mono text-xs max-h-[65vh] overflow-y-auto">
          {activeQ.isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 border-b border-yaswarm-border/20">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-yaswarm-muted">
              <ScrollText className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">
                {entries.length === 0 ? "No log entries" : "No matching entries"}
              </p>
              {search && (
                <p className="text-[10px] mt-1">
                  Try adjusting your search or level filters
                </p>
              )}
            </div>
          ) : (
            filtered.map((log, i) => {
              const style = levelStyle[log.level] ?? levelStyle.INFO;
              return (
                <div
                  key={i}
                  className="flex items-start gap-2 px-4 py-2 border-b border-yaswarm-border/20 hover:bg-yaswarm-hover/30 transition-colors"
                >
                  {/* Timestamp */}
                  <span className="text-yaswarm-muted shrink-0 w-36 select-all">
                    {log.timestamp}
                  </span>
                  {/* Level badge */}
                  <span
                    className={`inline-flex items-center justify-center w-16 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${style.badge}`}
                  >
                    {log.level}
                  </span>
                  {/* Message */}
                  <span className={`${style.text} break-all`}>{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-yaswarm-muted">
        <span>
          Showing {filtered.length} of {entries.length} entries
          {activeQ.isFetching && !activeQ.isLoading && (
            <Loader2 className="inline w-3 h-3 ml-1.5 animate-spin" />
          )}
        </span>
        <span>
          {autoScroll ? (
            <span className="flex items-center gap-1">
              <ArrowDown className="w-3 h-3" /> Auto-scroll enabled
            </span>
          ) : (
            "Auto-scroll disabled"
          )}{" "}
          &middot; Refreshing every 5s
        </span>
      </div>
    </div>
  );
}
