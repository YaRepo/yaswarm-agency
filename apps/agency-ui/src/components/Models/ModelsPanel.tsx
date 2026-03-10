import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Cpu,
  Loader2,
  Inbox,
  ChevronDown,
  ChevronUp,
  Layers,
  Server,
  GitBranch,
  Zap,
  Globe,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Link2,
} from "lucide-react";
import api from "@/api/bridge-api";

// ─── Types ───────────────────────────────────────────────────

interface Assignment {
  department: string;
  modelTier: string;
  backend: string;
  model?: string;
  fallbackChain?: string[];
}

interface BackendInfo {
  models: string[];
  departments: string[];
}

// ─── Colors ──────────────────────────────────────────────────

function deptColor(department: string): string {
  const palette = [
    "text-yaswarm-accent",
    "text-blue-400",
    "text-cyan-400",
    "text-green-400",
    "text-amber-400",
    "text-pink-400",
    "text-orange-400",
  ];
  const d = String(department || "");
  if (!d) return "text-yaswarm-text";
  let h = 0;
  for (let i = 0; i < d.length; i++) h = (h * 37 + d.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

const TIER_BADGES: Record<string, string> = {
  high: "bg-yaswarm-accent/15 text-yaswarm-accent border-yaswarm-accent/25",
  medium: "bg-blue-400/15 text-blue-400 border-blue-400/25",
  low: "bg-green-400/15 text-green-400 border-green-400/25",
  budget: "bg-yaswarm-muted/15 text-yaswarm-muted border-yaswarm-border",
};

// ─── Component ───────────────────────────────────────────────

export default function ModelsPanel() {
  const queryClient = useQueryClient();
  const [expandedSection, setExpandedSection] = useState<string | null>("assignments");
  const [expandedBackend, setExpandedBackend] = useState<string | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    modelTier: "medium",
    backend: "glm",
    model: "",
    fallbackChainInput: "",
  });
  const [providerId, setProviderId] = useState("glm");
  const [modelId, setModelId] = useState("");
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [missingApiKey, setMissingApiKey] = useState("");
  const [missingProviderUrl, setMissingProviderUrl] = useState("");
  const [missingProviderMeta, setMissingProviderMeta] = useState<any | null>(null);

  // Fetch unified model overview
  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      const res = await api.models.overview();
      if (!res.ok) throw new Error(res.error || "Failed to fetch models");
      return res.data as any;
    },
  });

  // Fetch assignments
  const assignmentsQuery = useQuery({
    queryKey: ["models", "assignments"],
    queryFn: async () => {
      const res = await api.models.assignments();
      if (!res.ok) throw new Error(res.error || "Failed to fetch assignments");
      return (res.data as any)?.assignments as Assignment[] ?? [];
    },
  });

  // Fetch backends
  const backendsQuery = useQuery({
    queryKey: ["models", "backends"],
    queryFn: async () => {
      const res = await api.models.backends();
      if (!res.ok) throw new Error(res.error || "Failed to fetch backends");
      return (res.data as any)?.backends as Record<string, BackendInfo> ?? {};
    },
  });

  // Fetch model catalog
  const catalogModelsQuery = useQuery({
    queryKey: ["models", "catalog"],
    queryFn: async () => {
      const res = await api.models.catalog();
      if (!res.ok) throw new Error(res.error || "Failed to fetch MCP models");
      return res.data as any;
    },
  });

  const debugProvidersQuery = useQuery({
    queryKey: ["models", "debug-providers"],
    queryFn: async () => {
      const res = await api.models.debugProviders();
      if (!res.ok) throw new Error(res.error || "Failed to load debug providers");
      return res.data as any;
    },
  });

  const backendToolsQuery = useQuery({
    queryKey: ["bots", "backend-tools"],
    queryFn: async () => {
      const res = await api.bots.backendTools();
      if (!res.ok) throw new Error(res.error || "Failed to load backend tools");
      return res.data as any;
    },
  });

  const saveAssignmentMutation = useMutation({
    mutationFn: async (payload: {
      department: string;
      modelTier: string;
      backend: string;
      model: string;
      fallbackChainInput: string;
    }) => {
      const fallbackModels = payload.fallbackChainInput
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const body = {
        modelTier: payload.modelTier.trim(),
        backend: payload.backend.trim(),
        model: payload.model.trim(),
        fallbackModels,
      };
      const response =
        payload.department === "ceo"
          ? await api.bots.updateCeo(body)
          : await api.bots.updateDepartment(payload.department, body);
      if (!response.ok) {
        throw new Error(response.error || "Failed to save assignment");
      }
      return response.data as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      queryClient.invalidateQueries({ queryKey: ["models", "assignments"] });
      queryClient.invalidateQueries({ queryKey: ["models", "backends"] });
      setEditingDepartment(null);
    },
  });

  const debugTestMutation = useMutation({
    mutationFn: async (payload: {
      provider: string;
      model?: string;
      apiKey?: string;
      providerUrl?: string;
      saveToEnv?: boolean;
    }) => {
      const res = await api.models.debugTest(payload);
      if (!res.ok) throw new Error(res.error || "Failed to test model");
      return res.data as any;
    },
    onSuccess: (data) => {
      if (data?.status === "missing_credentials") {
        setMissingProviderMeta(data?.provider || null);
        setMissingProviderUrl(String(data?.providerUrl || data?.provider?.defaultUrl || ""));
        setMissingApiKey("");
        setShowMissingModal(true);
      } else {
        setShowMissingModal(false);
      }
      queryClient.invalidateQueries({ queryKey: ["env", "entries"] });
    },
  });

  const overview = modelsQuery.data;
  const assignments = assignmentsQuery.data ?? [];
  const backends = backendsQuery.data ?? {};
  const catalogModels = catalogModelsQuery.data;
  const debugProviders = (debugProvidersQuery.data?.providers || []) as Array<any>;
  const backendOptions = Array.from(
    new Set([
      ...(backendToolsQuery.data?.backendOptions || []).map((opt: any) =>
        String(opt?.value || "").trim()
      ),
      ...Object.keys(backends || {}),
    ])
  ).filter(Boolean);
  const selectedProvider =
    debugProviders.find((p) => String(p.id) === providerId) || debugProviders[0] || null;

  const isLoading =
    modelsQuery.isLoading &&
    assignmentsQuery.isLoading &&
    backendsQuery.isLoading;

  // Extract stats
  const catalogModelList = overview?.gateway?.models
    ? Object.entries(overview?.gateway?.models)
    : [];
  const primaryModel = overview?.gateway?.primaryModel || "Unknown";

  // Sub-agent categories
  const categories = overview?.subAgentModels?.categories
    ? Object.entries(overview.subAgentModels.categories)
    : [];

  const toggleSection = (s: string) =>
    setExpandedSection(expandedSection === s ? null : s);

  const beginEdit = (assignment: Assignment) => {
    setEditingDepartment(assignment.department);
    setEditForm({
      modelTier: assignment.modelTier || "medium",
      backend: assignment.backend || backendOptions[0] || "glm",
      model: assignment.model || "",
      fallbackChainInput: (assignment.fallbackChain || []).join(", "),
    });
  };

  const cancelEdit = () => {
    setEditingDepartment(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-yaswarm-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-yaswarm-text">
              Models & LLM Management
            </h2>
            <p className="text-xs text-yaswarm-muted">
              Model assignments, backends, and configuration across all departments
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            modelsQuery.refetch();
            assignmentsQuery.refetch();
            backendsQuery.refetch();
            catalogModelsQuery.refetch();
            debugProvidersQuery.refetch();
            backendToolsQuery.refetch();
          }}
          className="yaswarm-btn-ghost text-xs px-3 py-1.5 border border-yaswarm-border flex items-center gap-1.5"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      <section className="yaswarm-card space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yaswarm-warning" />
          <h3 className="text-sm font-semibold text-yaswarm-text">Live Debug Assistant</h3>
        </div>
        <p className="text-xs text-yaswarm-muted">
          Test provider/model connectivity for UI and runtime debugging. Missing URL/API key can be saved automatically to API Keys env.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] text-yaswarm-muted block mb-1">LLM Provider</label>
            <select
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                const p = debugProviders.find((x) => String(x.id) === e.target.value);
                setModelId(String(p?.models?.[0] || ""));
              }}
              className="yaswarm-input w-full text-xs"
            >
              {debugProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-yaswarm-muted block mb-1">Model</label>
            <select
              value={modelId || String(selectedProvider?.models?.[0] || "")}
              onChange={(e) => setModelId(e.target.value)}
              className="yaswarm-input w-full text-xs"
            >
              {(selectedProvider?.models || []).map((m: string) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() =>
                debugTestMutation.mutate({
                  provider: providerId,
                  model: modelId || selectedProvider?.models?.[0],
                })
              }
              disabled={debugTestMutation.isPending || !providerId}
              className="yaswarm-btn-primary text-xs px-3 py-2 w-full disabled:opacity-50"
            >
              {debugTestMutation.isPending ? "Testing..." : "Test Model Connection"}
            </button>
          </div>
        </div>
        {debugTestMutation.data && debugTestMutation.data.status !== "missing_credentials" && (
          <div
            className={`rounded border p-2 text-xs ${
              debugTestMutation.data.ok
                ? "border-yaswarm-success/30 text-yaswarm-success bg-yaswarm-success/10"
                : "border-yaswarm-error/30 text-yaswarm-error bg-yaswarm-error/10"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {debugTestMutation.data.ok ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              <span>{String(debugTestMutation.data.detail || debugTestMutation.data.status)}</span>
            </div>
          </div>
        )}
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Primary Model</p>
          <p className="text-sm font-semibold text-yaswarm-accent mt-1 truncate">{primaryModel}</p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">MCP Models</p>
          <p className="text-2xl font-bold text-yaswarm-text mt-1">{catalogModelList.length}</p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Departments</p>
          <p className="text-2xl font-bold text-yaswarm-text mt-1">{assignments.length}</p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Backends</p>
          <p className="text-2xl font-bold text-yaswarm-text mt-1">{Object.keys(backends).length}</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-yaswarm-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-40" />
          <p className="text-xs">Loading model configuration...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* ─── Department Assignments ────────────────────────── */}
          <section>
            <button
              onClick={() => toggleSection("assignments")}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h3 className="text-sm font-semibold text-yaswarm-text flex items-center gap-2">
                <Layers className="w-4 h-4 text-yaswarm-accent" />
                Department Model Assignments
              </h3>
              {expandedSection === "assignments" ? (
                <ChevronUp className="w-4 h-4 text-yaswarm-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-yaswarm-muted" />
              )}
            </button>

            {expandedSection === "assignments" && (
              <div className="space-y-2">
                {assignments.length === 0 ? (
                  <div className="yaswarm-card text-center text-yaswarm-muted text-xs py-6">
                    <Inbox className="w-6 h-6 mx-auto mb-2 opacity-20" />
                    No department assignments found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-yaswarm-border text-yaswarm-muted text-xs">
                          <th className="text-left py-2 px-3 font-medium">Department</th>
                          <th className="text-left py-2 px-3 font-medium">Tier</th>
                          <th className="text-left py-2 px-3 font-medium">Backend</th>
                          <th className="text-left py-2 px-3 font-medium">Model</th>
                          <th className="text-left py-2 px-3 font-medium">Fallback Chain</th>
                          <th className="text-left py-2 px-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map((a) => {
                          const isEditing = editingDepartment === a.department;
                          return (
                            <tr key={a.department} className="border-b border-yaswarm-border/50 hover:bg-yaswarm-hover/50">
                              <td className={`py-2.5 px-3 font-medium ${deptColor(a.department)}`}>
                                {a.department}
                              </td>
                              <td className="py-2.5 px-3">
                                {isEditing ? (
                                  <select
                                    value={editForm.modelTier}
                                    onChange={(e) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        modelTier: e.target.value,
                                      }))
                                    }
                                    className="yaswarm-input text-xs w-32"
                                  >
                                    {["high", "medium", "low", "budget"].map((tier) => (
                                      <option key={tier} value={tier}>
                                        {tier}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className={`yaswarm-badge ${TIER_BADGES[a.modelTier] || TIER_BADGES.budget}`}>
                                    {a.modelTier}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-yaswarm-muted font-mono text-xs">
                                {isEditing ? (
                                  <select
                                    value={editForm.backend}
                                    onChange={(e) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        backend: e.target.value,
                                      }))
                                    }
                                    className="yaswarm-input text-xs min-w-[170px]"
                                  >
                                    {backendOptions.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  a.backend
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-yaswarm-text text-xs">
                                {isEditing ? (
                                  <input
                                    value={editForm.model}
                                    onChange={(e) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        model: e.target.value,
                                      }))
                                    }
                                    className="yaswarm-input text-xs min-w-[220px]"
                                    placeholder="model id (optional)"
                                  />
                                ) : (
                                  a.model || "-"
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-yaswarm-muted text-xs">
                                {isEditing ? (
                                  <input
                                    value={editForm.fallbackChainInput}
                                    onChange={(e) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        fallbackChainInput: e.target.value,
                                      }))
                                    }
                                    className="yaswarm-input text-xs min-w-[280px]"
                                    placeholder="comma-separated fallback models"
                                  />
                                ) : (
                                  a.fallbackChain?.join(" → ") || "-"
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        saveAssignmentMutation.mutate({
                                          department: a.department,
                                          modelTier: editForm.modelTier,
                                          backend: editForm.backend,
                                          model: editForm.model,
                                          fallbackChainInput: editForm.fallbackChainInput,
                                        })
                                      }
                                      disabled={saveAssignmentMutation.isPending}
                                      className="yaswarm-btn-primary text-xs px-2.5 py-1 disabled:opacity-50"
                                    >
                                      {saveAssignmentMutation.isPending ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      disabled={saveAssignmentMutation.isPending}
                                      className="yaswarm-btn-ghost text-xs px-2.5 py-1 border border-yaswarm-border disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => beginEdit(a)}
                                    className="yaswarm-btn-ghost text-xs px-2.5 py-1 border border-yaswarm-border"
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {saveAssignmentMutation.isError && (
                      <p className="text-xs text-yaswarm-error mt-2">
                        {String(saveAssignmentMutation.error instanceof Error
                          ? saveAssignmentMutation.error.message
                          : "Failed to save assignment")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ─── MCP Models ────────────────────────────────── */}
          <section>
            <button
              onClick={() => toggleSection("catalog")}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h3 className="text-sm font-semibold text-yaswarm-text flex items-center gap-2">
                <Zap className="w-4 h-4 text-yaswarm-accent" />
                MCP Registered Models
              </h3>
              {expandedSection === "catalog" ? (
                <ChevronUp className="w-4 h-4 text-yaswarm-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-yaswarm-muted" />
              )}
            </button>

            {expandedSection === "catalog" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catalogModelList.length === 0 ? (
                  <div className="yaswarm-card col-span-full text-center text-yaswarm-muted text-xs py-6">
                    <Inbox className="w-6 h-6 mx-auto mb-2 opacity-20" />
                    No MCP models configured
                  </div>
                ) : (
                  catalogModelList.map(([modelId, config]) => {
                    const alias = (config as any)?.alias || modelId;
                    const isPrimary = alias === primaryModel;
                    return (
                      <div
                        key={modelId}
                        className={`yaswarm-card ${
                          isPrimary ? "border-yaswarm-accent/30" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-3.5 h-3.5 text-yaswarm-muted" />
                            <span className="text-sm font-medium text-yaswarm-text">{alias}</span>
                          </div>
                          {isPrimary && (
                            <span className="yaswarm-badge bg-yaswarm-accent/15 text-yaswarm-accent border-yaswarm-accent/25">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-yaswarm-muted font-mono mt-1.5 truncate">
                          {modelId}
                        </p>
                      </div>
                    );
                  })
                )}

                {/* Live models from gateway */}
                {catalogModels?.models && Array.isArray(catalogModels.models) && (
                  <>
                    <div className="col-span-full mt-2">
                      <h4 className="text-xs font-semibold text-yaswarm-muted flex items-center gap-1.5 mb-2">
                        <Globe className="w-3 h-3" />
                        Live from Gateway
                         {catalogModels.note && (
                          <span className="font-normal opacity-60 ml-1">
                            ({String(catalogModels.note)})
                          </span>
                        )}
                      </h4>
                    </div>
                    {catalogModels.models.map((m: any) => (
                      <div key={m.id || m.alias} className="yaswarm-card">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-yaswarm-muted" />
                          <span className="text-sm text-yaswarm-text">{String(m.alias || m.id)}</span>
                        </div>
                        <p className="text-[10px] text-yaswarm-muted font-mono mt-1 truncate">
                          {String(m.id)} {m.source ? `(${String(m.source)})` : ""}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </section>

          {/* ─── Backends ──────────────────────────────────────── */}
          <section>
            <button
              onClick={() => toggleSection("backends")}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h3 className="text-sm font-semibold text-yaswarm-text flex items-center gap-2">
                <Server className="w-4 h-4 text-yaswarm-accent" />
                Backends
              </h3>
              {expandedSection === "backends" ? (
                <ChevronUp className="w-4 h-4 text-yaswarm-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-yaswarm-muted" />
              )}
            </button>

            {expandedSection === "backends" && (
              <div className="space-y-2">
                {Object.keys(backends).length === 0 ? (
                  <div className="yaswarm-card text-center text-yaswarm-muted text-xs py-6">
                    <Inbox className="w-6 h-6 mx-auto mb-2 opacity-20" />
                    No backends configured
                  </div>
                ) : (
                  Object.entries(backends).map(([name, info]) => {
                    const isExpanded = expandedBackend === name;
                    return (
                      <div
                        key={name}
                        className="yaswarm-card hover:border-yaswarm-accent/20 transition-colors cursor-pointer"
                        onClick={() => setExpandedBackend(isExpanded ? null : name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-yaswarm-muted" />
                            <span className="text-sm font-medium text-yaswarm-text">{name}</span>
                            <span className="text-[10px] text-yaswarm-muted">
                              {info.models.length} models · {info.departments.length} depts
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                              {info.departments.slice(0, 4).map((d) => (
                                <span
                                  key={d}
                                  className={`text-[9px] px-1.5 py-0.5 rounded border bg-yaswarm-surface ${
                                    deptColor(d)
                                  } border-yaswarm-border`}
                                >
                                  {d}
                                </span>
                              ))}
                              {info.departments.length > 4 && (
                                <span className="text-[9px] px-1 text-yaswarm-muted">
                                  +{info.departments.length - 4}
                                </span>
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-yaswarm-muted" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-yaswarm-muted" />
                            )}
                          </div>
                        </div>

                        {isExpanded && info.models.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-yaswarm-border/50 space-y-1">
                            {info.models.map((m) => (
                              <div key={m} className="flex items-center gap-2 text-xs text-yaswarm-muted">
                                <Cpu className="w-3 h-3" />
                                <span className="font-mono">{m}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>

          {/* ─── Sub-Agent Categories ──────────────────────────── */}
          {categories.length > 0 && (
            <section>
              <button
                onClick={() => toggleSection("categories")}
                className="w-full flex items-center justify-between mb-3 group"
              >
                <h3 className="text-sm font-semibold text-yaswarm-text flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-yaswarm-accent" />
                  Sub-Agent Model Categories
                </h3>
                {expandedSection === "categories" ? (
                  <ChevronUp className="w-4 h-4 text-yaswarm-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-yaswarm-muted" />
                )}
              </button>

              {expandedSection === "categories" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map(([catName, catConfig]) => {
                    const conf = catConfig as any;
                    return (
                      <div key={catName} className="yaswarm-card">
                        <div className="flex items-center gap-2 mb-2">
                          <GitBranch className="w-3.5 h-3.5 text-yaswarm-muted" />
                          <span className="text-sm font-medium text-yaswarm-text capitalize">
                            {catName.replace(/_/g, " ")}
                          </span>
                        </div>
                        {conf.model && (
                          <div className="text-xs text-yaswarm-muted mb-1">
                            <span className="text-yaswarm-muted/60">Model:</span>{" "}
                            <span className="text-yaswarm-text font-mono">{conf.model}</span>
                          </div>
                        )}
                        {conf.description && (
                          <p className="text-[10px] text-yaswarm-muted/70 mt-1">{conf.description}</p>
                        )}
                        {conf.fallback_chain && (
                          <div className="text-[10px] text-yaswarm-muted mt-1">
                            Fallback: {conf.fallback_chain.join(" → ")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}
      {showMissingModal && missingProviderMeta && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg yaswarm-card space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yaswarm-warning" />
              <h4 className="text-sm font-semibold text-yaswarm-text">Missing Provider Credentials</h4>
            </div>
            <p className="text-xs text-yaswarm-muted">
              Add the missing values for {String(missingProviderMeta.label)} and save them to env (visible in API Keys tab).
            </p>
            <div>
              <label className="text-[11px] text-yaswarm-muted block mb-1 flex items-center gap-1">
                <KeyRound className="w-3 h-3" />
                {String(missingProviderMeta.apiKeyEnv)}
              </label>
              <input
                type="password"
                value={missingApiKey}
                onChange={(e) => setMissingApiKey(e.target.value)}
                placeholder="Paste API key"
                className="yaswarm-input w-full text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-yaswarm-muted block mb-1 flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                {String(missingProviderMeta.urlEnv)}
              </label>
              <input
                value={missingProviderUrl}
                onChange={(e) => setMissingProviderUrl(e.target.value)}
                placeholder="Provider base URL"
                className="yaswarm-input w-full text-xs font-mono"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowMissingModal(false)}
                className="yaswarm-btn-ghost text-xs px-3 py-1.5 border border-yaswarm-border"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  debugTestMutation.mutate({
                    provider: String(missingProviderMeta.id || providerId),
                    model: modelId || selectedProvider?.models?.[0],
                    apiKey: missingApiKey,
                    providerUrl: missingProviderUrl,
                    saveToEnv: true,
                  })
                }
                disabled={debugTestMutation.isPending || !missingApiKey.trim() || !missingProviderUrl.trim()}
                className="yaswarm-btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
              >
                {debugTestMutation.isPending ? "Saving..." : "Save And Re-Test"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
