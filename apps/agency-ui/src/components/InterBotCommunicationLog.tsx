import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare } from "lucide-react";
import api from "@/api/bridge-api";

interface DelegationEvent {
  id: string;
  timestamp: string;
  from_bot: string;
  to_bot: string;
  task_summary: string;
  status: "sent" | "failed" | "acknowledged";
}

interface MentionEvent {
  id: string;
  timestamp: string;
  bot_id: string;
  mention_text: string;
  target_bot: string;
  status: "resolved" | "failed" | "not_found";
}

export default function InterBotCommunicationLog() {
  const delegationsQ = useQuery({
    queryKey: ["communication", "delegations"],
    queryFn: async () => {
      const res = await api.communication.delegations();
      if (!res.ok) throw new Error(res.error || "Failed to fetch delegations");
      return ((res.data as any)?.events || []) as DelegationEvent[];
    },
    refetchInterval: 15000,
  });
  const mentionsQ = useQuery({
    queryKey: ["communication", "mentions"],
    queryFn: async () => {
      const res = await api.communication.mentions();
      if (!res.ok) throw new Error(res.error || "Failed to fetch mentions");
      return ((res.data as any)?.events || []) as MentionEvent[];
    },
    refetchInterval: 15000,
  });

  const loading = delegationsQ.isLoading || mentionsQ.isLoading;
  const error = delegationsQ.error || mentionsQ.error;
  const delegations = useMemo(() => (delegationsQ.data || []).slice(0, 100), [delegationsQ.data]);
  const mentions = useMemo(() => (mentionsQ.data || []).slice(0, 100), [mentionsQ.data]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-yaswarm-text">Inter-Bot Communication</h2>
        <p className="text-xs text-yaswarm-muted">Delegations and mention resolution events</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-yaswarm-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading communication events...
        </div>
      )}

      {error && (
        <div className="yaswarm-card border-yaswarm-error/40 text-sm text-yaswarm-error">
          {error instanceof Error ? error.message : "Failed to load communication events"}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <section className="yaswarm-card">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-yaswarm-accent" />
              <h3 className="text-sm font-semibold text-yaswarm-text">Delegations ({delegations.length})</h3>
            </div>
            <div className="space-y-2 max-h-[55vh] overflow-y-auto">
              {delegations.length === 0 && <p className="text-xs text-yaswarm-muted">No delegations recorded.</p>}
              {delegations.map((e) => (
                <div key={e.id} className="border border-yaswarm-border/50 rounded p-2">
                  <p className="text-xs text-yaswarm-text">{e.from_bot} {"->"} {e.to_bot}</p>
                  <p className="text-[11px] text-yaswarm-muted truncate">{e.task_summary}</p>
                  <p className="text-[10px] text-yaswarm-muted">{e.status} | {new Date(e.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="yaswarm-card">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-yaswarm-accent" />
              <h3 className="text-sm font-semibold text-yaswarm-text">Mentions ({mentions.length})</h3>
            </div>
            <div className="space-y-2 max-h-[55vh] overflow-y-auto">
              {mentions.length === 0 && <p className="text-xs text-yaswarm-muted">No mention events recorded.</p>}
              {mentions.map((e) => (
                <div key={e.id} className="border border-yaswarm-border/50 rounded p-2">
                  <p className="text-xs text-yaswarm-text">{e.bot_id} {"->"} {e.target_bot}</p>
                  <p className="text-[11px] text-yaswarm-muted truncate">"{e.mention_text}"</p>
                  <p className="text-[10px] text-yaswarm-muted">{e.status} | {new Date(e.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
