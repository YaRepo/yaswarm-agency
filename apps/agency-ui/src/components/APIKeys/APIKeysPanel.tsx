import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Save, RefreshCw } from "lucide-react";
import api from "@/api/bridge-api";

type Scope = "agency" | "root";

export default function APIKeysPanel() {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<Scope>("agency");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const scopesQ = useQuery({
    queryKey: ["env", "scopes"],
    queryFn: async () => {
      const res = await api.env.scopes();
      if (!res.ok) throw new Error(res.error || "Failed to load scopes");
      return (res.data as any)?.scopes ?? [];
    },
  });

  const entriesQ = useQuery({
    queryKey: ["env", "entries", scope],
    queryFn: async () => {
      const res = await api.env.entries(scope);
      if (!res.ok) throw new Error(res.error || "Failed to load env entries");
      return res.data as any;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const envKey = key.trim().toUpperCase();
      const res = await api.env.upsert(scope, envKey, value);
      if (!res.ok) throw new Error(res.error || "Failed to save API key");
      return { envKey };
    },
    onSuccess: ({ envKey }) => {
      setMessage(`Saved ${envKey}`);
      setValue("");
      queryClient.invalidateQueries({ queryKey: ["env", "entries", scope] });
      setTimeout(() => setMessage(null), 2000);
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : "Save failed"),
  });

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="yaswarm-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-yaswarm-accent" />
          <h2 className="text-sm font-semibold text-yaswarm-text">API Keys Manager</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            className="yaswarm-input"
          >
            <option value="agency">agency (.env)</option>
            <option value="root">root (/root/agency.env)</option>
          </select>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="API key name (e.g. OPENAI_API_KEY)"
            className="yaswarm-input"
          />
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="API key value"
            className="yaswarm-input"
          />
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!key.trim() || saveMutation.isPending}
            className="yaswarm-btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>

        {message && <p className="text-xs text-yaswarm-muted mt-2">{message}</p>}
      </div>

      <div className="yaswarm-card p-4 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-yaswarm-muted">
            {entriesQ.data?.path || "..."}
          </div>
          <button
            onClick={() => entriesQ.refetch()}
            className="yaswarm-btn-ghost text-xs px-2 py-1 border border-yaswarm-border flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        <div className="flex-1 overflow-auto border border-yaswarm-border rounded-md">
          {entriesQ.isLoading || scopesQ.isLoading ? (
            <div className="p-4 text-xs text-yaswarm-muted flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-yaswarm-hover sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">Key</th>
                  <th className="text-left px-3 py-2">Masked Value</th>
                </tr>
              </thead>
              <tbody>
                {(entriesQ.data?.entries || []).map((entry: { key: string; maskedValue: string }) => (
                  <tr key={entry.key} className="border-t border-yaswarm-border">
                    <td className="px-3 py-2 font-mono">{entry.key}</td>
                    <td className="px-3 py-2 text-yaswarm-muted">{entry.maskedValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
