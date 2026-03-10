import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bug,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Building2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Timer,
  Plus,
  X,
  Bot,
  Play,
  Save,
  ShieldAlert,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import api from "@/api/bridge-api";

/* ─── constants ────────────────────────────────────────────── */
const STATUS_TABS = ["All", "open", "in_progress", "resolved"] as const;

const statusMeta: Record<
  string,
  { label: string; badge: string; icon: typeof Circle; color: string }
> = {
  open: {
    label: "Open",
    badge: "yaswarm-badge-error",
    icon: Circle,
    color: "text-yaswarm-error",
  },
  in_progress: {
    label: "In Progress",
    badge: "yaswarm-badge-warning",
    icon: Timer,
    color: "text-yaswarm-warning",
  },
  resolved: {
    label: "Resolved",
    badge: "yaswarm-badge-success",
    icon: CheckCircle2,
    color: "text-yaswarm-success",
  },
};

const typeBadge: Record<string, string> = {
  llm_failure: "yaswarm-badge-error",
  config_error: "yaswarm-badge-warning",
  bug: "yaswarm-badge-error",
  feature: "yaswarm-badge-info",
  improvement: "yaswarm-badge-accent",
};

const TICKET_TYPES = [
  { value: "bug", label: "Bug" },
  { value: "llm_failure", label: "LLM Failure" },
  { value: "config_error", label: "Config Error" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Improvement" },
];

const DEPT_BADGES = [
  "yaswarm-badge-accent",
  "yaswarm-badge-info",
  "yaswarm-badge-warning",
  "yaswarm-badge-success",
  "yaswarm-badge-error",
];

function badgeForDepartment(department: string): string {
  const d = String(department || "");
  if (!d) return "yaswarm-badge-info";
  let h = 0;
  for (let i = 0; i < d.length; i++) h = (h * 33 + d.charCodeAt(i)) >>> 0;
  return DEPT_BADGES[h % DEPT_BADGES.length];
}

/* ─── helpers ──────────────────────────────────────────────── */
function formatTs(ts: string | undefined): string {
  if (!ts) return "--";
  try {
    return format(parseISO(ts), "MMM dd, HH:mm");
  } catch {
    return ts;
  }
}

/* ─── skeleton ─────────────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-yaswarm-border/40 rounded ${className}`}
    />
  );
}

function TicketCardSkeleton() {
  return (
    <div className="yaswarm-card space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

/* ─── main component ───────────────────────────────────────── */
export default function TicketsPanel() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewTicket, setViewTicket] = useState<any | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // New ticket form state
  const [newType, setNewType] = useState("bug");
  const [newDept, setNewDept] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newAssigned, setNewAssigned] = useState("");
  const [newReporterRole, setNewReporterRole] = useState("department_head");
  const [newReportedBy, setNewReportedBy] = useState("");

  const ticketsQ = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const res = await api.tickets.list();
      if (!res.ok) throw new Error(res.error ?? "Failed to load tickets");
      const raw = res.data as any;
      return (raw?.tickets ?? []) as any[];
    },
  });

  const departmentsQ = useQuery({
    queryKey: ["bots", "config", "tickets"],
    queryFn: async () => {
      const res = await api.bots.list();
      if (!res.ok) throw new Error(res.error || "Failed to load departments");
      return res.data as any;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      type: string;
      department: string;
      summary: string;
      details: string;
      assigned: string;
      reporter_role: string;
      reported_by: string;
      source: string;
    }) => {
      const res = await api.tickets.create(data);
      if (!res.ok) throw new Error(res.error ?? "Failed to create ticket");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setShowNewForm(false);
      setNewType("bug");
      setNewDept("");
      setNewSummary("");
      setNewDetails("");
      setNewAssigned("");
      setNewReporterRole("department_head");
      setNewReportedBy("");
    },
  });

  const debugProvidersQ = useQuery({
    queryKey: ["models", "debug-providers", "tickets"],
    queryFn: async () => {
      const res = await api.models.debugProviders();
      if (!res.ok) throw new Error(res.error ?? "Failed to load debug providers");
      return res.data as any;
    },
  });

  const debuggerConfigQ = useQuery({
    queryKey: ["tickets", "debugger-config"],
    queryFn: async () => {
      const res = await api.tickets.debuggerConfig();
      if (!res.ok) throw new Error(res.error ?? "Failed to load ticket debugger config");
      return res.data as any;
    },
  });

  const [debuggerModel, setDebuggerModel] = useState("GLM-5");
  const [debuggerEnabled, setDebuggerEnabled] = useState(true);
  const [debuggerAutoRun, setDebuggerAutoRun] = useState(true);
  const [debuggerAllowRoot, setDebuggerAllowRoot] = useState(false);
  const [debuggerExecutionBackend, setDebuggerExecutionBackend] = useState<"bash" | "tremcp-ssh" | "auto">("bash");
  const [debuggerAllowAnyPath, setDebuggerAllowAnyPath] = useState(true);
  const [debuggerUseTremcp, setDebuggerUseTremcp] = useState(true);
  const [debuggerMaxCommands, setDebuggerMaxCommands] = useState(3);

  const saveDebuggerConfigMutation = useMutation({
    mutationFn: async (
      override?: Partial<{
        enabled: boolean;
        model: string;
        executionBackend: "bash" | "tremcp-ssh" | "auto";
        autoRun: boolean;
        allowRootActions: boolean;
        maxCommands: number;
      }>
    ) => {
      const res = await api.tickets.updateDebuggerConfig({
        enabled: override?.enabled ?? debuggerEnabled,
        model: override?.model ?? debuggerModel,
        executionBackend: override?.executionBackend ?? debuggerExecutionBackend,
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
        apiKeyEnv: "ZAI_API_KEY",
        autoRun: override?.autoRun ?? debuggerAutoRun,
        allowRootActions: override?.allowRootActions ?? debuggerAllowRoot,
        allowAnyPath: debuggerAllowAnyPath,
        useTremcpSsh: debuggerUseTremcp,
        maxCommands: override?.maxCommands ?? debuggerMaxCommands,
      });
      if (!res.ok) throw new Error(res.error ?? "Failed to save debugger config");
      return res.data as any;
    },
    onSuccess: (data) => {
      const cfg = data?.config || {};
      setDebuggerModel(String(cfg.model || "GLM-5"));
      setDebuggerEnabled(Boolean(cfg.enabled));
      setDebuggerAutoRun(Boolean(cfg.autoRun));
      setDebuggerAllowRoot(Boolean(cfg.allowRootActions));
      setDebuggerExecutionBackend(
        cfg.executionBackend === "tremcp-ssh" || cfg.executionBackend === "auto" ? cfg.executionBackend : "bash"
      );
      setDebuggerAllowAnyPath(Boolean(cfg.allowAnyPath ?? true));
      setDebuggerUseTremcp(Boolean(cfg.useTremcpSsh ?? true));
      setDebuggerMaxCommands(Number(cfg.maxCommands || 3));
      queryClient.invalidateQueries({ queryKey: ["tickets", "debugger-config"] });
    },
  });

  const runDebuggerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.tickets.runDebugger(id);
      if (!res.ok) throw new Error(res.error ?? "Failed to run ticket debugger");
      return res.data as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const tickets = ticketsQ.data ?? [];
  const debugProviders = (debugProvidersQ.data?.providers || []) as Array<any>;
  const glmProvider =
    debugProviders.find((p) => String(p.id) === "glm") || { models: ["GLM-5"] };
  const glmModels = Array.isArray(glmProvider?.models) ? glmProvider.models.map((m: any) => String(m)) : ["GLM-5"];

  useEffect(() => {
    const cfg = debuggerConfigQ.data?.config;
    if (!cfg) return;
    setDebuggerModel(String(cfg.model || "GLM-5"));
    setDebuggerEnabled(Boolean(cfg.enabled));
    setDebuggerAutoRun(Boolean(cfg.autoRun));
    setDebuggerAllowRoot(Boolean(cfg.allowRootActions));
    setDebuggerExecutionBackend(
      cfg.executionBackend === "tremcp-ssh" || cfg.executionBackend === "auto" ? cfg.executionBackend : "bash"
    );
    setDebuggerAllowAnyPath(Boolean(cfg.allowAnyPath ?? true));
    setDebuggerUseTremcp(Boolean(cfg.useTremcpSsh ?? true));
    setDebuggerMaxCommands(Number(cfg.maxCommands || 3));
  }, [debuggerConfigQ.data]);
  const departmentOptions = useMemo(() => {
    const cfg = departmentsQ.data || {};
    const deps = Object.keys((cfg?.departments || {}) as Record<string, any>);
    const uniq = Array.from(new Set(["ceo", ...deps])).filter(Boolean);
    return [{ value: "", label: "None" }, ...uniq.map((d) => ({ value: d, label: d }))];
  }, [departmentsQ.data]);

  /* ─── derived ────────────────────────────────────────────── */
  const filtered = useMemo(
    () =>
      statusFilter === "All"
        ? tickets
        : tickets.filter((t: any) => t.status === statusFilter),
    [tickets, statusFilter],
  );

  const counts = useMemo(() => {
    const c = { total: tickets.length, open: 0, in_progress: 0, resolved: 0 };
    tickets.forEach((t: any) => {
      if (t.status === "open") c.open++;
      else if (t.status === "in_progress") c.in_progress++;
      else if (t.status === "resolved") c.resolved++;
    });
    return c;
  }, [tickets]);

  const isLoading = ticketsQ.isLoading;
  const isError = ticketsQ.isError;

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleSubmitTicket = () => {
    if (!newSummary.trim()) return;
    createMutation.mutate({
      type: newType,
      department: newDept,
      summary: newSummary,
      details: newDetails,
      assigned: newAssigned,
      reporter_role: newReporterRole,
      reported_by: newReportedBy,
      source: "ui",
    });
  };

  /* ─── render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
            <Bug className="w-5 h-5 text-yaswarm-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-yaswarm-text">
              Bug Tickets
            </h2>
            <p className="text-xs text-yaswarm-muted">
              Track and manage agency issues
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="yaswarm-btn-primary flex items-center gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          New Ticket
        </button>
      </div>

      <div className="yaswarm-card space-y-3 border-yaswarm-accent/20">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-yaswarm-accent" />
          <h3 className="text-sm font-medium text-yaswarm-text">Ticket Debugger AI</h3>
        </div>
        <p className="text-xs text-yaswarm-muted">
          Automatically handles new bug tickets with GLM debugger.
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-yaswarm-muted">Debugger Live:</span>
          <span className={debuggerEnabled ? "text-yaswarm-success font-medium" : "text-yaswarm-error font-medium"}>
            {debuggerEnabled ? "ON" : "OFF"}
          </span>
          <button
            onClick={() => saveDebuggerConfigMutation.mutate({ enabled: true })}
            disabled={saveDebuggerConfigMutation.isPending || debuggerEnabled}
            className="yaswarm-btn-primary text-xs px-2.5 py-1 disabled:opacity-50"
          >
            Activate
          </button>
          <button
            onClick={() => saveDebuggerConfigMutation.mutate({ enabled: false })}
            disabled={saveDebuggerConfigMutation.isPending || !debuggerEnabled}
            className="yaswarm-btn-ghost text-xs px-2.5 py-1 border border-yaswarm-border disabled:opacity-50"
          >
            Disable
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] text-yaswarm-muted uppercase tracking-wider block mb-1">
              Debugger Model
            </label>
            <select
              value={debuggerModel}
              onChange={(e) => setDebuggerModel(e.target.value)}
              className="yaswarm-input w-full text-xs"
            >
              {glmModels.map((m: string) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-yaswarm-muted uppercase tracking-wider block mb-1">
              Execution Backend
            </label>
            <select
              value={debuggerExecutionBackend}
              onChange={(e) => setDebuggerExecutionBackend(e.target.value as "bash" | "tremcp-ssh" | "auto")}
              className="yaswarm-input w-full text-xs"
            >
              <option value="bash">bash (local backend)</option>
              <option value="auto">auto (prefer tremcp-ssh)</option>
              <option value="tremcp-ssh">tremcp-ssh only</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-yaswarm-muted uppercase tracking-wider block mb-1">
              Max Commands
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={debuggerMaxCommands}
              onChange={(e) => setDebuggerMaxCommands(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
              className="yaswarm-input w-full text-xs"
            />
          </div>
          <div className="flex items-end gap-3 md:col-span-2">
            <label className="inline-flex items-center gap-2 text-xs text-yaswarm-text">
              <input
                type="checkbox"
                checked={debuggerEnabled}
                onChange={(e) => setDebuggerEnabled(e.target.checked)}
              />
              Enabled
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-yaswarm-text">
              <input
                type="checkbox"
                checked={debuggerAutoRun}
                onChange={(e) => setDebuggerAutoRun(e.target.checked)}
              />
              Auto-run on new tickets
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-yaswarm-warning">
              <input
                type="checkbox"
                checked={debuggerAllowRoot}
                onChange={(e) => setDebuggerAllowRoot(e.target.checked)}
              />
              Allow root actions
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-yaswarm-text">
              <input
                type="checkbox"
                checked={debuggerAllowAnyPath}
                onChange={(e) => setDebuggerAllowAnyPath(e.target.checked)}
              />
              Allow any VPS path
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-yaswarm-accent">
              <input
                type="checkbox"
                checked={debuggerUseTremcp}
                onChange={(e) => setDebuggerUseTremcp(e.target.checked)}
              />
              Use tremcp-ssh tools
            </label>
          </div>
        </div>
        {debuggerAllowRoot && (
          <p className="text-[11px] text-yaswarm-warning flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Root actions enabled: debugger can execute shell commands on the server.
          </p>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => saveDebuggerConfigMutation.mutate({})}
            disabled={saveDebuggerConfigMutation.isPending}
            className="yaswarm-btn-primary text-xs px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
          >
            {saveDebuggerConfigMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Debugger Settings
          </button>
          {saveDebuggerConfigMutation.isError && (
            <span className="text-xs text-yaswarm-error">
              {saveDebuggerConfigMutation.error instanceof Error ? saveDebuggerConfigMutation.error.message : "Failed to save"}
            </span>
          )}
          {saveDebuggerConfigMutation.isSuccess && (
            <span className="text-xs text-yaswarm-success">Saved</span>
          )}
        </div>
      </div>

      {/* New ticket form */}
      {showNewForm && (
        <div className="yaswarm-card space-y-4 border-yaswarm-accent/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-yaswarm-text">Submit Bug Ticket</h3>
            <button
              onClick={() => setShowNewForm(false)}
              className="text-yaswarm-muted hover:text-yaswarm-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Type + Department row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-yaswarm-muted uppercase tracking-wider block mb-1">
                Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="yaswarm-input w-full text-xs"
              >
                {TICKET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-yaswarm-muted uppercase tracking-wider block mb-1">
                Department
              </label>
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="yaswarm-input w-full text-xs"
              >
                {departmentOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="text-[10px] text-yaswarm-muted uppercase tracking-wider block mb-1">
              Summary *
            </label>
            <input
              type="text"
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="Brief description of the issue..."
              className="yaswarm-input w-full text-xs"
            />
          </div>

          {/* Details */}
          <div>
            <label className="text-[10px] text-yaswarm-muted uppercase tracking-wider block mb-1">
              Details
            </label>
            <textarea
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              placeholder="Steps to reproduce, error messages, context..."
              className="yaswarm-input w-full text-xs h-24 resize-y font-mono"
            />
          </div>

          {/* Assign to */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-yaswarm-muted uppercase tracking-wider block mb-1">
                Assign To
              </label>
              <select
                value={newAssigned}
                onChange={(e) => setNewAssigned(e.target.value)}
                className="yaswarm-input w-full text-xs"
              >
                {departmentOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-yaswarm-muted uppercase tracking-wider block mb-1">
                Reporter Role
              </label>
              <select
                value={newReporterRole}
                onChange={(e) => setNewReporterRole(e.target.value)}
                className="yaswarm-input w-full text-xs"
              >
                <option value="department_head">Department Head</option>
                <option value="subagent">Subagent</option>
                <option value="ceo">CEO</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-yaswarm-muted uppercase tracking-wider block mb-1">
              Reported By
            </label>
            <input
              type="text"
              value={newReportedBy}
              onChange={(e) => setNewReportedBy(e.target.value)}
              placeholder="@department_head_bot or human name"
              className="yaswarm-input w-full text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowNewForm(false)}
              className="yaswarm-btn-ghost text-xs px-3 py-1.5 border border-yaswarm-border"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitTicket}
              disabled={!newSummary.trim() || createMutation.isPending}
              className="yaswarm-btn-primary text-xs px-4 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Bug className="w-3.5 h-3.5" />
              )}
              Submit Ticket
            </button>
          </div>

          {createMutation.isError && (
            <p className="text-xs text-yaswarm-error">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create ticket"}
            </p>
          )}
          {createMutation.isSuccess && (
            <p className="text-xs text-yaswarm-success">
              Ticket created successfully
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="yaswarm-card border-yaswarm-error/40 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yaswarm-error shrink-0" />
          <div>
            <p className="text-sm font-medium text-yaswarm-error">
              Failed to load tickets
            </p>
            <p className="text-xs text-yaswarm-muted mt-0.5">
              {ticketsQ.error?.message}
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="yaswarm-card">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-8 w-10" />
            </div>
          ))
        ) : (
          <>
            <div className="yaswarm-card">
              <p className="text-xs text-yaswarm-muted">Total</p>
              <p className="text-2xl font-bold text-yaswarm-text mt-1">
                {counts.total}
              </p>
            </div>
            <div className="yaswarm-card">
              <p className="text-xs text-yaswarm-muted">Open</p>
              <p className="text-2xl font-bold text-yaswarm-error mt-1">
                {counts.open}
              </p>
            </div>
            <div className="yaswarm-card">
              <p className="text-xs text-yaswarm-muted">In Progress</p>
              <p className="text-2xl font-bold text-yaswarm-warning mt-1">
                {counts.in_progress}
              </p>
            </div>
            <div className="yaswarm-card">
              <p className="text-xs text-yaswarm-muted">Resolved</p>
              <p className="text-2xl font-bold text-yaswarm-success mt-1">
                {counts.resolved}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((s) => {
          const meta = statusMeta[s];
          const label =
            s === "All" ? "All Tickets" : meta?.label ?? s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-yaswarm-accent text-yaswarm-bg"
                  : "bg-yaswarm-surface text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <TicketCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="yaswarm-card flex flex-col items-center justify-center py-12">
          <Bug className="w-10 h-10 text-yaswarm-muted mb-3" />
          <p className="text-sm text-yaswarm-muted">
            {statusFilter === "All"
              ? "No tickets found"
              : `No ${statusMeta[statusFilter]?.label?.toLowerCase() ?? statusFilter} tickets`}
          </p>
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-3 text-xs text-yaswarm-accent hover:underline"
          >
            Submit the first ticket
          </button>
        </div>
      )}

      {/* Ticket cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered
            .sort(
              (a: any, b: any) =>
                new Date(b.ts ?? 0).getTime() -
                new Date(a.ts ?? 0).getTime(),
            )
            .map((t: any) => {
              const sm = statusMeta[t.status];
              const isExpanded = expandedId === t.ticket_id;
              const StatusIcon = sm?.icon ?? Circle;

              return (
                <div
                  key={t.ticket_id}
                  className={`yaswarm-card transition-colors cursor-pointer ${
                    isExpanded
                      ? "border-yaswarm-accent/30"
                      : "hover:border-yaswarm-accent/20"
                  }`}
                  onClick={() => toggleExpand(t.ticket_id)}
                >
                  {/* Header row */}
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-yaswarm-muted" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-yaswarm-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Top line: ID + status */}
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-xs font-mono font-bold text-yaswarm-accent">
                          {t.ticket_id}
                        </span>
                        {t.type && (
                          <span
                            className={
                              typeBadge[t.type] || "yaswarm-badge-info"
                            }
                          >
                            {t.type.replace(/_/g, " ")}
                          </span>
                        )}
                        <span className={sm?.badge || "yaswarm-badge-info"}>
                          <StatusIcon className="w-3 h-3 mr-1 inline" />
                          {sm?.label ?? t.status}
                        </span>
                      </div>

                      {/* Summary */}
                      <p className="text-sm text-yaswarm-text mt-1.5 leading-relaxed">
                        {t.summary}
                      </p>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[10px] text-yaswarm-muted">
                        {t.department && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span
                              className={badgeForDepartment(t.department)}
                            >
                              {t.department}
                            </span>
                          </span>
                        )}
                        {t.assigned && (
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span
                              className={badgeForDepartment(t.assigned)}
                            >
                              {t.assigned}
                            </span>
                          </span>
                        )}
                        {t.ts && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTs(t.ts)}
                          </span>
                        )}
                        {t.reporter_role && (
                          <span className="inline-flex items-center gap-1">
                            <span className="yaswarm-badge-info">
                              {String(t.reporter_role).replace(/_/g, " ")}
                            </span>
                          </span>
                        )}
                        {t.reported_by && (
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="yaswarm-badge-info">{t.reported_by}</span>
                          </span>
                        )}
                        {t.resolved_at && (
                          <span className="inline-flex items-center gap-1 text-yaswarm-success">
                            <CheckCircle2 className="w-3 h-3" />
                            Resolved {formatTs(t.resolved_at)}
                          </span>
                        )}
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3 border-t border-yaswarm-border/50 pt-3">
                          {t.details && (
                            <div>
                              <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider mb-1">
                                Details
                              </p>
                              <p className="text-xs text-yaswarm-text leading-relaxed bg-yaswarm-surface/60 rounded-md p-3 font-mono whitespace-pre-wrap">
                                {t.details}
                              </p>
                            </div>
                          )}
                          {t.resolution && (
                            <div>
                              <p className="text-[10px] text-yaswarm-success uppercase tracking-wider mb-1">
                                Resolution
                              </p>
                              <p className="text-xs text-yaswarm-text leading-relaxed bg-yaswarm-success/5 border border-yaswarm-success/20 rounded-md p-3">
                                {t.resolution}
                              </p>
                            </div>
                          )}
                          {t.debugger && (
                            <div>
                              <p className="text-[10px] text-yaswarm-accent uppercase tracking-wider mb-1">
                                Debugger
                              </p>
                              <div className="bg-yaswarm-surface/60 rounded-md p-3 space-y-1.5">
                                <p className="text-xs text-yaswarm-text">
                                  status: <span className="font-mono">{String(t.debugger.status || "--")}</span> · model:{" "}
                                  <span className="font-mono">{String(t.debugger.model || "--")}</span>
                                </p>
                                {Array.isArray(t.debugger.activity) && t.debugger.activity.length > 0 && (
                                  <div className="space-y-1">
                                    {t.debugger.activity.map((line: string, idx: number) => (
                                      <p key={`${t.ticket_id}-dbg-${idx}`} className="text-[11px] text-yaswarm-muted">
                                        • {line}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="pt-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewTicket(t);
                                }}
                                className="yaswarm-btn-ghost text-xs px-2.5 py-1.5 border border-yaswarm-border"
                              >
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  runDebuggerMutation.mutate(String(t.ticket_id));
                                }}
                                disabled={runDebuggerMutation.isPending}
                                className="yaswarm-btn-ghost text-xs px-2.5 py-1.5 border border-yaswarm-border disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {runDebuggerMutation.isPending ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Play className="w-3.5 h-3.5" />
                                )}
                                Run Debugger Now
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {viewTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-auto yaswarm-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-yaswarm-text">
                  Ticket Task Viewer
                </h3>
                <p className="text-xs text-yaswarm-muted mt-0.5">
                  {String(viewTicket.ticket_id || "--")} · {String(viewTicket.summary || "")}
                </p>
              </div>
              <button
                onClick={() => setViewTicket(null)}
                className="text-yaswarm-muted hover:text-yaswarm-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!viewTicket.debugger ? (
              <div className="rounded-md border border-yaswarm-border p-3 text-xs text-yaswarm-muted">
                No debugger activity yet for this ticket.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md border border-yaswarm-border p-3 text-xs space-y-1">
                  <p className="text-yaswarm-text">
                    Status: <span className="font-mono">{String(viewTicket.debugger.status || "--")}</span>
                  </p>
                  <p className="text-yaswarm-text">
                    Model: <span className="font-mono">{String(viewTicket.debugger.model || "--")}</span>
                  </p>
                  <p className="text-yaswarm-text">
                    Attempt: <span className="font-mono">{String(viewTicket.debugger.attempt || 1)}</span>
                  </p>
                  <p className="text-yaswarm-text">
                    Last Run: <span className="font-mono">{String(viewTicket.debugger.lastRunAt || "--")}</span>
                  </p>
                </div>

                <div className="rounded-md border border-yaswarm-border p-3">
                  <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider mb-2">Tasks / Activity So Far</p>
                  {Array.isArray(viewTicket.debugger.activity) && viewTicket.debugger.activity.length > 0 ? (
                    <div className="space-y-1">
                      {viewTicket.debugger.activity.map((line: string, idx: number) => (
                        <p key={`view-${viewTicket.ticket_id}-${idx}`} className="text-xs text-yaswarm-text">
                          {idx + 1}. {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-yaswarm-muted">No activity lines recorded yet.</p>
                  )}
                </div>

                <div className="rounded-md border border-yaswarm-border p-3">
                  <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider mb-2">Planned Actions</p>
                  {Array.isArray(viewTicket.debugger.plan?.actions) && viewTicket.debugger.plan.actions.length > 0 ? (
                    <div className="space-y-2">
                      {viewTicket.debugger.plan.actions.map((a: any, i: number) => (
                        <div key={`plan-${i}`} className="text-xs text-yaswarm-text bg-yaswarm-surface/60 rounded p-2">
                          <p>Type: <span className="font-mono">{String(a?.type || "--")}</span></p>
                          {a?.command && <p>Command: <span className="font-mono">{String(a.command)}</span></p>}
                          {a?.note && <p>Note: {String(a.note)}</p>}
                          {a?.reason && <p className="text-yaswarm-muted">Reason: {String(a.reason)}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-yaswarm-muted">No planned actions recorded.</p>
                  )}
                </div>

                <div className="rounded-md border border-yaswarm-border p-3">
                  <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider mb-2">Resolution / Output</p>
                  <pre className="text-xs text-yaswarm-text whitespace-pre-wrap font-mono bg-yaswarm-surface/60 rounded p-2">
                    {String(viewTicket.resolution || viewTicket.debugger.plan?.resolution || "No resolution output yet.")}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
