import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cpu, Loader2 } from "lucide-react";
import api from "@/api/bridge-api";

interface RoutingEvent {
  id: string;
  timestamp: string;
  task_type: string;
  from_model: string;
  to_model: string;
  department: string;
  reason: string;
}

export default function ModelRoutingVisualization() {
  const eventsQ = useQuery({
    queryKey: ["model-routing", "events"],
    queryFn: async () => {
      const res = await api.modelRouting.events();
      if (!res.ok) throw new Error(res.error || "Failed to fetch routing events");
      return ((res.data as any)?.events || []) as RoutingEvent[];
    },
    refetchInterval: 15000,
  });

  const events = useMemo(
    () =>
      (eventsQ.data || [])
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [eventsQ.data]
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-yaswarm-text">Model Routing</h2>
        <p className="text-xs text-yaswarm-muted">Recent model escalation and routing decisions</p>
      </div>

      {eventsQ.isLoading && (
        <div className="flex items-center gap-2 text-sm text-yaswarm-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading routing events...
        </div>
      )}

      {eventsQ.isError && (
        <div className="yaswarm-card border-yaswarm-error/40 text-sm text-yaswarm-error">
          {eventsQ.error instanceof Error ? eventsQ.error.message : "Failed to load routing events"}
        </div>
      )}

      {!eventsQ.isLoading && !eventsQ.isError && (
        <div className="yaswarm-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-yaswarm-text">Recent Events</h3>
            <span className="text-xs text-yaswarm-muted">{events.length}</span>
          </div>
          <div className="space-y-2 max-h-[65vh] overflow-y-auto">
            {events.length === 0 && (
              <p className="text-xs text-yaswarm-muted">No routing events recorded yet.</p>
            )}
            {events.map((e) => (
              <div key={e.id} className="border border-yaswarm-border/50 rounded p-2">
                <p className="text-xs text-yaswarm-text flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-yaswarm-accent" />
                  {e.from_model} {"->"} {e.to_model}
                </p>
                <p className="text-[11px] text-yaswarm-muted mt-1">{e.department} | {e.task_type}</p>
                <p className="text-[11px] text-yaswarm-muted truncate">{e.reason}</p>
                <p className="text-[10px] text-yaswarm-muted mt-1">{new Date(e.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
