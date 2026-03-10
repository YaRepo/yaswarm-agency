import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, Loader2, Terminal } from "lucide-react";
import api from "@/api/bridge-api";

interface AgentStatus {
  bot_id: string;
  bot_name: string;
  department: string;
  status: "idle" | "active" | "busy" | "offline";
  last_activity: string;
  pid: number | null;
  current_task: string | null;
}

function colorForDepartment(department: string): string {
  const palette = [
    "text-blue-400",
    "text-cyan-400",
    "text-emerald-400",
    "text-amber-400",
    "text-pink-400",
    "text-violet-400",
    "text-orange-400",
  ];
  const d = String(department || "unknown");
  let h = 0;
  for (let i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export default function AgentStatusPanel() {
  const statusesQ = useQuery({
    queryKey: ["agents", "status"],
    queryFn: async () => {
      const res = await api.agents.status();
      if (!res.ok) throw new Error(res.error || "Failed to fetch agent status");
      return ((res.data as any)?.agents || []) as AgentStatus[];
    },
    refetchInterval: 10000,
  });

  const statuses = statusesQ.data || [];
  const activeCount = useMemo(
    () => statuses.filter((s) => s.status === "active" || s.status === "busy").length,
    [statuses]
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-yaswarm-text">Agent Status</h2>
        <p className="text-xs text-yaswarm-muted">Live status from YaSwarm sessions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Agents</p>
          <p className="text-2xl font-bold text-yaswarm-text mt-1">{statuses.length}</p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Active/Busy</p>
          <p className="text-2xl font-bold text-yaswarm-success mt-1">{activeCount}</p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Offline</p>
          <p className="text-2xl font-bold text-yaswarm-error mt-1">
            {statuses.filter((s) => s.status === "offline").length}
          </p>
        </div>
      </div>

      {statusesQ.isLoading && (
        <div className="flex items-center gap-2 text-sm text-yaswarm-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading status...
        </div>
      )}

      {statusesQ.isError && (
        <div className="yaswarm-card border-yaswarm-error/40 text-sm text-yaswarm-error">
          {statusesQ.error instanceof Error ? statusesQ.error.message : "Failed to load status"}
        </div>
      )}

      {!statusesQ.isLoading && !statusesQ.isError && statuses.length === 0 && (
        <div className="yaswarm-card text-xs text-yaswarm-muted">No active agent sessions found.</div>
      )}

      {!statusesQ.isLoading && statuses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {statuses.map((agent) => (
            <div key={agent.bot_id} className="yaswarm-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-yaswarm-text">{agent.bot_name}</p>
                <span className="text-[10px] text-yaswarm-muted uppercase">{agent.status}</span>
              </div>
              <p className={`text-xs mt-1 ${colorForDepartment(agent.department)}`}>{agent.department}</p>
              <div className="mt-2 text-[11px] text-yaswarm-muted space-y-1">
                <div className="flex items-center gap-1">
                  {agent.status === "busy" ? <Clock className="w-3 h-3" /> : agent.status === "offline" ? <Terminal className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                  <span>{agent.last_activity || "n/a"}</span>
                </div>
                <div>pid: {agent.pid ?? "-"}</div>
                <div className="truncate">task: {agent.current_task || "-"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
