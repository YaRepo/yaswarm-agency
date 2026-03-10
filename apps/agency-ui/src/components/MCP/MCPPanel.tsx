import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wrench,
  Search as SearchIcon,
  Globe,
  Radio,
  Link,
  MessageSquare,
  Users,
  ShieldCheck,
  Headphones,
  Circle,
  Loader2,
  Inbox,
  ChevronDown,
  ChevronUp,
  Plug,
  Settings,
  Server,
  FileCode,
  AlertTriangle,
  Database,
  Key,
  Save,
} from "lucide-react";
import api from "@/api/bridge-api";

// ─── Types ──────────────────────────────────────────────────

interface ToolCategory {
  key: string;
  label: string;
  icon: typeof Globe;
  enabled: boolean;
  details?: Record<string, any>;
}

interface MCPServerEntry {
  key: string;
  label: string;
  enabled: boolean;
  details: Record<string, any>;
}

interface ChannelConfig {
  key: string;
  enabled: boolean;
  [k: string]: any;
}

interface PluginEntry {
  key: string;
  enabled: boolean;
}

// ─── Helpers ────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const TOOL_ICONS: Record<string, typeof Globe> = {
  web: Globe,
  media: Headphones,
  links: Link,
  message: MessageSquare,
  agentToAgent: Users,
  elevated: ShieldCheck,
};

const CHANNEL_ICONS: Record<string, typeof Globe> = {
  whatsapp: MessageSquare,
  telegram: Radio,
  discord: Users,
  slack: MessageSquare,
};

function parseToolCategories(tools: Record<string, any> | undefined): ToolCategory[] {
  if (!tools) return [];
  const categories: ToolCategory[] = [];

  for (const [key, value] of Object.entries(tools)) {
    if (typeof value === "object" && value !== null) {
      // Check if it has sub-tools (like web.search, web.fetch)
      const subEntries = Object.entries(value);
      const hasEnabledProp = "enabled" in value;

      if (hasEnabledProp) {
        // Simple tool with enabled flag
        categories.push({
          key,
          label: capitalize(key),
          icon: TOOL_ICONS[key] ?? Wrench,
          enabled: value.enabled,
          details: value,
        });
      } else {
        // Compound tool — check if any sub-tool is enabled
        const anyEnabled = subEntries.some(
          ([, v]) => typeof v === "object" && v !== null && (v as Record<string, any>).enabled
        );
        const subDetails: Record<string, any> = {};
        for (const [subKey, subVal] of subEntries) {
          subDetails[subKey] =
            typeof subVal === "object" && subVal !== null ? subVal : { value: subVal };
        }
        categories.push({
          key,
          label: capitalize(key),
          icon: TOOL_ICONS[key] ?? Wrench,
          enabled: anyEnabled,
          details: subDetails,
        });
      }
    }
  }

  return categories;
}

function parseServerEntries(servers: Record<string, any> | undefined): MCPServerEntry[] {
  if (!servers) return [];
  return Object.entries(servers).map(([key, val]) => ({
    key,
    label: capitalize(key),
    enabled: typeof val === "object" && val !== null ? (val as Record<string, any>).enabled !== false : true,
    details: typeof val === "object" && val !== null ? (val as Record<string, any>) : { value: val },
  }));
}

function parseChannels(channels: Record<string, any> | undefined): ChannelConfig[] {
  if (!channels) return [];
  return Object.entries(channels).map(([key, val]) => {
    const obj = typeof val === "object" && val !== null ? (val as Record<string, any>) : {};
    return {
      key,
      enabled: !!obj.enabled,
      ...obj,
    };
  });
}

function parsePlugins(plugins: Record<string, any> | undefined): PluginEntry[] {
  if (!plugins) return [];
  const entries = plugins.entries ?? plugins;
  if (!entries || typeof entries !== "object") return [];
  return Object.entries(entries).map(([key, val]) => ({
    key,
    enabled: typeof val === "object" && val !== null ? (val as any).enabled ?? false : !!val,
  }));
}

// ─── Component ──────────────────────────────────────────────

