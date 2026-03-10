import { useEffect, useRef, useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Terminal as TerminalIcon, RefreshCw, ChevronDown, ChevronUp, BookOpen, Download, ArrowUpCircle, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import api from "@/api/bridge-api";
import "@xterm/xterm/css/xterm.css";

interface BackendToolInfo {
  id: string;
  label: string;
  kind: "cli" | "runtime";
  binary: string;
  checkedAliases?: string[];
  detectionSource?: string;
  runtimeContext?: string;
  installed: boolean;
  detected?: boolean;
  runnable?: boolean;
  version: string | null;
  versionError?: string | null;
  authConnected: boolean | null;
  installCommand: string | null;
  updateCommand: string | null;
}

interface TerminalSessionInfo {
  id: string;
  scope: "main" | "ceo" | "department";
  name: string;
  departmentId: string | null;
  cwd: string;
  status: "running" | "exited";
  watcherCount: number;
}

interface GovernorData {
  config: {
    enabled: boolean;
    autoDelayEnabled: boolean;
  };
  state: "green" | "yellow" | "red";
  reasons: string[];
  health: {
    loadPerCore: number;
    memUsedPercent: number;
    memFreeMb: number;
    tempC: number | null;
  };
  tremcp: {
    presentInCatalog: boolean;
    warning: string;
    installUrl?: string;
    installHint?: string;
  };
}

interface ApprovalItem {
  id: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  actorRole: "subagent" | "head" | "ceo" | "user";
  approverRole: "department_head" | "ceo" | "user";
  requestedAccess: "default" | "full";
  sessionId: string;
  command: string;
  reason: string;
}

function BackendToolsSection({
  tools,
  packageManager,
  loading,
  runningToolId,
  onInstall,
  onUpdate,
}: {
  tools: BackendToolInfo[];
  packageManager: string;
  loading: boolean;
  runningToolId: string | null;
  onInstall: (id: string) => void;
  onUpdate: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-3 shrink-0">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-yaswarm-muted hover:text-yaswarm-text transition-colors w-full px-1 py-1"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span className="font-medium">Backend CLIs & Runtime Tools</span>
        <span className="ml-auto text-[10px] text-yaswarm-muted">
          pkg: {packageManager}
        </span>
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {isOpen && (
        <div className="mt-2 rounded-lg border border-yaswarm-border bg-yaswarm-surface/50 p-3 space-y-2">
          {loading ? (
            <div className="text-xs text-yaswarm-muted flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading tool status...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tools.map((tool) => (
                <div key={tool.id} className="rounded border border-yaswarm-border/60 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-yaswarm-text">{tool.label}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        tool.installed
                          ? "bg-yaswarm-success/15 text-yaswarm-success"
                          : tool.detected
                          ? "bg-yaswarm-warning/15 text-yaswarm-warning"
                          : "bg-yaswarm-error/15 text-yaswarm-error"
                      }`}
                    >
                      {tool.installed ? "installed" : tool.detected ? "broken" : "missing"}
                    </span>
                  </div>
                  <p className="text-[10px] text-yaswarm-muted font-mono mt-1">{tool.binary}</p>
                  {tool.detectionSource && (
                    <p className="text-[10px] text-yaswarm-muted mt-1 truncate">
                      detect: {tool.detectionSource}
                    </p>
                  )}
                  {tool.version && <p className="text-[10px] text-yaswarm-muted mt-1 truncate">{tool.version}</p>}
                  {!tool.installed && tool.versionError && (
                    <p className="text-[10px] text-yaswarm-warning mt-1 truncate">{tool.versionError}</p>
                  )}
                  {typeof tool.authConnected === "boolean" && (
                    <p className={`text-[10px] mt-1 ${tool.authConnected ? "text-yaswarm-success" : "text-yaswarm-warning"}`}>
                      {tool.authConnected ? "authenticated" : "not authenticated"}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {!tool.installed ? (
                      <button
                        className="yaswarm-btn-primary text-[10px] px-2 py-1 flex items-center gap-1"
                        disabled={!tool.installCommand || runningToolId === tool.id}
                        onClick={() => onInstall(tool.id)}
                      >
                        {runningToolId === tool.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        Install
                      </button>
                    ) : (
                      <button
                        className="yaswarm-btn-ghost border border-yaswarm-border text-[10px] px-2 py-1 flex items-center gap-1"
                        disabled={!tool.updateCommand || runningToolId === tool.id}
                        onClick={() => onUpdate(tool.id)}
                      >
                        {runningToolId === tool.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpCircle className="w-3 h-3" />}
                        Update
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TerminalPanel() {
  const termRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("main");
  const [taskWeight, setTaskWeight] = useState<"light" | "medium" | "heavy">("medium");
  const [actorRole, setActorRole] = useState<"subagent" | "head" | "ceo" | "user">("subagent");
  const [requestedAccess, setRequestedAccess] = useState<"default" | "full">("default");
  const [toolActionMessage, setToolActionMessage] = useState<string>("");
  const [newSessionName, setNewSessionName] = useState("My Terminal");
  const [newSessionCwd, setNewSessionCwd] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const queryClient = useQueryClient();

  const backendToolsQ = useQuery({
    queryKey: ["bots", "backendTools"],
    queryFn: async () => {
      const res = await api.bots.backendTools();
      if (!res.ok) throw new Error(res.error || "Failed to load backend tools");
      return res.data as any;
    },
  });

  const terminalSessionsQ = useQuery({
    queryKey: ["terminal", "sessions"],
    queryFn: async () => {
      const res = await api.terminal.sessions();
      if (!res.ok) throw new Error(res.error || "Failed to load terminal sessions");
      return ((res.data as any)?.sessions || []) as TerminalSessionInfo[];
    },
    refetchInterval: 10000,
  });

  const governorQ = useQuery({
    queryKey: ["resource", "governor"],
    queryFn: async () => {
      const res = await api.resource.governor();
      if (!res.ok) throw new Error(res.error || "Failed to load governor");
      return res.data as GovernorData;
    },
    refetchInterval: 15000,
  });

  const updateGovernorMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.resource.updateGovernor(payload);
      if (!res.ok) throw new Error(res.error || "Failed to update governor");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource", "governor"] });
    },
  });

  const approvalsQ = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      const res = await api.approvals.list();
      if (!res.ok) throw new Error(res.error || "Failed to load approvals");
      return ((res.data as any)?.approvals || []) as ApprovalItem[];
    },
    refetchInterval: 8000,
  });

  const policyQ = useQuery({
    queryKey: ["cli", "permissions"],
    queryFn: async () => {
      const res = await api.cliPermissions.get();
      if (!res.ok) throw new Error(res.error || "Failed to load policy");
      return (res.data as any)?.policy || {};
    },
    refetchInterval: 15000,
  });

  const updatePolicyMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.cliPermissions.update(payload);
      if (!res.ok) throw new Error(res.error || "Failed to update policy");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cli", "permissions"] });
    },
  });

  const installToolMutation = useMutation({
    mutationFn: async (toolId: string) => {
      const res = await api.bots.installBackendTool(toolId);
      if (!res.ok) throw new Error(res.error || "Install failed");
      return { toolId, data: res.data };
    },
    onSuccess: (payload) => {
      const installed = Boolean((payload?.data as any)?.status?.installed);
      setToolActionMessage(
        installed
          ? `Installed ${payload.toolId}`
          : `Install finished but ${payload.toolId} is still not detected`
      );
      queryClient.invalidateQueries({ queryKey: ["bots", "backendTools"] });
    },
    onError: (err: any) => {
      setToolActionMessage(`Install failed: ${err?.message || "unknown error"}`);
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: async (toolId: string) => {
      const res = await api.bots.updateBackendTool(toolId);
      if (!res.ok) throw new Error(res.error || "Update failed");
      return { toolId, data: res.data };
    },
    onSuccess: (payload) => {
      setToolActionMessage(`Updated ${payload.toolId}`);
      queryClient.invalidateQueries({ queryKey: ["bots", "backendTools"] });
    },
    onError: (err: any) => {
      setToolActionMessage(`Update failed: ${err?.message || "unknown error"}`);
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const sessionId = `user-${Date.now()}`;
      const res = await api.terminal.createSession("user", undefined, {
        sessionId,
        name: newSessionName.trim() || "My Terminal",
        cwd: newSessionCwd.trim() || undefined,
      });
      if (!res.ok) throw new Error(res.error || "Failed to create session");
      return (res.data as any)?.session as TerminalSessionInfo;
    },
    onSuccess: (session) => {
      setToolActionMessage(`Opened terminal session: ${session.id}`);
      queryClient.invalidateQueries({ queryKey: ["terminal", "sessions"] });
      setSelectedSessionId(session.id);
    },
    onError: (err: any) => {
      setToolActionMessage(`Failed to open session: ${err?.message || "unknown error"}`);
    },
  });

  useEffect(() => {
    const sessions = terminalSessionsQ.data || [];
    if (sessions.length === 0) return;
    if (!sessions.some((s) => s.id === selectedSessionId)) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [terminalSessionsQ.data, selectedSessionId]);

  const connectWs = useCallback(() => {
    const term = terminalRef.current;
    if (!term) return;

    // Clear any pending reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProto}//${window.location.host}/ws/terminal/${encodeURIComponent(selectedSessionId)}`;
    term.writeln("\x1b[90mConnecting to " + wsUrl + "...\x1b[0m");

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        term.writeln("\x1b[32mConnected.\x1b[0m\r\n");
      };

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      ws.onerror = () => {
        // onclose will fire after this
      };

      ws.onclose = (event) => {
        setConnected(false);
        // Don't auto-reconnect if closed intentionally (code 1000) or component unmounting
        if (event.code === 1000) {
          term.writeln("\r\n\x1b[90mConnection closed.\x1b[0m");
          return;
        }
        term.writeln("\r\n\x1b[31mConnection lost.\x1b[0m");
        term.writeln("\x1b[90mAuto-reconnecting in 3s...\x1b[0m");
        reconnectTimerRef.current = window.setTimeout(() => {
          if (terminalRef.current) {
            connectWs();
          }
        }, 3000);
      };
    } catch {
      setConnected(false);
      term.writeln(
        "\r\n\x1b[31mTerminal server not connected. Start API server with: npm run server\x1b[0m"
      );
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (!termRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      theme: {
        background: "#0a0a0f",
        foreground: "#e8e8f0",
        cursor: "#d4a843",
        cursorAccent: "#0a0a0f",
        selectionBackground: "rgba(212, 168, 67, 0.3)",
        selectionForeground: "#e8e8f0",
        black: "#0a0a0f",
        red: "#f87171",
        green: "#4ade80",
        yellow: "#d4a843",
        blue: "#60a5fa",
        magenta: "#c084fc",
        cyan: "#22d3ee",
        white: "#e8e8f0",
        brightBlack: "#8888a0",
        brightRed: "#fca5a5",
        brightGreen: "#86efac",
        brightYellow: "#e8c060",
        brightBlue: "#93c5fd",
        brightMagenta: "#d8b4fe",
        brightCyan: "#67e8f9",
        brightWhite: "#f8f8ff",
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    term.open(termRef.current);

    // Initial fit
    try {
      fitAddon.fit();
    } catch {
      // container might not be visible yet
    }

    // Welcome message
    term.writeln("\x1b[33m=== YaSwarm Agency Terminal ===\x1b[0m");
    term.writeln("\x1b[90mConnecting to agency workspace...\x1b[0m");
    term.writeln("");

    // Send keystrokes over WS
    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(data);
      }
    });

    // Resize handler
    term.onResize(({ cols, rows }) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "resize", cols, rows })
        );
      }
    });

    // Attempt WS connection
    connectWs();

    // Responsive resize on window resize
    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch {
        // ignore
      }
    };
    window.addEventListener("resize", handleResize);

    // Also observe the container for layout changes
    const observer = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {
        // ignore
      }
    });
    if (termRef.current) {
      observer.observe(termRef.current);
    }

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      wsRef.current?.close();
      term.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      wsRef.current = null;
    };
  }, [connectWs]);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        fitAddonRef.current?.fit();
      } catch {
        // ignore
      }
    }, 60);
    return () => window.clearTimeout(timer);
  }, [isFullscreen]);

  const handleReconnect = () => {
    const term = terminalRef.current;
    if (term) {
      term.writeln("");
      term.writeln("\x1b[33mReconnecting...\x1b[0m");
    }
    connectWs();
  };

  const activeSession = (terminalSessionsQ.data || []).find((s) => s.id === selectedSessionId);

  return (
    <div className="flex flex-col h-full min-h-[70vh] animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
            <TerminalIcon className="w-5 h-5 text-yaswarm-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-yaswarm-text">Web Terminal</h2>
            <p className="text-xs text-yaswarm-muted">
              Interactive shell connected to the agency workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-yaswarm-success" : "bg-yaswarm-error"
              }`}
            />
            <span className="text-xs text-yaswarm-muted">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Reconnect button */}
          <button
            onClick={handleReconnect}
            className="yaswarm-btn-ghost text-xs px-3 py-1.5 border border-yaswarm-border flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            Reconnect
          </button>
          <button
            onClick={() => setIsFullscreen((v) => !v)}
            className="yaswarm-btn-ghost text-xs px-3 py-1.5 border border-yaswarm-border flex items-center gap-1.5"
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Open fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      <div className="mb-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-yaswarm-muted">Terminal Sessions</p>
          <div className="flex items-center gap-1.5">
            <button
              className="yaswarm-btn-ghost text-xs px-2 py-1 border border-yaswarm-border"
              onClick={() => terminalSessionsQ.refetch()}
            >
              Refresh
            </button>
            <button
              className="yaswarm-btn-primary text-xs px-2 py-1"
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? "Opening..." : "New Terminal"}
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          <input
            className="yaswarm-input text-xs"
            placeholder="Session name (optional)"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
          />
          <input
            className="yaswarm-input text-xs font-mono"
            placeholder="Start cwd (optional absolute or agency-relative path)"
            value={newSessionCwd}
            onChange={(e) => setNewSessionCwd(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(terminalSessionsQ.data || []).map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSessionId(s.id)}
              className={`px-3 py-1.5 rounded-md text-xs border shrink-0 ${
                selectedSessionId === s.id
                  ? "border-yaswarm-accent/50 bg-yaswarm-accent/15 text-yaswarm-accent"
                  : "border-yaswarm-border text-yaswarm-muted hover:text-yaswarm-text"
              }`}
            >
              {s.id === "main" ? "CEO/Main" : s.name}
            </button>
          ))}
        </div>
        {activeSession && (
          <div className="mt-2 text-[11px] text-yaswarm-muted flex flex-wrap gap-3">
            <span>cwd: {activeSession.cwd}</span>
            <span>watchers: {activeSession.watcherCount}</span>
            <span>status: {activeSession.status}</span>
            {activeSession.scope === "department" && activeSession.departmentId && (
              <>
                <button
                  className="underline hover:text-yaswarm-text"
                  onClick={async () => {
                    const res = await api.terminal.exec(
                      activeSession.id,
                      "yaswarm chat --department " + activeSession.departmentId,
                      {
                        taskName: `chat-${activeSession.departmentId}`,
                        taskWeight,
                        actorRole,
                        requestedAccess,
                      }
                    );
                    if (!res.ok) {
                      setToolActionMessage(res.error || "Task delayed by governor");
                    }
                  }}
                >
                  run chat
                </button>
                <button
                  className="underline hover:text-yaswarm-text"
                  onClick={async () => {
                    const res = await api.terminal.exec(activeSession.id, "pwd && ls -la", {
                      taskName: `inspect-${activeSession.departmentId}`,
                      taskWeight: "light",
                      actorRole,
                      requestedAccess: "default",
                    });
                    if (!res.ok) {
                      setToolActionMessage(res.error || "Exec failed");
                    }
                  }}
                >
                  inspect
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {governorQ.data && (
        <div className="mb-3 shrink-0 rounded-lg border border-yaswarm-border bg-yaswarm-surface/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-yaswarm-text">Resource Governor</p>
            <span
              className={`text-[10px] px-2 py-0.5 rounded ${
                governorQ.data.state === "green"
                  ? "bg-yaswarm-success/15 text-yaswarm-success"
                  : governorQ.data.state === "yellow"
                  ? "bg-yaswarm-warning/15 text-yaswarm-warning"
                  : "bg-yaswarm-error/15 text-yaswarm-error"
              }`}
            >
              {governorQ.data.state.toUpperCase()}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-yaswarm-muted flex flex-wrap gap-3">
            <span>load/core: {governorQ.data.health.loadPerCore.toFixed(2)}</span>
            <span>mem: {governorQ.data.health.memUsedPercent.toFixed(1)}%</span>
            <span>free: {governorQ.data.health.memFreeMb}MB</span>
            <span>temp: {governorQ.data.health.tempC == null ? "n/a" : `${governorQ.data.health.tempC.toFixed(1)}C`}</span>
          </div>
          <p className="text-[11px] text-yaswarm-muted mt-1">{governorQ.data.reasons.join(" · ")}</p>
          <p className="text-[11px] text-yaswarm-warning mt-1">{governorQ.data.tremcp.warning}</p>
          {!governorQ.data.tremcp.presentInCatalog && (
            <div className="mt-1 text-[11px] text-yaswarm-muted">
              <p>{governorQ.data.tremcp.installHint}</p>
              {governorQ.data.tremcp.installUrl && (
                <a
                  href={governorQ.data.tremcp.installUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-yaswarm-accent underline"
                >
                  {governorQ.data.tremcp.installUrl}
                </a>
              )}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <button
              className="yaswarm-btn-ghost text-[10px] px-2 py-1 border border-yaswarm-border"
              onClick={() =>
                updateGovernorMutation.mutate({
                  enabled: !governorQ.data?.config.enabled,
                })
              }
            >
              governor: {governorQ.data.config.enabled ? "on" : "off"}
            </button>
            <button
              className="yaswarm-btn-ghost text-[10px] px-2 py-1 border border-yaswarm-border"
              onClick={() =>
                updateGovernorMutation.mutate({
                  autoDelayEnabled: !governorQ.data?.config.autoDelayEnabled,
                })
              }
            >
              auto-delay: {governorQ.data.config.autoDelayEnabled ? "on" : "off"}
            </button>
            <label className="text-[10px] text-yaswarm-muted inline-flex items-center gap-1">
              task weight
              <select
                className="yaswarm-input text-[10px] py-1 px-1.5"
                value={taskWeight}
                onChange={(e) => setTaskWeight(e.target.value as "light" | "medium" | "heavy")}
              >
                <option value="light">light</option>
                <option value="medium">medium</option>
                <option value="heavy">heavy</option>
              </select>
            </label>
            <label className="text-[10px] text-yaswarm-muted inline-flex items-center gap-1">
              actor
              <select
                className="yaswarm-input text-[10px] py-1 px-1.5"
                value={actorRole}
                onChange={(e) =>
                  setActorRole(e.target.value as "subagent" | "head" | "ceo" | "user")
                }
              >
                <option value="subagent">subagent</option>
                <option value="head">department head</option>
                <option value="ceo">yaswarm ceo</option>
              </select>
            </label>
            <label className="text-[10px] text-yaswarm-muted inline-flex items-center gap-1">
              access
              <select
                className="yaswarm-input text-[10px] py-1 px-1.5"
                value={requestedAccess}
                onChange={(e) => setRequestedAccess(e.target.value as "default" | "full")}
              >
                <option value="default">default</option>
                <option value="full">full</option>
              </select>
            </label>
          </div>
        </div>
      )}
      {policyQ.data && (
        <div className="mb-3 shrink-0 rounded-lg border border-yaswarm-border bg-yaswarm-surface/50 p-3">
          <p className="text-xs font-semibold text-yaswarm-text mb-2">CLI Permission Policy</p>
          <div className="flex flex-wrap gap-2">
            <button
              className="yaswarm-btn-ghost text-[10px] px-2 py-1 border border-yaswarm-border"
              onClick={() =>
                updatePolicyMutation.mutate({
                  requireHeadApprovalForSubagentEscalation:
                    !policyQ.data.requireHeadApprovalForSubagentEscalation,
                })
              }
            >
              subagent to head approval: {policyQ.data.requireHeadApprovalForSubagentEscalation ? "on" : "off"}
            </button>
            <button
              className="yaswarm-btn-ghost text-[10px] px-2 py-1 border border-yaswarm-border"
              onClick={() =>
                updatePolicyMutation.mutate({
                  requireCeoApprovalForHeadEscalation:
                    !policyQ.data.requireCeoApprovalForHeadEscalation,
                })
              }
            >
              head to ceo approval: {policyQ.data.requireCeoApprovalForHeadEscalation ? "on" : "off"}
            </button>
            <button
              className="yaswarm-btn-ghost text-[10px] px-2 py-1 border border-yaswarm-border"
              onClick={() =>
                updatePolicyMutation.mutate({
                  requireUserApprovalForCeoEscalation:
                    !policyQ.data.requireUserApprovalForCeoEscalation,
                })
              }
            >
              ceo to user approval: {policyQ.data.requireUserApprovalForCeoEscalation ? "on" : "off"}
            </button>
          </div>
        </div>
      )}
      {(approvalsQ.data || []).some((a) => a.status === "pending") && (
        <div className="mb-3 shrink-0 rounded-lg border border-yaswarm-border bg-yaswarm-surface/50 p-3">
          <p className="text-xs font-semibold text-yaswarm-text mb-2">Pending Approvals</p>
          <div className="space-y-2 max-h-44 overflow-y-auto">
            {(approvalsQ.data || [])
              .filter((a) => a.status === "pending")
              .map((a) => (
                <div key={a.id} className="border border-yaswarm-border/60 rounded p-2">
                  <p className="text-[11px] text-yaswarm-text font-mono">{a.id}</p>
                    <p className="text-[10px] text-yaswarm-muted">
                      {a.actorRole} to {a.approverRole} | {a.requestedAccess} | {a.sessionId}
                    </p>
                  <p className="text-[10px] text-yaswarm-muted truncate">{a.command}</p>
                  <p className="text-[10px] text-yaswarm-warning">{a.reason}</p>
                  <div className="mt-1 flex gap-1.5">
                    <button
                      className="yaswarm-btn-primary text-[10px] px-2 py-1"
                      onClick={async () => {
                        await api.approvals.approve(a.id);
                        queryClient.invalidateQueries({ queryKey: ["approvals"] });
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="yaswarm-btn-ghost text-[10px] px-2 py-1 border border-yaswarm-border"
                      onClick={async () => {
                        await api.approvals.reject(a.id, { note: "Rejected from UI" });
                        queryClient.invalidateQueries({ queryKey: ["approvals"] });
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      <BackendToolsSection
        tools={(backendToolsQ.data?.tools || []) as BackendToolInfo[]}
        packageManager={backendToolsQ.data?.packageManager || "unknown"}
        loading={backendToolsQ.isLoading}
        runningToolId={
          installToolMutation.isPending
            ? (installToolMutation.variables as string)
            : updateToolMutation.isPending
            ? (updateToolMutation.variables as string)
            : null
        }
        onInstall={(id) => installToolMutation.mutate(id)}
        onUpdate={(id) => updateToolMutation.mutate(id)}
      />
      {(backendToolsQ.data as any)?.runtimeContext && (
        <div className="text-[11px] text-yaswarm-muted mb-2 px-1">
          Detection context: {(backendToolsQ.data as any).runtimeContext.scope} - {(backendToolsQ.data as any).runtimeContext.note}
        </div>
      )}
      {toolActionMessage && (
        <div className="text-xs text-yaswarm-muted mb-2 px-1">{toolActionMessage}</div>
      )}

      {/* Terminal window */}
      <div
        className={
          isFullscreen
            ? "fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] p-3 md:p-5"
            : "flex-1 min-h-0"
        }
      >
        <div
          className={
            isFullscreen
              ? "h-full rounded-lg border border-yaswarm-border overflow-hidden flex flex-col bg-yaswarm-bg"
              : "h-full rounded-lg border border-yaswarm-border overflow-hidden flex flex-col"
          }
        >
          {/* Title bar */}
          <div className="bg-yaswarm-surface px-4 py-2 flex items-center gap-2 border-b border-yaswarm-border shrink-0">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yaswarm-error/60" />
              <span className="w-3 h-3 rounded-full bg-yaswarm-warning/60" />
              <span className="w-3 h-3 rounded-full bg-yaswarm-success/60" />
            </div>
            <span className="text-[10px] text-yaswarm-muted font-mono ml-2">
              {activeSession ? `${activeSession.id} @ yaswarm - bash` : "yaswarm - bash"}
            </span>
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="ml-auto yaswarm-btn-ghost text-[10px] px-2 py-1 border border-yaswarm-border flex items-center gap-1"
                title="Exit fullscreen (Esc)"
              >
                <Minimize2 className="w-3 h-3" />
                Exit Fullscreen
              </button>
            )}
          </div>

          {/* Terminal body */}
          <div
            ref={termRef}
            className="flex-1 min-h-0"
            style={{ backgroundColor: "#0a0a0f", padding: "8px" }}
          />
        </div>
      </div>
    </div>
  );
}
