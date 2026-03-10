import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Activity,
  DollarSign,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { format, fromUnixTime } from "date-fns";
import api from "@/api/bridge-api";

/* ─── constants ────────────────────────────────────────────── */
const statusColors: Record<string, string> = {
  success: "yaswarm-badge-success",
  failed: "yaswarm-badge-error",
  timeout: "yaswarm-badge-warning",
  error: "yaswarm-badge-error",
};

const REFETCH_INTERVAL = 30_000;
const ALL_DEPARTMENTS = "All";

function formatDepartmentLabel(dept: string): string {
  if (dept.toLowerCase() === "ceo") return "CEO";
  return dept
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/* ─── skeleton helpers ─────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-yaswarm-border/40 rounded ${className}`} />
  );
}

/* ─── mobile event card ────────────────────────────────────── */
function EventCard({ e }: { e: any }) {
  const ts = e.timestamp
    ? format(fromUnixTime(e.timestamp), "MMM dd HH:mm:ss")
    : "--";
  const totalTokens = (e.input_tokens ?? 0) + (e.output_tokens ?? 0);
  const statusClass = statusColors[e.status] || "yaswarm-badge-info";

  return (
    <div className="border-b border-yaswarm-border/40 last:border-0 px-4 py-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-yaswarm-text truncate">
          {e.sub_agent_id ?? "--"}
        </span>
        <span className={statusClass}>{e.status ?? "unknown"}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-yaswarm-muted font-mono flex-wrap">
        <span>{ts}</span>
        {e.model_used && <span className="text-yaswarm-accent/80">{e.model_used}</span>}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-yaswarm-muted flex-wrap">
        {e.duration_seconds != null && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {e.duration_seconds.toFixed(1)}s
          </span>
        )}
        {totalTokens > 0 && <span>{totalTokens.toLocaleString()} tok</span>}
        {e.cost_usd != null && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {e.cost_usd.toFixed(6)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── main component ───────────────────────────────────────── */
export default function TelemetryPanel() {
  const [deptFilter, setDeptFilter] = useState<string>(ALL_DEPARTMENTS);

  const eventsQ = useQuery({
    queryKey: ["telemetry", "events"],
    queryFn: async () => {
      const res = await api.telemetry.events({ limit: 500 });
      if (!res.ok)
        throw new Error(res.error ?? "Failed to load telemetry events");
      const raw = res.data as any;
      return (raw?.events ?? []) as any[];
    },
    refetchInterval: REFETCH_INTERVAL,
  });

  const events = eventsQ.data ?? [];
  const departments = useMemo(() => {
    const unique = new Set<string>();
    events.forEach((e: any) => {
      const dept = (e.department as string | undefined)?.trim();
      if (dept) unique.add(dept);
    });
    return [ALL_DEPARTMENTS, ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [events]);

  useEffect(() => {
    if (!departments.includes(deptFilter)) {
      // Ensure stale filters don't break new/dynamic department sets.
      setDeptFilter(ALL_DEPARTMENTS);
    }
  }, [departments, deptFilter]);

  /* ─── derived data ───────────────────────────────────────── */
  const filtered = useMemo(
    () =>
      deptFilter === ALL_DEPARTMENTS
        ? events
        : events.filter((e: any) => e.department === deptFilter),
    [events, deptFilter],
  );

  const stats = useMemo(() => {
    const total = filtered.length;
    const successes = filtered.filter((e: any) => e.status === "success").length;
    const totalCost = filtered.reduce(
      (s: number, e: any) => s + (e.cost_usd ?? 0),
      0,
    );
    const avgDuration =
      total > 0
        ? filtered.reduce(
            (s: number, e: any) => s + (e.duration_seconds ?? 0),
            0,
          ) / total
        : 0;
    return {
      total,
      successRate: total > 0 ? ((successes / total) * 100).toFixed(1) : "0.0",
      totalCost,
      avgDuration,
    };
  }, [filtered]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((e: any) => {
      const s = e.status ?? "unknown";
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return counts;
  }, [filtered]);

  const barData = useMemo(() => {
    const deptMap: Record<
      string,
      { department: string; success: number; failed: number; timeout: number }
    > = {};
    events.forEach((e: any) => {
      const d = e.department ?? "unknown";
      if (!deptMap[d])
        deptMap[d] = { department: d, success: 0, failed: 0, timeout: 0 };
      const status = e.status ?? "failed";
      if (status === "success") deptMap[d].success++;
      else if (status === "timeout") deptMap[d].timeout++;
      else deptMap[d].failed++;
    });
    return Object.values(deptMap).sort((a, b) =>
      a.department.localeCompare(b.department),
    );
  }, [events]);

  const costData = useMemo(() => {
    if (filtered.length === 0) return [];
    const buckets: Record<string, { time: string; cost: number }> = {};
    const sorted = [...filtered].sort(
      (a: any, b: any) => (a.timestamp ?? 0) - (b.timestamp ?? 0),
    );
    sorted.forEach((e: any) => {
      if (!e.timestamp) return;
      const d = fromUnixTime(e.timestamp);
      const key = format(d, "MM/dd HH:00");
      if (!buckets[key]) buckets[key] = { time: key, cost: 0 };
      buckets[key].cost += e.cost_usd ?? 0;
    });
    return Object.values(buckets);
  }, [filtered]);

  const isLoading = eventsQ.isLoading;
  const isError = eventsQ.isError;
  const sortedFiltered = useMemo(
    () =>
      [...filtered]
        .sort((a: any, b: any) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
        .slice(0, 100),
    [filtered],
  );

  /* ─── render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-yaswarm-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-yaswarm-text">
              Telemetry Dashboard
            </h2>
            <p className="text-xs text-yaswarm-muted">
              LLM usage metrics, cost tracking, and execution performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-yaswarm-muted shrink-0">
          <RefreshCw
            className={`w-3.5 h-3.5 ${eventsQ.isFetching ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Auto-refresh 30s</span>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="yaswarm-card border-yaswarm-error/40 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yaswarm-error shrink-0" />
          <div>
            <p className="text-sm font-medium text-yaswarm-error">
              Failed to load telemetry
            </p>
            <p className="text-xs text-yaswarm-muted mt-0.5">
              {eventsQ.error?.message}
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="yaswarm-card">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <div className="yaswarm-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-yaswarm-muted">Executions</p>
                <Activity className="w-4 h-4 text-yaswarm-accent" />
              </div>
              <p className="text-2xl font-bold text-yaswarm-text">
                {stats.total.toLocaleString()}
              </p>
            </div>
            <div className="yaswarm-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-yaswarm-muted">Success</p>
                <BarChart3 className="w-4 h-4 text-yaswarm-success" />
              </div>
              <p className="text-2xl font-bold text-yaswarm-success">
                {stats.successRate}%
              </p>
            </div>
            <div className="yaswarm-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-yaswarm-muted">Total Cost</p>
                <DollarSign className="w-4 h-4 text-yaswarm-warning" />
              </div>
              <p className="text-2xl font-bold text-yaswarm-text">
                ${stats.totalCost.toFixed(4)}
              </p>
            </div>
            <div className="yaswarm-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-yaswarm-muted">Avg Duration</p>
                <Clock className="w-4 h-4 text-yaswarm-info" />
              </div>
              <p className="text-2xl font-bold text-yaswarm-text">
                {stats.avgDuration.toFixed(1)}s
              </p>
            </div>
          </>
        )}
      </div>

      {/* Department filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {departments.map((d) => (
          <button
            key={d}
            onClick={() => setDeptFilter(d)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              deptFilter === d
                ? "bg-yaswarm-accent text-yaswarm-bg"
                : "bg-yaswarm-surface text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover"
            }`}
          >
            {d === ALL_DEPARTMENTS ? ALL_DEPARTMENTS : formatDepartmentLabel(d)}
          </button>
        ))}
      </div>

      {/* Status breakdown bar */}
      {!isLoading && filtered.length > 0 && (
        <div className="yaswarm-card">
          <p className="text-sm font-medium text-yaswarm-text mb-3">
            Status Breakdown
          </p>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={statusColors[status] || "yaswarm-badge-info"}>
                  {status}
                </span>
                <span className="text-xs text-yaswarm-text font-medium">
                  {count}
                </span>
              </div>
            ))}
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-yaswarm-surface">
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const pct = (count / filtered.length) * 100;
              const color =
                status === "success"
                  ? "bg-yaswarm-success"
                  : status === "timeout"
                    ? "bg-yaswarm-warning"
                    : "bg-yaswarm-error";
              return (
                <div
                  key={status}
                  className={`${color} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${status}: ${count} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Charts — stacked on mobile, side-by-side on lg+ */}
      {!isLoading && events.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="yaswarm-card">
            <p className="text-sm font-medium text-yaswarm-text mb-3">
              Executions by Department
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ left: -10, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
                <XAxis
                  dataKey="department"
                  tick={{ fill: "#8888a0", fontSize: 9 }}
                  axisLine={{ stroke: "#2a2a3a" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8888a0", fontSize: 9 }}
                  axisLine={{ stroke: "#2a2a3a" }}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a25",
                    border: "1px solid #2a2a3a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#e8e8f0",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "10px", color: "#8888a0" }} />
                <Bar dataKey="success" stackId="a" fill="#4ade80" />
                <Bar dataKey="failed" stackId="a" fill="#f87171" />
                <Bar dataKey="timeout" stackId="a" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="yaswarm-card">
            <p className="text-sm font-medium text-yaswarm-text mb-3">
              Cost Over Time
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={costData} margin={{ left: -10, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#8888a0", fontSize: 9 }}
                  axisLine={{ stroke: "#2a2a3a" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8888a0", fontSize: 9 }}
                  axisLine={{ stroke: "#2a2a3a" }}
                  tickLine={false}
                  width={30}
                  tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a25",
                    border: "1px solid #2a2a3a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#e8e8f0",
                  }}
                  formatter={(value: number) => [`$${value.toFixed(6)}`, "Cost"]}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#d4a843"
                  strokeWidth={2}
                  dot={{ fill: "#d4a843", r: 3 }}
                  activeDot={{ r: 5, fill: "#e8c060" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Events — cards on mobile, table on md+ */}
      <div className="yaswarm-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-yaswarm-border">
          <p className="text-sm font-medium text-yaswarm-text">
            Recent Events
            {filtered.length > 0 && (
              <span className="text-yaswarm-muted ml-1.5">({filtered.length})</span>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-yaswarm-accent animate-spin" />
          </div>
        ) : sortedFiltered.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-8 h-8 text-yaswarm-muted mx-auto mb-2" />
            <p className="text-sm text-yaswarm-muted">No telemetry events</p>
            <p className="text-xs text-yaswarm-muted mt-1 opacity-60">
              Events appear once agents start logging to logs/telemetry/
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden">
              {sortedFiltered.map((e: any, i: number) => (
                <EventCard key={`${e.sub_agent_id}-${e.timestamp}-${i}`} e={e} />
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-yaswarm-border text-yaswarm-muted text-xs bg-yaswarm-surface/50">
                    <th className="text-left px-4 py-2.5 font-medium">Time</th>
                    <th className="text-left px-4 py-2.5 font-medium">Sub-Agent</th>
                    <th className="text-left px-4 py-2.5 font-medium">Model</th>
                    <th className="text-left px-4 py-2.5 font-medium">Status</th>
                    <th className="text-right px-4 py-2.5 font-medium">Duration</th>
                    <th className="text-right px-4 py-2.5 font-medium">Tokens</th>
                    <th className="text-right px-4 py-2.5 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFiltered.map((e: any, i: number) => {
                    const ts = e.timestamp
                      ? format(fromUnixTime(e.timestamp), "MMM dd HH:mm:ss")
                      : "--";
                    const totalTokens =
                      (e.input_tokens ?? 0) + (e.output_tokens ?? 0);
                    return (
                      <tr
                        key={`${e.sub_agent_id}-${e.timestamp}-${i}`}
                        className="border-b border-yaswarm-border/40 last:border-0 hover:bg-yaswarm-hover/50 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-yaswarm-muted text-xs font-mono whitespace-nowrap">
                          {ts}
                        </td>
                        <td className="px-4 py-2.5 text-yaswarm-text text-xs font-mono">
                          {e.sub_agent_id ?? "--"}
                        </td>
                        <td className="px-4 py-2.5 text-yaswarm-muted text-xs font-mono">
                          {e.model_used ?? "--"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={statusColors[e.status] || "yaswarm-badge-info"}>
                            {e.status ?? "unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-yaswarm-muted text-xs">
                          {e.duration_seconds != null
                            ? `${e.duration_seconds.toFixed(1)}s`
                            : "--"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-yaswarm-muted text-xs">
                          {totalTokens > 0 ? totalTokens.toLocaleString() : "--"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-yaswarm-muted text-xs font-mono">
                          {e.cost_usd != null ? `$${e.cost_usd.toFixed(6)}` : "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