export default function MCPPanel() {
  const queryClient = useQueryClient();
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [envKey, setEnvKey] = useState("");
  const [envValue, setEnvValue] = useState("");
  const [envMessage, setEnvMessage] = useState<string | null>(null);
  const [collabCli, setCollabCli] = useState<any | null>(null);
  const [collabMessage, setCollabMessage] = useState<string | null>(null);
  const [debugProvider, setDebugProvider] = useState("glm");
  const [debugModel, setDebugModel] = useState("");
  const [debugTimeline, setDebugTimeline] = useState<string[]>([]);

  // Fetch servers (config)
  const serversQuery = useQuery({
    queryKey: ["mcp", "servers"],
    queryFn: async () => {
      const res = await api.mcp.servers();
      if (!res.ok) throw new Error(res.error || "Failed to fetch MCP config");
      // Server returns {servers: {...}}, unwrap to get the config object
      const raw = res.data as any;
      return raw ?? {};
    },
  });

  // Fetch tools list
  const toolsQuery = useQuery({
    queryKey: ["mcp", "tools"],
    queryFn: async () => {
      const res = await api.mcp.tools();
      if (!res.ok) throw new Error(res.error || "Failed to fetch MCP tools");
      return res.data as any;
    },
  });

  // Fetch MCP registry
  const registryQuery = useQuery({
    queryKey: ["mcp", "registry"],
    queryFn: async () => {
      const res = await api.mcp.registry();
      if (!res.ok) throw new Error(res.error || "Failed to fetch MCP registry");
      return (res.data as any)?.registry ?? [];
    },
  });

  // Fetch raw config
  const configQuery = useQuery({
    queryKey: ["mcp", "config"],
    queryFn: async () => {
      const res = await api.mcp.config();
      if (!res.ok) throw new Error(res.error || "Failed to fetch config");
      return res.data as any;
    },
    enabled: false, // Only fetch when user clicks "View Config"
  });

  // Fetch masked env keys
  const envQuery = useQuery({
    queryKey: ["mcp", "env"],
    queryFn: async () => {
      const res = await api.mcp.env();
      if (!res.ok) throw new Error(res.error || "Failed to fetch env keys");
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

  const doctorQuery = useQuery({
    queryKey: ["mcp", "doctor"],
    queryFn: async () => {
      const res = await api.mcp.doctor();
      if (!res.ok) throw new Error(res.error || "Failed to run MCP doctor");
      return res.data as any;
    },
    enabled: false,
  });

  const accessAuditQuery = useQuery({
    queryKey: ["mcp", "access-audit"],
    queryFn: async () => {
      const res = await api.mcp.accessAudit();
      if (!res.ok) throw new Error(res.error || "Failed to run MCP access audit");
      return res.data as any;
    },
    enabled: false,
  });

  const toggleServerMutation = useMutation({
    mutationFn: async ({ name, enabled }: { name: string; enabled: boolean }) => {
      const res = await api.mcp.setServerEnabled(name, enabled);
      if (!res.ok) throw new Error(res.error || "Failed to update MCP server");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp", "servers"] });
      queryClient.invalidateQueries({ queryKey: ["mcp", "tools"] });
      queryClient.invalidateQueries({ queryKey: ["mcp", "doctor"] });
      queryClient.invalidateQueries({ queryKey: ["mcp", "access-audit"] });
      queryClient.invalidateQueries({ queryKey: ["mcp", "config"] });
    },
  });

  const syncCliMutation = useMutation({
    mutationFn: async (cliId: string) => {
      const res = await api.mcp.syncCliMcp(cliId);
      if (!res.ok) throw new Error(res.error || "Failed to sync CLI MCP config");
      return res.data as any;
    },
    onSuccess: (data) => {
      setCollabMessage(
        `Sync done for ${data?.cliId}: ${data?.synced}/${data?.total} synced, ${data?.skipped} skipped, ${data?.failed} failed`
      );
      queryClient.invalidateQueries({ queryKey: ["mcp", "access-audit"] });
    },
    onError: (err) => {
      setCollabMessage(err instanceof Error ? err.message : "Failed to sync CLI MCP config");
    },
  });

  const debugFixMutation = useMutation({
    mutationFn: async (payload: { cliId: string; note?: string; provider?: string; model?: string }) => {
      const res = await api.mcp.debugFixCli(payload);
      if (!res.ok) throw new Error(res.error || "Debugger failed");
      return res.data as any;
    },
    onSuccess: (data) => {
      setCollabMessage(String(data?.instruction || "Debugger completed. Please reload and try again."));
      if (Array.isArray(data?.diagnostics) && data.diagnostics.length > 0) {
        setDebugTimeline((prev) => [...prev, ...data.diagnostics.map((d: unknown) => String(d))]);
      }
      queryClient.invalidateQueries({ queryKey: ["mcp", "access-audit"] });
    },
    onError: (err) => {
      setCollabMessage(err instanceof Error ? err.message : "Debugger failed");
    },
  });

  useEffect(() => {
    if (!debugFixMutation.isPending || !collabCli) return;
    const planBase: Record<string, string[]> = {
      opencode: [
        "Reading current CLI path and MCP runtime status",
        "Collecting enabled MCP servers from YaSwarm config",
        "Mapping server transport and environment placeholders",
        "Preparing OpenCode MCP config patch",
        "Applying fix and validating with MCP list check",
      ],
      "pi-mono": [
        "Inspecting pi-mono CLI capabilities and command surface",
        "Checking for MCP registration interface",
        "Running compatibility diagnosis against enabled MCP set",
        "Preparing guidance and safe fallback strategy",
      ],
    };
    const plan = planBase[String(collabCli.id)] || [
      "Collecting CLI diagnostics",
      "Evaluating MCP compatibility",
      "Applying safe remediation steps",
      "Re-validating results",
    ];
    setDebugTimeline([`Debugger started for ${String(collabCli.id)}`, plan[0]]);
    let idx = 1;
    const timer = setInterval(() => {
      if (idx >= plan.length) return;
      setDebugTimeline((prev) => [...prev, plan[idx]]);
      idx += 1;
    }, 1100);
    return () => clearInterval(timer);
  }, [debugFixMutation.isPending, collabCli]);

  const saveEnvMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await api.mcp.upsertEnv(key, value);
      if (!res.ok) throw new Error(res.error || "Failed to save env key");
      return res.data;
    },
    onSuccess: (data) => {
      setEnvValue("");
      setEnvMessage(`Saved ${data?.key} to ${data?.path}`);
      queryClient.invalidateQueries({ queryKey: ["mcp", "env"] });
    },
    onError: (err) => {
      setEnvMessage(err instanceof Error ? err.message : "Failed to save env key");
    },
  });

  const [showConfig, setShowConfig] = useState(false);

  const config = (serversQuery.data ?? {}) as any;
  const registry = registryQuery.data ?? [];
  const rawToolsData = toolsQuery.data as any;
  const envData = envQuery.data as any;
  const debugProviders = (debugProvidersQuery.data?.providers || []) as Array<any>;
  const selectedDebugProvider =
    debugProviders.find((p) => String(p.id) === debugProvider) || debugProviders[0] || null;
  const selectedDebugProviderModels = (selectedDebugProvider?.models || []).map((m: unknown) => String(m));
  const envEntries = (envData?.entries ?? []) as Array<{ key: string; maskedValue: string }>;
  const expectedEnvKeys = (envData?.expectedKeys ?? []) as string[];
  const isSharedApiKeysFile = !!envData?.isSharedApiKeysFile;
  const serverEntries = parseServerEntries(config?.servers);
  const toolCategories = parseToolCategories(config.tools ?? rawToolsData?.tools);
  const combinedTools = serverEntries.length > 0 ? serverEntries.map((s) => ({
    key: s.key,
    label: s.label,
    icon: Server,
    enabled: s.enabled,
    details: s.details,
  })) : toolCategories;
  const channels = parseChannels(config.channels);
  const plugins = parsePlugins(config.plugins);

  // Extract gateway/agent info if present
  const gateway = config.gateway;
  const agent = config.agent;

  const isLoading = serversQuery.isLoading && toolsQuery.isLoading;

  // Stats
  const enabledTools = combinedTools.filter((t) => t.enabled).length;
  const enabledChannels = channels.filter((c) => c.enabled).length;
  const enabledPlugins = plugins.filter((p) => p.enabled).length;

  const handleSaveEnvKey = () => {
    const key = envKey.trim().toUpperCase();
    if (!key) {
      setEnvMessage("Key is required");
      return;
    }
    saveEnvMutation.mutate({ key, value: envValue });
  };

  useEffect(() => {
    if (!selectedDebugProvider) return;
    const currentModel = String(debugModel || "").trim();
    if (!currentModel || !selectedDebugProviderModels.includes(currentModel)) {
      setDebugModel(String(selectedDebugProviderModels[0] || ""));
    }
  }, [debugProvider, debugProvidersQuery.data]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-yaswarm-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-yaswarm-text">MCP & Tools</h2>
          <p className="text-xs text-yaswarm-muted">
            Tools configuration, channels, and plugin integrations
          </p>
          {config?.configPath && (
            <p className="text-[11px] text-yaswarm-muted mt-1 font-mono">
              source: {String(config.configPath)}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Tool Categories</p>
          <p className="text-2xl font-bold text-yaswarm-text mt-1">
            {isLoading ? "--" : combinedTools.length}
          </p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Tools Enabled</p>
          <p className="text-2xl font-bold text-yaswarm-success mt-1">
            {isLoading ? "--" : enabledTools}
          </p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Channels</p>
          <p className="text-2xl font-bold text-yaswarm-text mt-1">
            {isLoading ? "--" : `${enabledChannels}/${channels.length}`}
          </p>
        </div>
        <div className="yaswarm-card">
          <p className="text-xs text-yaswarm-muted">Plugins</p>
          <p className="text-2xl font-bold text-yaswarm-text mt-1">
            {isLoading ? "--" : `${enabledPlugins}/${plugins.length}`}
          </p>
        </div>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-yaswarm-text mb-3 flex items-center gap-2">
          <SearchIcon className="w-4 h-4 text-yaswarm-accent" />
          Connection Doctor
        </h3>
        <div className="yaswarm-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-yaswarm-muted">
              Run runtime checks for command availability, remote reachability, and required env keys.
            </p>
            <button
              onClick={() => doctorQuery.refetch()}
              disabled={doctorQuery.isFetching}
              className="yaswarm-btn-primary text-xs px-3 py-1.5"
            >
              {doctorQuery.isFetching ? "Running..." : "Run Checks"}
            </button>
          </div>
          {doctorQuery.data?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="rounded border border-yaswarm-border p-2">
                <p className="text-[11px] text-yaswarm-muted">Total</p>
                <p className="text-sm font-semibold text-yaswarm-text">{doctorQuery.data.summary.total}</p>
              </div>
              <div className="rounded border border-yaswarm-border p-2">
                <p className="text-[11px] text-yaswarm-muted">Healthy</p>
                <p className="text-sm font-semibold text-yaswarm-success">{doctorQuery.data.summary.healthy}</p>
              </div>
              <div className="rounded border border-yaswarm-border p-2">
                <p className="text-[11px] text-yaswarm-muted">Warnings</p>
                <p className="text-sm font-semibold text-yaswarm-warning">{doctorQuery.data.summary.warning}</p>
              </div>
              <div className="rounded border border-yaswarm-border p-2">
                <p className="text-[11px] text-yaswarm-muted">Errors</p>
                <p className="text-sm font-semibold text-yaswarm-error">{doctorQuery.data.summary.error}</p>
              </div>
              <div className="rounded border border-yaswarm-border p-2">
                <p className="text-[11px] text-yaswarm-muted">Disabled</p>
                <p className="text-sm font-semibold text-yaswarm-muted">{doctorQuery.data.summary.disabled}</p>
              </div>
            </div>
          )}
          {doctorQuery.isError && (
            <p className="text-xs text-yaswarm-error">
              {doctorQuery.error instanceof Error ? doctorQuery.error.message : "Failed to run checks"}
            </p>
          )}
          {Array.isArray(doctorQuery.data?.checks) && doctorQuery.data.checks.length > 0 && (
            <div className="space-y-2">
              {doctorQuery.data.checks.map((item: any) => (
                <div key={item.name} className="rounded border border-yaswarm-border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-yaswarm-text">{item.name}</span>
                    <span
                      className={`yaswarm-badge ${
                        item.status === "healthy"
                          ? "bg-yaswarm-success/15 text-yaswarm-success"
                          : item.status === "warning"
                          ? "bg-yaswarm-warning/15 text-yaswarm-warning"
                          : item.status === "disabled"
                          ? "bg-yaswarm-muted/20 text-yaswarm-muted"
                          : "bg-yaswarm-error/15 text-yaswarm-error"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-yaswarm-muted">
                    transport: <span className="font-mono">{item.transport}</span> · type:{" "}
                    <span className="font-mono">{item.type}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-yaswarm-muted">
                    command: {item.checks?.commandOk ? "ok" : "missing"} · remote:{" "}
                    {item.checks?.urlOk ? "ok" : "failed"} · missing env:{" "}
                    {(item.checks?.missingEnv || []).length}
                  </div>
                  {(item.checks?.missingEnv || []).length > 0 && (
                    <div className="mt-1 text-[11px] text-yaswarm-warning font-mono">
                      {(item.checks?.missingEnv || []).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-yaswarm-text mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-yaswarm-accent" />
          Runtime Access Audit
        </h3>
        <div className="yaswarm-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-yaswarm-muted">
              Verify enabled MCP reachability across agents, sub-agents, and installed coding CLIs.
            </p>
            <button
              onClick={() => accessAuditQuery.refetch()}
              disabled={accessAuditQuery.isFetching}
              className="yaswarm-btn-primary text-xs px-3 py-1.5"
            >
              {accessAuditQuery.isFetching ? "Running..." : "Run Audit"}
            </button>
          </div>
          {accessAuditQuery.data?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded border border-yaswarm-border p-2">
                <p className="text-[11px] text-yaswarm-muted">Agents Reachable</p>
                <p className="text-sm font-semibold text-yaswarm-text">
                  {accessAuditQuery.data.summary.agentsReachable}/{accessAuditQuery.data.summary.agentsChecked}
                </p>
              </div>
              <div className="rounded border border-yaswarm-border p-2">
                <p className="text-[11px] text-yaswarm-muted">Sub-Agents Reachable</p>
                <p className="text-sm font-semibold text-yaswarm-text">
                  {accessAuditQuery.data.summary.subAgentsReachable}/{accessAuditQuery.data.summary.subAgentsChecked}
                </p>
              </div>
              <div className="rounded border border-yaswarm-border p-2">
                <p className="text-[11px] text-yaswarm-muted">CLI Reachable</p>
                <p className="text-sm font-semibold text-yaswarm-text">
                  {accessAuditQuery.data.summary.cliReachable}/{accessAuditQuery.data.summary.cliChecked}
                </p>
              </div>
              <div className="rounded border border-yaswarm-border p-2">
                <p className="text-[11px] text-yaswarm-muted">Enabled Healthy MCPs</p>
                <p className="text-sm font-semibold text-yaswarm-success">
                  {accessAuditQuery.data.summary.enabledHealthyServers}/{accessAuditQuery.data.summary.enabledServers}
                </p>
              </div>
            </div>
          )}
          {Array.isArray(accessAuditQuery.data?.cli) && (
            <div className="space-y-2">
              {accessAuditQuery.data.cli
                .filter((row: any) => row.needsCollaboration || !row.canReadEnabledMcpsWithoutExtraConfig)
                .map((row: any) => (
                  <div key={row.id} className="rounded border border-yaswarm-border p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-mono text-yaswarm-text">{row.id}</p>
                        <p className="text-[11px] text-yaswarm-warning">{row.reason}</p>
                      </div>
                      <button
                        onClick={() => {
                          setCollabCli(row);
                          setCollabMessage(null);
                          setDebugTimeline([]);
                        }}
                        className="yaswarm-btn-ghost text-[11px] px-2 py-1 border border-yaswarm-border"
                      >
                        Collaborate
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {accessAuditQuery.isError && (
            <p className="text-xs text-yaswarm-error">
              {accessAuditQuery.error instanceof Error ? accessAuditQuery.error.message : "Failed to run access audit"}
            </p>
          )}
        </div>
      </section>
      {collabCli && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl yaswarm-card space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-yaswarm-text">
                MCP Collaboration: <span className="font-mono">{String(collabCli.id)}</span>
              </h4>
              <button
                onClick={() => {
                  setCollabCli(null);
                  setDebugTimeline([]);
                }}
                className="yaswarm-btn-ghost text-xs px-2 py-1 border border-yaswarm-border"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-yaswarm-muted">{String(collabCli.reason || "")}</p>
            {collabCli.customFormula && (
              <div className="rounded border border-yaswarm-border p-2">
                <p className="text-[11px] text-yaswarm-muted mb-1">Custom Formula</p>
                <p className="text-xs text-yaswarm-text">{String(collabCli.customFormula)}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-yaswarm-muted block mb-1">Debugger Provider</label>
                <select
                  value={debugProvider}
                  onChange={(e) => {
                    setDebugProvider(e.target.value);
                    const provider = debugProviders.find((p) => String(p.id) === e.target.value);
                    setDebugModel(String(provider?.models?.[0] || ""));
                  }}
                  className="yaswarm-input w-full text-xs"
                >
                  {debugProviders.map((p) => (
                    <option key={String(p.id)} value={String(p.id)}>
                      {String(p.label || p.id)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-yaswarm-muted block mb-1">Debugger Model</label>
                <select
                  value={debugModel || String(selectedDebugProviderModels[0] || "")}
                  onChange={(e) => setDebugModel(e.target.value)}
                  className="yaswarm-input w-full text-xs font-mono"
                >
                  {selectedDebugProviderModels.map((m: string) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded border border-yaswarm-border p-2">
              <p className="text-[11px] text-yaswarm-muted">
                Coverage: {Number(collabCli.enabledMcpCoverage || 0) * 100}% · Matches:{" "}
                {(collabCli.enabledMcpMatches || []).length}
              </p>
            </div>
            <button
              onClick={() =>
                debugFixMutation.mutate({
                  cliId: String(collabCli.id),
                  note: String(collabCli.reason || ""),
                  provider: debugProvider,
                  model: debugModel,
                })
              }
              disabled={debugFixMutation.isPending}
              className="yaswarm-btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
            >
              {debugFixMutation.isPending ? "Debugger Running..." : "Activate Debugger"}
            </button>
            {(debugFixMutation.isPending || debugTimeline.length > 0) && (
              <div className="rounded border border-yaswarm-border bg-black/20 backdrop-blur-sm p-3">
                <div className="flex items-center gap-2 mb-2">
                  {debugFixMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-yaswarm-accent" />}
                  <p className="text-[11px] text-yaswarm-muted">Debugger Activity</p>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {debugTimeline.map((line, i) => (
                    <p key={`${line}-${i}`} className="text-xs text-yaswarm-text">
                      • {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {collabCli.autoSyncSupported && (
              <button
                onClick={() => syncCliMutation.mutate(String(collabCli.id))}
                disabled={syncCliMutation.isPending}
                className="yaswarm-btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
              >
                {syncCliMutation.isPending ? "Syncing..." : "Run Auto Sync"}
              </button>
            )}
            {!collabCli.autoSyncSupported && (
              <p className="text-xs text-yaswarm-warning">
                Auto sync is not available for this CLI. Use the custom formula/manual setup.
              </p>
            )}
            {collabMessage && <p className="text-xs text-yaswarm-accent">{collabMessage}</p>}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-yaswarm-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-40" />
          <p className="text-xs">Loading MCP configuration...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && combinedTools.length === 0 && channels.length === 0 && plugins.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-yaswarm-muted">
          <Inbox className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-xs">No MCP configuration found</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* ─── Tools Configuration ───────────────────────────── */}
          {combinedTools.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-yaswarm-text mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-yaswarm-accent" />
                MCP Servers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {combinedTools.map((tool) => {
                  const isExpanded = expandedTool === tool.key;
                  const ToolIcon = tool.icon;

                  return (
                    <div
                      key={tool.key}
                      className="yaswarm-card hover:border-yaswarm-accent/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedTool(isExpanded ? null : tool.key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <ToolIcon className="w-4 h-4 text-yaswarm-muted" />
                          <span className="text-sm font-medium text-yaswarm-text">
                            {tool.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`yaswarm-badge ${
                              tool.enabled
                                ? "bg-yaswarm-success/15 text-yaswarm-success"
                                : "bg-yaswarm-muted/20 text-yaswarm-muted"
                            }`}
                          >
                            {tool.enabled ? "Enabled" : "Disabled"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleServerMutation.mutate({
                                name: tool.key,
                                enabled: !tool.enabled,
                              });
                            }}
                            disabled={toggleServerMutation.isPending}
                            className="yaswarm-btn-ghost text-[11px] px-2 py-1 border border-yaswarm-border disabled:opacity-60"
                          >
                            {toggleServerMutation.isPending ? "Saving..." : tool.enabled ? "Disable" : "Enable"}
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-yaswarm-muted" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-yaswarm-muted" />
                          )}
                        </div>
                      </div>

                      {isExpanded && tool.details && (
                        <div className="mt-3 pt-3 border-t border-yaswarm-border/50 space-y-1.5">
                          {Object.entries(tool.details).map(([subKey, subVal]) => (
                            <div key={subKey} className="flex items-center justify-between">
                              <span className="text-xs text-yaswarm-muted font-mono">{subKey}</span>
                              <span className="text-xs text-yaswarm-text">
                                {typeof subVal === "object" && subVal !== null
                                  ? (subVal as any).enabled !== undefined
                                    ? (subVal as any).enabled
                                      ? "enabled"
                                      : "disabled"
                                    : (subVal as any).provider ?? JSON.stringify(subVal)
                                  : String(subVal)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── Channels ──────────────────────────────────────── */}
          {channels.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-yaswarm-text mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-yaswarm-accent" />
                Channels
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {channels.map((ch) => {
                  const isExpanded = expandedChannel === ch.key;
                  const ChannelIcon = CHANNEL_ICONS[ch.key] ?? Radio;
                  const extraKeys = Object.keys(ch).filter(
                    (k) => k !== "key" && k !== "enabled"
                  );

                  return (
                    <div
                      key={ch.key}
                      className="yaswarm-card hover:border-yaswarm-accent/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedChannel(isExpanded ? null : ch.key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <ChannelIcon className="w-4 h-4 text-yaswarm-muted" />
                          <span className="text-sm font-medium text-yaswarm-text">
                            {capitalize(ch.key)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Circle
                            className={`w-2.5 h-2.5 fill-current ${
                              ch.enabled
                                ? "text-yaswarm-success"
                                : "text-yaswarm-muted/40"
                            }`}
                          />
                          <span
                            className={`text-xs ${
                              ch.enabled ? "text-yaswarm-success" : "text-yaswarm-muted"
                            }`}
                          >
                            {ch.enabled ? "Active" : "Inactive"}
                          </span>
                          {extraKeys.length > 0 && (
                            isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-yaswarm-muted" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-yaswarm-muted" />
                            )
                          )}
                        </div>
                      </div>

                      {isExpanded && extraKeys.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-yaswarm-border/50 space-y-1.5">
                          {extraKeys.map((k) => (
                            <div key={k} className="flex items-center justify-between">
                              <span className="text-xs text-yaswarm-muted font-mono">{k}</span>
                              <span className="text-xs text-yaswarm-text truncate max-w-[200px]">
                                {typeof ch[k] === "object"
                                  ? JSON.stringify(ch[k])
                                  : String(ch[k])}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── Plugins ───────────────────────────────────────── */}
          {plugins.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-yaswarm-text mb-3 flex items-center gap-2">
                <Plug className="w-4 h-4 text-yaswarm-accent" />
                Plugins
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {plugins.map((plugin) => (
                  <div
                    key={plugin.key}
                    className="yaswarm-card flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Plug className="w-3.5 h-3.5 text-yaswarm-muted" />
                      <span className="text-sm text-yaswarm-text">{capitalize(plugin.key)}</span>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        plugin.enabled ? "bg-yaswarm-success" : "bg-yaswarm-muted/40"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Gateway Info ──────────────────────────────────── */}
          {gateway && (
            <section>
              <h3 className="text-sm font-semibold text-yaswarm-text mb-3 flex items-center gap-2">
                <Server className="w-4 h-4 text-yaswarm-accent" />
                Gateway
              </h3>
              <div className="yaswarm-card space-y-2">
                {Object.entries(gateway).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-yaswarm-muted">{key}</span>
                    <span className="text-xs text-yaswarm-text font-mono">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Agent Config ──────────────────────────────────── */}
          {agent && (
            <section>
              <h3 className="text-sm font-semibold text-yaswarm-text mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-yaswarm-accent" />
                Agent Configuration
              </h3>
              <div className="yaswarm-card space-y-2">
                {Object.entries(agent).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-yaswarm-muted">{key}</span>
                    <span className="text-xs text-yaswarm-text font-mono">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── MCP Registry ──────────────────────────────────── */}
          {registry.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-yaswarm-text mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-yaswarm-accent" />
                MCP Server Registry
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {registry.map((srv: any) => {
                  const riskColor =
                    srv.risk_level === "HIGH" || srv.risk_level === "high" || srv.risk === "high"
                      ? "text-yaswarm-error border-yaswarm-error/25 bg-yaswarm-error/10"
                      : srv.risk_level === "medium" || srv.risk === "medium"
                      ? "text-yaswarm-warning border-yaswarm-warning/25 bg-yaswarm-warning/10"
                      : "text-yaswarm-success border-yaswarm-success/25 bg-yaswarm-success/10";

                  return (
                    <div key={srv.id || srv.name} className="yaswarm-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Server className="w-3.5 h-3.5 text-yaswarm-muted" />
                          <span className="text-sm font-medium text-yaswarm-text">{srv.id || srv.name}</span>
                        </div>
                        {(srv.risk_level || srv.risk) && (
                          <span className={`yaswarm-badge ${riskColor}`}>
                            {srv.risk_level === "HIGH" || srv.risk_level === "high" || srv.risk === "high" ? (
                              <AlertTriangle className="w-2.5 h-2.5 mr-1 inline" />
                            ) : null}
                            {srv.risk_level || srv.risk}
                          </span>
                        )}
                      </div>
                      {srv.description && (
                        <p className="text-[11px] text-yaswarm-muted mb-1">{srv.description}</p>
                      )}
                      {srv.transport && (
                        <div className="text-[10px] text-yaswarm-muted">
                          Transport: <span className="font-mono">{srv.transport}</span>
                        </div>
                      )}
                      {srv.status && (
                        <div className="text-[10px] text-yaswarm-muted">
                          Status: <span className="font-mono">{srv.status}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── MCP Env Keys ─────────────────────────────────── */}
          {!isSharedApiKeysFile && (
            <section>
              <h3 className="text-sm font-semibold text-yaswarm-text mb-3 flex items-center gap-2">
                <Key className="w-4 h-4 text-yaswarm-accent" />
                MCP Environment Keys
              </h3>
              <div className="yaswarm-card space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-yaswarm-muted block mb-1">MCP Key</label>
                    <select
                      value={envKey}
                      onChange={(e) => setEnvKey(e.target.value)}
                      className="yaswarm-input w-full text-xs font-mono"
                    >
                      <option value="">Select MCP key...</option>
                      {expectedEnvKeys.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-yaswarm-muted block mb-1">ENV Key</label>
                    <input
                      value={envKey}
                      onChange={(e) => setEnvKey(e.target.value.toUpperCase())}
                      placeholder="Or type allowed key"
                      className="yaswarm-input w-full text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                  <div>
                    <label className="text-[11px] text-yaswarm-muted block mb-1">Secret Value</label>
                    <input
                      type="password"
                      value={envValue}
                      onChange={(e) => setEnvValue(e.target.value)}
                      placeholder="Paste secret value"
                      className="yaswarm-input w-full text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveEnvKey}
                    disabled={saveEnvMutation.isPending || !envKey.trim()}
                    className="yaswarm-btn-primary text-xs px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saveEnvMutation.isPending ? "Saving..." : "Save Key"}
                  </button>
                  <span className="text-[11px] text-yaswarm-muted font-mono truncate">
                    {envData?.path ?? "No env file detected"}
                  </span>
                </div>
                {envMessage && (
                  <p
                    className={`text-xs ${
                      envMessage.toLowerCase().includes("failed") ||
                      envMessage.toLowerCase().includes("invalid") ||
                      envMessage.toLowerCase().includes("required")
                        ? "text-yaswarm-error"
                        : "text-yaswarm-success"
                    }`}
                  >
                    {envMessage}
                  </p>
                )}

                <div className="pt-2 border-t border-yaswarm-border/50">
                  <h4 className="text-xs text-yaswarm-muted mb-2">
                    Allowed MCP API Keys ({expectedEnvKeys.length})
                  </h4>
                  {expectedEnvKeys.length === 0 ? (
                    <p className="text-xs text-yaswarm-muted mb-2">
                      No MCP API keys detected from loaded MCP server config.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {expectedEnvKeys.map((k) => (
                        <button
                          key={k}
                          onClick={() => setEnvKey(k)}
                          className="text-[10px] px-2 py-0.5 rounded border border-yaswarm-border text-yaswarm-muted hover:text-yaswarm-text"
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  )}
                  <h4 className="text-xs text-yaswarm-muted mb-2">
                    Existing Keys ({envEntries.length})
                  </h4>
                  {envQuery.isLoading ? (
                    <p className="text-xs text-yaswarm-muted">Loading env keys...</p>
                  ) : envEntries.length === 0 ? (
                    <p className="text-xs text-yaswarm-muted">No keys found in env file.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {envEntries.map((entry) => (
                        <div key={entry.key} className="flex items-center justify-between">
                          <span className="text-xs text-yaswarm-text font-mono">{entry.key}</span>
                          <span className="text-xs text-yaswarm-muted font-mono">
                            {entry.maskedValue || "(empty)"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-yaswarm-text flex items-center gap-2">
                <FileCode className="w-4 h-4 text-yaswarm-accent" />
                MCP Configuration
              </h3>
              <button
                onClick={() => {
                  setShowConfig(!showConfig);
                  if (!configQuery.data) configQuery.refetch();
                }}
                className="yaswarm-btn-ghost text-xs px-3 py-1.5 border border-yaswarm-border"
              >
                {showConfig ? "Hide Config" : "View Config"}
              </button>
            </div>
            {showConfig && (
              <div className="yaswarm-card">
                {configQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-yaswarm-muted text-xs py-4 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading config...
                  </div>
                ) : configQuery.data?.exists === false ? (
                  <p className="text-xs text-yaswarm-muted text-center py-4">
                    Config file not found at {configQuery.data?.path}
                  </p>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-yaswarm-muted font-mono">
                        {configQuery.data?.path}
                      </span>
                      <span className="text-[10px] text-yaswarm-muted">
                        {configQuery.data?.sizeBytes
                          ? `${(configQuery.data.sizeBytes / 1024).toFixed(1)} KB`
                          : ""}
                      </span>
                    </div>
                    <pre className="text-[11px] text-yaswarm-text font-mono bg-yaswarm-bg/50 rounded p-3 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                      {JSON.stringify(configQuery.data?.config, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
