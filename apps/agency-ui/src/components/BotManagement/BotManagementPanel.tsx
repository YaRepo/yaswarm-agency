import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Circle,
  Crown,
  ChevronDown,
  ChevronRight,
  Server,
  Cpu,
  Users,
  Layers,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Plus,
  Pencil,
  Save,
  X,
} from "lucide-react";
import api from "@/api/bridge-api";
import { useAuthStore } from "@/stores/auth";

/* ─── colour map ───────────────────────────────────────────── */
const deptColor: Record<string, string> = {
  ceo: "yaswarm-badge-accent",
  yadev: "yaswarm-badge-info",
  yacreative: "yaswarm-badge-warning",
  yaresearch: "yaswarm-badge-success",
  yaops: "yaswarm-badge-error",
  yamarketing: "yaswarm-badge-warning",
  yarepo: "yaswarm-badge-info",
};

const categoryColor: Record<string, string> = {
  coding: "yaswarm-badge-info",
  research: "yaswarm-badge-success",
  creative: "yaswarm-badge-warning",
  ops: "yaswarm-badge-error",
  marketing: "yaswarm-badge-accent",
  planning: "yaswarm-badge-warning",
  review: "yaswarm-badge-success",
  devops: "yaswarm-badge-info",
  infra: "yaswarm-badge-info",
  repo: "yaswarm-badge-info",
  default: "yaswarm-badge-accent",
};

/* ─── skeleton loader ──────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-yaswarm-border/40 rounded ${className}`}
    />
  );
}

function StatSkeleton() {
  return (
    <div className="yaswarm-card">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-12" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="yaswarm-card space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

/* ─── main component ───────────────────────────────────────── */
export default function BotManagementPanel() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [syncResult, setSyncResult] = useState<any>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardResult, setWizardResult] = useState<any>(null);
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [wizardModelSearch, setWizardModelSearch] = useState("");
  const [wizardFreeOnly, setWizardFreeOnly] = useState(false);
  const [editModelSearch, setEditModelSearch] = useState("");
  const [editFreeOnly, setEditFreeOnly] = useState(false);
  const [editForm, setEditForm] = useState({
    departmentName: "",
    role: "",
    botName: "",
    botId: "",
    tokenEnv: "",
    token: "",
    backend: "opencode",
    modelTier: "medium",
    model: "",
    fallbackModels: [] as string[],
    providerIds: [] as string[],
    backendUrl: "",
    topicName: "",
    autoInstallBackend: true,
  });
  const [wizardForm, setWizardForm] = useState({
    departmentId: "",
    departmentName: "",
    role: "",
    botName: "",
    botId: "",
    tokenEnv: "",
    token: "",
    backend: "opencode",
    modelTier: "medium",
    model: "",
    fallbackModels: [] as string[],
    providerIds: [] as string[],
    backendUrl: "",
    autoInstallBackend: true,
    topicName: "",
    companyReference: "",
  });
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const configQ = useQuery({
    queryKey: ["bots", "config"],
    queryFn: async () => {
      const res = await api.bots.list();
      if (!res.ok) throw new Error(res.error ?? "Failed to load bot config");
      return res.data as any;
    },
  });

  const subAgentsQ = useQuery({
    queryKey: ["bots", "subAgents"],
    queryFn: async () => {
      const res = await api.bots.subAgents();
      if (!res.ok)
        throw new Error(res.error ?? "Failed to load sub-agent data");
      return res.data as any;
    },
  });

  const backendToolsQ = useQuery({
    queryKey: ["bots", "backendTools"],
    queryFn: async () => {
      const res = await api.bots.backendTools();
      if (!res.ok) throw new Error(res.error ?? "Failed to load backend tools");
      return res.data as any;
    },
  });

  const wizardCapabilitiesQ = useQuery({
    queryKey: ["bots", "backendCapabilities", wizardForm.backend],
    queryFn: async () => {
      const res = await api.bots.backendCapabilities(wizardForm.backend);
      if (!res.ok) throw new Error(res.error ?? "Failed to load backend capabilities");
      return res.data as any;
    },
    enabled: Boolean(wizardForm.backend),
  });

  const editCapabilitiesQ = useQuery({
    queryKey: ["bots", "backendCapabilities", editingDepartment, editForm.backend],
    queryFn: async () => {
      const res = await api.bots.backendCapabilities(editForm.backend);
      if (!res.ok) throw new Error(res.error ?? "Failed to load backend capabilities");
      return res.data as any;
    },
    enabled: Boolean(editingDepartment && editForm.backend),
  });

  const isLoading = configQ.isLoading || subAgentsQ.isLoading;
  const isError = configQ.isError || subAgentsQ.isError;
  const errorMsg =
    configQ.error?.message || subAgentsQ.error?.message || "Unknown error";

  // Sync agents mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/bots/sync-agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    },
    onSuccess: (data) => {
      setSyncResult(data);
      queryClient.invalidateQueries({ queryKey: ["bots"] });
      // Clear result after 10 seconds
      setTimeout(() => setSyncResult(null), 10000);
    },
  });

  const addDepartmentMutation = useMutation({
    mutationFn: async () => {
      const res = await api.bots.addDepartment({
        departmentId: wizardForm.departmentId,
        departmentName: wizardForm.departmentName,
        role: wizardForm.role,
        botName: wizardForm.botName,
        botId: wizardForm.botId,
        tokenEnv: wizardForm.tokenEnv,
        token: wizardForm.token,
        backend: wizardForm.backend,
        modelTier: wizardForm.modelTier,
        model: wizardForm.model,
        fallbackModels: wizardForm.fallbackModels,
        providerIds: wizardForm.providerIds,
        backendUrl: wizardForm.backendUrl,
        autoInstallBackend: wizardForm.autoInstallBackend,
        topicName: wizardForm.topicName,
        companyReference: wizardForm.companyReference,
      });
      if (!res.ok) throw new Error(res.error ?? "Failed to add department");
      return res.data;
    },
    onSuccess: (data) => {
      setWizardResult(data);
      setShowWizard(false);
      setWizardForm({
        departmentId: "",
        departmentName: "",
        role: "",
        botName: "",
        botId: "",
        tokenEnv: "",
        token: "",
        backend: "opencode",
        modelTier: "medium",
        model: "",
        fallbackModels: [],
        providerIds: [],
        backendUrl: "",
        autoInstallBackend: true,
        topicName: "",
        companyReference: "",
      });
      queryClient.invalidateQueries({ queryKey: ["bots"] });
      setTimeout(() => setWizardResult(null), 12000);
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async () => {
      if (!editingDepartment) throw new Error("No department selected");
      const res = await api.bots.updateDepartment(editingDepartment, {
        departmentName: editForm.departmentName,
        role: editForm.role,
        botName: editForm.botName,
        botId: editForm.botId,
        tokenEnv: editForm.tokenEnv,
        token: editForm.token,
        backend: editForm.backend,
        modelTier: editForm.modelTier,
        model: editForm.model,
        fallbackModels: editForm.fallbackModels,
        providerIds: editForm.providerIds,
        backendUrl: editForm.backendUrl,
        topicName: editForm.topicName,
        autoInstallBackend: editForm.autoInstallBackend,
      });
      if (!res.ok) throw new Error(res.error ?? "Failed to update department");
      return res.data;
    },
    onSuccess: () => {
      setEditingDepartment(null);
      setEditForm({
        departmentName: "",
        role: "",
        botName: "",
        botId: "",
        tokenEnv: "",
        token: "",
        backend: "opencode",
        modelTier: "medium",
        model: "",
        fallbackModels: [],
        providerIds: [],
        backendUrl: "",
        topicName: "",
        autoInstallBackend: true,
      });
      queryClient.invalidateQueries({ queryKey: ["bots"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
      queryClient.invalidateQueries({ queryKey: ["env", "entries"] });
    },
  });
  const updateCeoMutation = useMutation({
    mutationFn: async () => {
      const res = await api.bots.updateCeo({
        role: editForm.role,
        botName: editForm.botName,
        botId: editForm.botId,
        tokenEnv: editForm.tokenEnv,
        token: editForm.token,
        backend: editForm.backend,
        modelTier: editForm.modelTier,
        model: editForm.model,
        fallbackModels: editForm.fallbackModels,
        providerIds: editForm.providerIds,
        backendUrl: editForm.backendUrl,
        topicName: editForm.topicName,
        autoInstallBackend: editForm.autoInstallBackend,
      });
      if (!res.ok) throw new Error(res.error ?? "Failed to update CEO");
      return res.data;
    },
    onSuccess: () => {
      setEditingDepartment(null);
      setEditForm({
        departmentName: "",
        role: "",
        botName: "",
        botId: "",
        tokenEnv: "",
        token: "",
        backend: "opencode",
        modelTier: "medium",
        model: "",
        fallbackModels: [],
        providerIds: [],
        backendUrl: "",
        topicName: "",
        autoInstallBackend: true,
      });
      queryClient.invalidateQueries({ queryKey: ["bots"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
      queryClient.invalidateQueries({ queryKey: ["env", "entries"] });
    },
  });

  const config = configQ.data;
  const subAgentsData = subAgentsQ.data;
  const backendOptions = (backendToolsQ.data?.backendOptions || [
    { value: "opencode", label: "OpenCode CLI" },
    { value: "glm", label: "GLM Direct Backend" },
    { value: "custom", label: "Custom Provider Backend" },
  ]) as Array<{ value: string; label: string; installed?: boolean; authConnected?: boolean }>;

  /* derived counts */
  const departments = config?.departments
    ? Object.entries(config.departments)
    : [];
  const totalBots = 1 + departments.length; // CEO + departments

  const totalSubAgents = subAgentsData?.departments
    ? Object.values(subAgentsData.departments as Record<string, any>).reduce(
        (sum: number, dept: any) =>
          sum + (dept.sub_agents ? Object.keys(dept.sub_agents).length : 0),
        0,
      )
    : 0;

  const modelCategories = new Set<string>();
  if (subAgentsData?.departments) {
    Object.values(subAgentsData.departments as Record<string, any>).forEach(
      (dept: any) => {
        if (dept.sub_agents) {
          Object.values(dept.sub_agents as Record<string, any>).forEach(
            (sa: any) => {
              if (sa.category) modelCategories.add(sa.category);
            },
          );
        }
      },
    );
  }

  const toggleExpand = (key: string) =>
    setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const beginEditDepartment = (key: string, dept: any) => {
    setEditingDepartment(key);
    setEditModelSearch("");
    setEditFreeOnly(false);
    setEditForm({
      departmentName: dept.department || "",
      role: dept.role || "",
      botName: dept.bot_name || "",
      botId: dept.bot_id || "",
      tokenEnv: dept.token_env || "",
      token: "",
      backend: dept.backend || "opencode",
      modelTier: dept.model_tier || "medium",
      model: dept.model || "",
      fallbackModels: Array.isArray(dept.fallback_models) ? dept.fallback_models : [],
      providerIds: Array.isArray(dept.provider_ids) ? dept.provider_ids : [],
      backendUrl: dept.backend_url || "",
      topicName: dept.topic_name || "",
      autoInstallBackend: true,
    });
  };

  const beginEditCeo = (ceo: any) => {
    setEditingDepartment("ceo");
    setEditModelSearch("");
    setEditFreeOnly(false);
    setEditForm({
      departmentName: "CEO",
      role: ceo.role || "",
      botName: ceo.bot_name || "",
      botId: ceo.bot_id || "",
      tokenEnv: ceo.token_env || "YASWARM_CEO_BOT_TOKEN",
      token: "",
      backend: ceo.backend || "opencode",
      modelTier: ceo.model_tier || "high",
      model: ceo.model || "",
      fallbackModels: Array.isArray(ceo.fallback_models) ? ceo.fallback_models : [],
      providerIds: Array.isArray(ceo.provider_ids) ? ceo.provider_ids : [],
      backendUrl: ceo.backend_url || "",
      topicName: ceo.topic_name || "",
      autoInstallBackend: true,
    });
  };

  const toggleStringInList = (value: string, list: string[]): string[] => {
    if (list.includes(value)) return list.filter((x) => x !== value);
    return [...list, value];
  };

  function buildFilteredModels(
    capabilities: any,
    search: string,
    freeOnly: boolean,
    selectedProviderIds: string[],
  ): string[] {
    const options = Array.isArray(capabilities?.modelOptions)
      ? capabilities.modelOptions
      : Array.isArray(capabilities?.models)
      ? capabilities.models.map((m: string) => ({
          id: String(m),
          providerId: "",
          providerName: "",
          isFree: null,
        }))
      : [];
    const needle = search.trim().toLowerCase();
    return options
      .filter((opt: any) => {
        const id = String(opt?.id || "");
        if (!id) return false;
        if (selectedProviderIds.length > 0 && opt?.providerId) {
          if (!selectedProviderIds.includes(String(opt.providerId))) return false;
        }
        if (freeOnly && opt?.isFree !== true) return false;
        if (!needle) return true;
        const hay = `${id} ${String(opt?.providerId || "")} ${String(opt?.providerName || "")}`.toLowerCase();
        return hay.includes(needle);
      })
      .map((opt: any) => String(opt.id));
  }

  const wizardFilteredModels = buildFilteredModels(
    wizardCapabilitiesQ.data,
    wizardModelSearch,
    wizardFreeOnly,
    wizardForm.providerIds,
  );
  const editFilteredModels = buildFilteredModels(
    editCapabilitiesQ.data,
    editModelSearch,
    editFreeOnly,
    editForm.providerIds,
  );

  /* ─── render ───────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-yaswarm-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-yaswarm-text">
              Bot Management
            </h2>
            <p className="text-xs text-yaswarm-muted">
              Agency workforce overview and controls
            </p>
          </div>
        </div>

        {/* Sync Agents button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setWizardModelSearch("");
              setWizardFreeOnly(false);
              setShowWizard((v) => !v);
            }}
            className="yaswarm-btn-ghost flex items-center gap-2 px-3 py-2 text-xs border border-yaswarm-border"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Department
          </button>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="yaswarm-btn-primary flex items-center gap-2 px-3 py-2 text-xs"
            title="Sync department agents into local YaSwarm registry"
          >
            {syncMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Sync Agents
          </button>
        </div>
      </div>

      {showWizard && (
        <div className="yaswarm-card border-yaswarm-accent/30 space-y-3">
          <div>
            <p className="text-sm font-semibold text-yaswarm-text">Add Department Wizard</p>
            <p className="text-xs text-yaswarm-muted mt-0.5">
              Creates department head bot + updates agency config + syncs local YaSwarm registry automatically.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="yaswarm-input text-xs md:col-span-2"
              placeholder="Company Reference / Business Model (e.g. SaaS product studio, book publisher, film agency)"
              value={wizardForm.companyReference}
              onChange={(e) => setWizardForm((p) => ({ ...p, companyReference: e.target.value }))}
            />
            <input
              className="yaswarm-input text-xs"
              placeholder="Department ID (e.g. legal-affairs)"
              value={wizardForm.departmentId}
              onChange={(e) => setWizardForm((p) => ({ ...p, departmentId: e.target.value }))}
            />
            <input
              className="yaswarm-input text-xs"
              placeholder="Department Name (e.g. Legal Affairs)"
              value={wizardForm.departmentName}
              onChange={(e) => setWizardForm((p) => ({ ...p, departmentName: e.target.value }))}
            />
            <input
              className="yaswarm-input text-xs"
              placeholder="Head Role (default: <Department> Lead)"
              value={wizardForm.role}
              onChange={(e) => setWizardForm((p) => ({ ...p, role: e.target.value }))}
            />
            <input
              className="yaswarm-input text-xs"
              placeholder="Bot Name (default: YaSwarm <Department>)"
              value={wizardForm.botName}
              onChange={(e) => setWizardForm((p) => ({ ...p, botName: e.target.value }))}
            />
            <input
              className="yaswarm-input text-xs"
              placeholder="Bot Handle (without @, optional)"
              value={wizardForm.botId}
              onChange={(e) => setWizardForm((p) => ({ ...p, botId: e.target.value }))}
            />
            <input
              className="yaswarm-input text-xs"
              placeholder="Telegram Bot Token ENV key (optional)"
              value={wizardForm.tokenEnv}
              onChange={(e) => setWizardForm((p) => ({ ...p, tokenEnv: e.target.value }))}
            />
            <input
              className="yaswarm-input text-xs"
              placeholder="Topic Name (optional)"
              value={wizardForm.topicName}
              onChange={(e) => setWizardForm((p) => ({ ...p, topicName: e.target.value }))}
            />
            <input
              className="yaswarm-input text-xs"
              placeholder="Telegram Bot API Token (optional, saved to agency .env)"
              type="password"
              value={wizardForm.token}
              onChange={(e) => setWizardForm((p) => ({ ...p, token: e.target.value }))}
            />
            <select
              className="yaswarm-input text-xs"
              value={wizardForm.backend}
              onChange={(e) => setWizardForm((p) => ({ ...p, backend: e.target.value }))}
            >
              {backendOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                  {opt.installed === false ? " (not installed)" : ""}
                </option>
              ))}
            </select>
            <select
              className="yaswarm-input text-xs"
              value={wizardForm.modelTier}
              onChange={(e) => setWizardForm((p) => ({ ...p, modelTier: e.target.value }))}
            >
              <option value="small">small</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <input
              className="yaswarm-input text-xs"
              placeholder="Model override (optional)"
              value={wizardForm.model}
              onChange={(e) => setWizardForm((p) => ({ ...p, model: e.target.value }))}
            />
            {wizardCapabilitiesQ.data?.models?.length > 0 && (
              <>
                <input
                  className="yaswarm-input text-xs md:col-span-2"
                  placeholder="Search models (name/provider)"
                  value={wizardModelSearch}
                  onChange={(e) => setWizardModelSearch(e.target.value)}
                />
                <label className="inline-flex items-center gap-2 text-xs text-yaswarm-muted md:col-span-2">
                  <input
                    type="checkbox"
                    checked={wizardFreeOnly}
                    onChange={(e) => setWizardFreeOnly(e.target.checked)}
                  />
                  Free models only
                </label>
                <select
                  className="yaswarm-input text-xs"
                  value={wizardForm.model}
                  onChange={(e) => setWizardForm((p) => ({ ...p, model: e.target.value }))}
                >
                  <option value="">Select primary model</option>
                  {wizardFilteredModels.map((m: string) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  multiple
                  className="yaswarm-input text-xs h-28 md:col-span-2"
                  value={wizardForm.fallbackModels}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setWizardForm((p) => ({ ...p, fallbackModels: selected }));
                  }}
                >
                  {wizardFilteredModels
                    .filter((m: string) => m !== wizardForm.model)
                    .map((m: string) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                </select>
              </>
            )}
            {wizardCapabilitiesQ.data?.providers?.length > 0 && (
              <div className="md:col-span-2 border border-yaswarm-border/60 rounded-md p-2">
                <p className="text-[11px] text-yaswarm-muted mb-2">Connected providers</p>
                <div className="flex flex-wrap gap-1.5">
                  {wizardCapabilitiesQ.data.providers.map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setWizardForm((prev) => ({
                          ...prev,
                          providerIds: toggleStringInList(p.id, prev.providerIds),
                        }))
                      }
                      className={`text-[10px] px-2 py-1 rounded border ${
                        wizardForm.providerIds.includes(p.id)
                          ? "border-yaswarm-accent/50 bg-yaswarm-accent/15 text-yaswarm-accent"
                          : "border-yaswarm-border text-yaswarm-muted hover:text-yaswarm-text"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {wizardForm.backend === "custom" && (
              <input
                className="yaswarm-input text-xs md:col-span-2"
                placeholder="Custom Provider URL (e.g. https://api.provider.com/v1)"
                value={wizardForm.backendUrl}
                onChange={(e) => setWizardForm((p) => ({ ...p, backendUrl: e.target.value }))}
              />
            )}
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-yaswarm-muted">
            <input
              type="checkbox"
              checked={wizardForm.autoInstallBackend}
              onChange={(e) =>
                setWizardForm((p) => ({ ...p, autoInstallBackend: e.target.checked }))
              }
            />
            Auto-install backend CLI if missing
          </label>
          {wizardForm.backend === "custom" && (
            <p className="text-[11px] text-yaswarm-warning">
              Custom backend selected: add provider API key from API Keys tab.
            </p>
          )}
          {wizardCapabilitiesQ.data?.guidance && (
            <p className="text-[11px] text-yaswarm-muted">{wizardCapabilitiesQ.data.guidance}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              className="yaswarm-btn-primary text-xs px-3 py-2 flex items-center gap-2"
              disabled={addDepartmentMutation.isPending}
              onClick={() => addDepartmentMutation.mutate()}
            >
              {addDepartmentMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              Create And Sync
            </button>
            <button
              className="yaswarm-btn-ghost text-xs px-3 py-2 border border-yaswarm-border"
              onClick={() => setShowWizard(false)}
            >
              Cancel
            </button>
          </div>
          {addDepartmentMutation.isError && (
            <p className="text-xs text-yaswarm-error">
              {addDepartmentMutation.error?.message}
            </p>
          )}
        </div>
      )}

      {wizardResult && (
        <div className="yaswarm-card border-yaswarm-success/40 bg-yaswarm-success/5">
          <p className="text-xs text-yaswarm-success font-medium">
            Department created: <span className="font-mono">{wizardResult.departmentId}</span>
          </p>
          <p className="text-xs text-yaswarm-muted mt-1">
            Auto-synced agents: {wizardResult?.sync?.totalAgents ?? "-"} | token saved: {wizardResult?.tokenSaved ? "yes" : "no"}
          </p>
          {(wizardResult?.recommendations?.skills?.length || wizardResult?.recommendations?.mcps?.length) && (
            <div className="mt-2 text-xs text-yaswarm-muted space-y-1">
              <p>
                Skills: {(wizardResult?.recommendations?.skills || []).slice(0, 6).join(", ") || "-"}
              </p>
              <p>
                MCPs: {(wizardResult?.recommendations?.mcps || []).join(", ") || "-"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sync result banner */}
      {syncResult && (
        <div className="yaswarm-card border-yaswarm-success/40 bg-yaswarm-success/5">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-yaswarm-success shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-yaswarm-success mb-1">Agents synced successfully</p>
              <div className="space-y-0.5 text-yaswarm-muted">
                {syncResult.synced?.map((r: any) => (
                  <p key={r.department}>
                    <span className="font-mono">{r.department}</span>:{" "}
                    <span className={r.status === "created" ? "text-yaswarm-success" : r.status === "error" ? "text-yaswarm-error" : "text-yaswarm-muted"}>
                      {r.status}
                    </span>
                    {r.error && <span className="text-yaswarm-error"> - {r.error}</span>}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync error */}
      {syncMutation.isError && (
        <div className="yaswarm-card border-yaswarm-error/40 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yaswarm-error shrink-0" />
          <div>
            <p className="text-sm font-medium text-yaswarm-error">Sync failed</p>
            <p className="text-xs text-yaswarm-muted mt-0.5">{syncMutation.error?.message}</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="yaswarm-card border-yaswarm-error/40 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yaswarm-error shrink-0" />
          <div>
            <p className="text-sm font-medium text-yaswarm-error">
              Failed to load bot data
            </p>
            <p className="text-xs text-yaswarm-muted mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <div className="yaswarm-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-yaswarm-muted">Total Bots</p>
                <Bot className="w-4 h-4 text-yaswarm-accent" />
              </div>
              <p className="text-2xl font-bold text-yaswarm-text">
                {totalBots}
              </p>
            </div>
            <div className="yaswarm-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-yaswarm-muted">Online</p>
                <Circle className="w-4 h-4 fill-yaswarm-success text-yaswarm-success" />
              </div>
              <p className="text-2xl font-bold text-yaswarm-success">
                {totalBots}
              </p>
            </div>
            <div className="yaswarm-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-yaswarm-muted">Sub-Agents</p>
                <Users className="w-4 h-4 text-yaswarm-info" />
              </div>
              <p className="text-2xl font-bold text-yaswarm-text">
                {totalSubAgents}
              </p>
            </div>
            <div className="yaswarm-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-yaswarm-muted">Model Categories</p>
                <Layers className="w-4 h-4 text-yaswarm-warning" />
              </div>
              <p className="text-2xl font-bold text-yaswarm-text">
                {modelCategories.size}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Loading state for cards */}
      {isLoading && (
        <div className="space-y-6">
          <CardSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* CEO Card */}
      {config?.ceo && (
        <div className="yaswarm-card border-yaswarm-accent/40 bg-gradient-to-br from-yaswarm-card to-yaswarm-accent/[0.04]">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-yaswarm-accent/15 border-2 border-yaswarm-accent/40 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-yaswarm-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-yaswarm-text">
                  {config.ceo.bot_name}
                </p>
                <Circle className="w-2.5 h-2.5 fill-yaswarm-success text-yaswarm-success shrink-0" />
                <span className="yaswarm-badge-accent">CEO</span>
              </div>
              <p className="text-xs text-yaswarm-muted font-mono mt-0.5">
                @{config.ceo.bot_id}
              </p>
              <p className="text-xs text-yaswarm-muted mt-1">
                {config.ceo.role}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-[10px] text-yaswarm-muted bg-yaswarm-surface px-2 py-0.5 rounded">
                  <Server className="w-3 h-3" />
                  {config.ceo.backend}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-yaswarm-muted bg-yaswarm-surface px-2 py-0.5 rounded">
                  <Cpu className="w-3 h-3" />
                  {config.ceo.model_tier}
                </span>
              </div>

              {config.ceo.departments?.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] text-yaswarm-muted uppercase tracking-wider mb-1.5">
                    Manages
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {config.ceo.departments.map((d: string) => (
                      <span
                        key={d}
                        className={deptColor[d] || "yaswarm-badge-info"}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                {editingDepartment === "ceo" ? (
                  <>
                    <button
                      onClick={() => updateCeoMutation.mutate()}
                      className="yaswarm-btn-primary text-xs px-2.5 py-1.5 flex items-center gap-1.5"
                      disabled={updateCeoMutation.isPending}
                    >
                      {updateCeoMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={() => setEditingDepartment(null)}
                      className="yaswarm-btn-ghost text-xs px-2.5 py-1.5 border border-yaswarm-border flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => beginEditCeo(config.ceo)}
                    className="yaswarm-btn-ghost text-xs px-2.5 py-1.5 border border-yaswarm-border flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Main Agent Settings
                  </button>
                )}
              </div>

              {editingDepartment === "ceo" && (
                <div className="mt-3 border border-yaswarm-border/50 rounded-md p-2.5 bg-yaswarm-surface/40 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      className="yaswarm-input text-xs"
                      placeholder="Role"
                      value={editForm.role}
                      onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                    />
                    <input
                      className="yaswarm-input text-xs"
                      placeholder="Bot Name"
                      value={editForm.botName}
                      onChange={(e) => setEditForm((p) => ({ ...p, botName: e.target.value }))}
                    />
                    <input
                      className="yaswarm-input text-xs"
                      placeholder="Bot ID"
                      value={editForm.botId}
                      onChange={(e) => setEditForm((p) => ({ ...p, botId: e.target.value }))}
                    />
                    <input
                      className="yaswarm-input text-xs"
                      placeholder="Telegram Bot Token ENV key"
                      value={editForm.tokenEnv}
                      onChange={(e) => setEditForm((p) => ({ ...p, tokenEnv: e.target.value }))}
                    />
                    <input
                      className="yaswarm-input text-xs"
                      placeholder="Telegram Bot API Token (optional)"
                      type="password"
                      value={editForm.token}
                      onChange={(e) => setEditForm((p) => ({ ...p, token: e.target.value }))}
                    />
                    <input
                      className="yaswarm-input text-xs"
                      placeholder="Topic Name"
                      value={editForm.topicName}
                      onChange={(e) => setEditForm((p) => ({ ...p, topicName: e.target.value }))}
                    />
                    <select
                      className="yaswarm-input text-xs"
                      value={editForm.backend}
                      onChange={(e) => setEditForm((p) => ({ ...p, backend: e.target.value }))}
                    >
                      {backendOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                          {opt.installed === false ? " (not installed)" : ""}
                        </option>
                      ))}
                    </select>
                    <select
                      className="yaswarm-input text-xs"
                      value={editForm.modelTier}
                      onChange={(e) => setEditForm((p) => ({ ...p, modelTier: e.target.value }))}
                    >
                      <option value="small">small</option>
                      <option value="medium">medium</option>
                      <option value="high">high</option>
                    </select>
                    <input
                      className="yaswarm-input text-xs"
                      placeholder="Model override (optional)"
                      value={editForm.model}
                      onChange={(e) => setEditForm((p) => ({ ...p, model: e.target.value }))}
                    />
                    {editForm.backend === "custom" && (
                      <input
                        className="yaswarm-input text-xs"
                        placeholder="Custom backend URL"
                        value={editForm.backendUrl}
                        onChange={(e) => setEditForm((p) => ({ ...p, backendUrl: e.target.value }))}
                      />
                    )}
                  </div>

                  {editCapabilitiesQ.data?.models?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-yaswarm-muted">Model Picker</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          className="yaswarm-input text-xs md:col-span-2"
                          placeholder="Search models (name/provider)"
                          value={editModelSearch}
                          onChange={(e) => setEditModelSearch(e.target.value)}
                        />
                        <label className="inline-flex items-center gap-2 text-xs text-yaswarm-muted md:col-span-2">
                          <input
                            type="checkbox"
                            checked={editFreeOnly}
                            onChange={(e) => setEditFreeOnly(e.target.checked)}
                          />
                          Free models only
                        </label>
                        <select
                          className="yaswarm-input text-xs"
                          value={editForm.model}
                          onChange={(e) => setEditForm((p) => ({ ...p, model: e.target.value }))}
                        >
                          <option value="">Select primary model</option>
                          {editFilteredModels.map((m: string) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          multiple
                          className="yaswarm-input text-xs h-28 md:col-span-2"
                          value={editForm.fallbackModels}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                            setEditForm((p) => ({ ...p, fallbackModels: selected }));
                          }}
                        >
                          {editFilteredModels
                            .filter((m: string) => m !== editForm.model)
                            .map((m: string) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  )}
                  {updateCeoMutation.isError && (
                    <p className="text-xs text-yaswarm-error">
                      {updateCeoMutation.error?.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Department Cards Grid */}
      {departments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map(([key, dept]: [string, any]) => {
            const deptSubAgents =
              subAgentsData?.departments?.[key]?.sub_agents || {};
            const subAgentEntries = Object.entries(deptSubAgents);
            const isExpanded = expanded[key] ?? false;

            return (
              <div
                key={key}
                className="yaswarm-card hover:border-yaswarm-accent/30 transition-colors"
              >
                {/* Bot header */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-yaswarm-surface border border-yaswarm-border flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-yaswarm-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-yaswarm-text truncate">
                        {dept.bot_name}
                      </p>
                      <Circle className="w-2 h-2 fill-yaswarm-success text-yaswarm-success shrink-0" />
                    </div>
                    <p className="text-xs text-yaswarm-muted font-mono truncate">
                      @{dept.bot_id}
                    </p>
                  </div>
                </div>

                {/* Role & department */}
                <div className="mt-2">
                  <p className="text-xs text-yaswarm-muted">{dept.role}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className={deptColor[key] || "yaswarm-badge-info"}>
                      {dept.department || key}
                    </span>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px] text-yaswarm-muted">
                  <span className="inline-flex items-center gap-1 bg-yaswarm-surface px-2 py-0.5 rounded">
                    <Server className="w-3 h-3" />
                    {dept.backend}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-yaswarm-surface px-2 py-0.5 rounded">
                    <Cpu className="w-3 h-3" />
                    {dept.model_tier}
                  </span>
                  {dept.skills && (
                    <span className="inline-flex items-center gap-1 bg-yaswarm-surface px-2 py-0.5 rounded">
                      {dept.skills.length} skills
                    </span>
                  )}
                  {subAgentEntries.length > 0 && (
                    <span className="inline-flex items-center gap-1 bg-yaswarm-surface px-2 py-0.5 rounded">
                      <Users className="w-3 h-3" />
                      {subAgentEntries.length} sub-agents
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {editingDepartment === key ? (
                    <>
                      <button
                        onClick={() => updateDepartmentMutation.mutate()}
                        className="yaswarm-btn-primary text-xs px-2.5 py-1.5 flex items-center gap-1.5"
                        disabled={updateDepartmentMutation.isPending}
                      >
                        {updateDepartmentMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => setEditingDepartment(null)}
                        className="yaswarm-btn-ghost text-xs px-2.5 py-1.5 border border-yaswarm-border flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => beginEditDepartment(key, dept)}
                      className="yaswarm-btn-ghost text-xs px-2.5 py-1.5 border border-yaswarm-border flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Head Settings
                    </button>
                  )}
                </div>

                {editingDepartment === key && (
                  <div className="mt-3 border border-yaswarm-border/50 rounded-md p-2.5 bg-yaswarm-surface/40 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        className="yaswarm-input text-xs"
                        placeholder="Department Name"
                        value={editForm.departmentName}
                        onChange={(e) => setEditForm((p) => ({ ...p, departmentName: e.target.value }))}
                      />
                      <input
                        className="yaswarm-input text-xs"
                        placeholder="Role"
                        value={editForm.role}
                        onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                      />
                      <input
                        className="yaswarm-input text-xs"
                        placeholder="Bot Name"
                        value={editForm.botName}
                        onChange={(e) => setEditForm((p) => ({ ...p, botName: e.target.value }))}
                      />
                      <input
                        className="yaswarm-input text-xs"
                        placeholder="Bot ID"
                        value={editForm.botId}
                        onChange={(e) => setEditForm((p) => ({ ...p, botId: e.target.value }))}
                      />
                      <input
                        className="yaswarm-input text-xs"
                        placeholder="Telegram Bot Token ENV key"
                        value={editForm.tokenEnv}
                        onChange={(e) => setEditForm((p) => ({ ...p, tokenEnv: e.target.value }))}
                      />
                      <input
                        className="yaswarm-input text-xs"
                        placeholder="Telegram Bot API Token (optional)"
                        type="password"
                        value={editForm.token}
                        onChange={(e) => setEditForm((p) => ({ ...p, token: e.target.value }))}
                      />
                      <select
                        className="yaswarm-input text-xs"
                        value={editForm.backend}
                        onChange={(e) => setEditForm((p) => ({ ...p, backend: e.target.value }))}
                      >
                        {backendOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                            {opt.installed === false ? " (not installed)" : ""}
                          </option>
                        ))}
                      </select>
                      <select
                        className="yaswarm-input text-xs"
                        value={editForm.modelTier}
                        onChange={(e) => setEditForm((p) => ({ ...p, modelTier: e.target.value }))}
                      >
                        <option value="small">small</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                      </select>
                      <input
                        className="yaswarm-input text-xs"
                        placeholder="Model override (optional)"
                        value={editForm.model}
                        onChange={(e) => setEditForm((p) => ({ ...p, model: e.target.value }))}
                      />
                      {editCapabilitiesQ.data?.models?.length > 0 && (
                        <>
                          <input
                            className="yaswarm-input text-xs md:col-span-2"
                            placeholder="Search models (name/provider)"
                            value={editModelSearch}
                            onChange={(e) => setEditModelSearch(e.target.value)}
                          />
                          <label className="inline-flex items-center gap-2 text-xs text-yaswarm-muted md:col-span-2">
                            <input
                              type="checkbox"
                              checked={editFreeOnly}
                              onChange={(e) => setEditFreeOnly(e.target.checked)}
                            />
                            Free models only
                          </label>
                          <select
                            className="yaswarm-input text-xs"
                            value={editForm.model}
                            onChange={(e) => setEditForm((p) => ({ ...p, model: e.target.value }))}
                          >
                            <option value="">Select primary model</option>
                            {editFilteredModels.map((m: string) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                          <select
                            multiple
                            className="yaswarm-input text-xs h-28 md:col-span-2"
                            value={editForm.fallbackModels}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                              setEditForm((p) => ({ ...p, fallbackModels: selected }));
                            }}
                          >
                            {editFilteredModels
                              .filter((m: string) => m !== editForm.model)
                              .map((m: string) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                          </select>
                        </>
                      )}
                      {editCapabilitiesQ.data?.providers?.length > 0 && (
                        <div className="md:col-span-2 border border-yaswarm-border/60 rounded-md p-2">
                          <p className="text-[11px] text-yaswarm-muted mb-2">Connected providers</p>
                          <div className="flex flex-wrap gap-1.5">
                            {editCapabilitiesQ.data.providers.map((p: any) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    providerIds: toggleStringInList(p.id, prev.providerIds),
                                  }))
                                }
                                className={`text-[10px] px-2 py-1 rounded border ${
                                  editForm.providerIds.includes(p.id)
                                    ? "border-yaswarm-accent/50 bg-yaswarm-accent/15 text-yaswarm-accent"
                                    : "border-yaswarm-border text-yaswarm-muted hover:text-yaswarm-text"
                                }`}
                              >
                                {p.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <input
                        className="yaswarm-input text-xs"
                        placeholder="Topic Name"
                        value={editForm.topicName}
                        onChange={(e) => setEditForm((p) => ({ ...p, topicName: e.target.value }))}
                      />
                      {editForm.backend === "custom" && (
                        <input
                          className="yaswarm-input text-xs md:col-span-2"
                          placeholder="Custom Provider URL"
                          value={editForm.backendUrl}
                          onChange={(e) => setEditForm((p) => ({ ...p, backendUrl: e.target.value }))}
                        />
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-yaswarm-muted">
                      <input
                        type="checkbox"
                        checked={editForm.autoInstallBackend}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, autoInstallBackend: e.target.checked }))
                        }
                      />
                      Auto-install backend CLI if missing
                    </label>
                    {editCapabilitiesQ.data?.guidance && (
                      <p className="text-[11px] text-yaswarm-muted mt-1">{editCapabilitiesQ.data.guidance}</p>
                    )}
                    {updateDepartmentMutation.isError && (
                      <p className="text-xs text-yaswarm-error">
                        {updateDepartmentMutation.error?.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Expandable sub-agents */}
                {subAgentEntries.length > 0 && (
                  <div className="mt-3 border-t border-yaswarm-border/50 pt-2">
                    <button
                      onClick={() => toggleExpand(key)}
                      className="flex items-center gap-1.5 text-xs text-yaswarm-muted hover:text-yaswarm-text transition-colors w-full"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                      Sub-Agents ({subAgentEntries.length})
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-2">
                        {subAgentEntries.map(
                          ([saKey, sa]: [string, any]) => (
                            <div
                              key={saKey}
                              className="bg-yaswarm-surface/60 border border-yaswarm-border/40 rounded-md p-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-yaswarm-text">
                                  {sa.name}
                                </p>
                                <span
                                  className={
                                    categoryColor[sa.category] ||
                                    categoryColor.default
                                  }
                                >
                                  {sa.category}
                                </span>
                              </div>
                              <p className="text-[10px] text-yaswarm-muted font-mono mt-1">
                                {sa.model}
                              </p>
                              {sa.description && (
                                <p className="text-[10px] text-yaswarm-muted mt-1 line-clamp-2">
                                  {sa.description}
                                </p>
                              )}
                              {sa.fallback_chain?.length > 0 && (
                                <div className="mt-1.5">
                                  <p className="text-[9px] text-yaswarm-muted uppercase tracking-wider">
                                    Fallback
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {sa.fallback_chain.map(
                                      (fb: string, i: number) => (
                                        <span
                                          key={i}
                                          className="text-[9px] bg-yaswarm-bg px-1.5 py-0.5 rounded text-yaswarm-muted font-mono"
                                        >
                                          {fb}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && departments.length === 0 && (
        <div className="yaswarm-card flex flex-col items-center justify-center py-12">
          <Bot className="w-10 h-10 text-yaswarm-muted mb-3" />
          <p className="text-sm text-yaswarm-muted">
            No department bots configured
          </p>
        </div>
      )}
    </div>
  );
}
