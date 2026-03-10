import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Radio,
  Send,
  RefreshCw,
  Loader2,
  User,
  Bot,
  Hash,
  Clock,
  Inbox,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  Zap,
  KeyRound,
} from "lucide-react";
import api from "@/api/bridge-api";

interface ThreadInfo {
  id: number;
  name: string;
  department: string;
  botHandle: string;
  messageCount: number;
  lastActivity: string | null;
}

interface BotInfo {
  handle: string;
  name: string;
  department: string;
  tokenEnv: string;
  thread_id: number | null;
  tokenConfigured: boolean;
  hasThread: boolean;
}

interface UnifiedMessage {
  id: string;
  direction: "inbound" | "outbound";
  role: "user" | "assistant";
  text: string;
  ts?: string;
  from_id?: number;
  username?: string;
  first_name?: string;
  from_is_bot?: boolean;
  message_id?: number;
  reply_to_message_id?: number;
  media_type?: string;
  department?: string;
  botHandle?: string;
  source: "events" | "history";
}

const DEPT_COLORS: Record<string, string> = {
  CEO: "border-yaswarm-accent/40 bg-yaswarm-accent/10 text-yaswarm-accent",
  ceo: "border-yaswarm-accent/40 bg-yaswarm-accent/10 text-yaswarm-accent",
};

const DEPT_BG: Record<string, string> = {
  CEO: "bg-yaswarm-accent/5 border-yaswarm-accent/15",
  ceo: "bg-yaswarm-accent/5 border-yaswarm-accent/15",
};

function BotRolesPanel({
  bots,
  isLoading,
  onWhoRequest,
  onSyncBridges,
  onSaveToken,
  savingTokenEnv,
}: {
  bots: BotInfo[];
  isLoading: boolean;
  onWhoRequest: () => void;
  onSyncBridges: () => void;
  onSaveToken: (tokenEnv: string, token: string) => void;
  savingTokenEnv: string | null;
}) {
  const [tokenDrafts, setTokenDrafts] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="yaswarm-card p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-yaswarm-muted" />
      </div>
    );
  }

  return (
    <div className="yaswarm-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-yaswarm-accent" />
          <h3 className="text-sm font-semibold text-yaswarm-text">Agency Bots</h3>
          <span className="text-xs text-yaswarm-muted">({bots.length})</span>
        </div>
        <button
          onClick={onWhoRequest}
          className="yaswarm-btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          <Zap className="w-3 h-3" />
          Ask "Who's Who"
        </button>
        <button
          onClick={onSyncBridges}
          className="yaswarm-btn-ghost text-xs px-3 py-1.5 border border-yaswarm-border"
        >
          Sync Bridges
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {bots.map((bot) => {
          const deptKey = bot.department.toLowerCase();
          const colorClass = DEPT_COLORS[deptKey] || "border-yaswarm-border text-yaswarm-text";
          const bgColorClass = DEPT_BG[deptKey] || "bg-yaswarm-hover";
          const draft = tokenDrafts[bot.tokenEnv] ?? "";

          return (
            <div key={`${bot.department}-${bot.tokenEnv}`} className={`p-3 rounded-lg border ${bgColorClass} border-current/20`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className={`w-4 h-4 ${colorClass.split(" ")[2] || "text-yaswarm-text"}`} />
                  <span className="text-xs font-semibold truncate">{bot.name}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${bot.hasThread ? "border-green-400/40 text-green-400" : "border-amber-400/40 text-amber-400"}`}>
                  {bot.hasThread ? `thread ${bot.thread_id}` : "no thread"}
                </span>
              </div>

              <div className="text-[10px] text-yaswarm-muted mb-2">{bot.handle} · {bot.department}</div>

              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-3 h-3 text-yaswarm-muted" />
                <span className="text-[10px] font-mono text-yaswarm-muted">{bot.tokenEnv}</span>
                <span className={`text-[10px] ml-auto ${bot.tokenConfigured ? "text-green-400" : "text-amber-400"}`}>
                  {bot.tokenConfigured ? "configured" : "missing"}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  value={draft}
                  onChange={(e) => setTokenDrafts((prev) => ({ ...prev, [bot.tokenEnv]: e.target.value }))}
                  placeholder="Paste bot token"
                  className="yaswarm-input flex-1 text-xs"
                />
                <button
                  onClick={() => onSaveToken(bot.tokenEnv, draft)}
                  disabled={!draft.trim() || savingTokenEnv === bot.tokenEnv}
                  className="yaswarm-btn-primary px-3 text-xs disabled:opacity-50"
                >
                  {savingTokenEnv === bot.tokenEnv ? "Saving" : "Save"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TelegramPanel() {
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [tokenMessage, setTokenMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "telegram_message" || data.type === "telegram_update") {
          queryClient.invalidateQueries({ queryKey: ["telegram", "messages"] });
          queryClient.invalidateQueries({ queryKey: ["telegram", "threads"] });
        }
      } catch {
        // Ignore parse errors.
      }
    };

    return () => ws.close();
  }, [queryClient]);

  const threadsQuery = useQuery({
    queryKey: ["telegram", "threads"],
    queryFn: async () => {
      const res = await api.telegram.threads();
      if (!res.ok) throw new Error(res.error || "Failed to fetch threads");
      return ((res.data as any)?.threads as ThreadInfo[]) ?? [];
    },
    refetchInterval: wsConnected ? false : 30000,
  });

  const botsQuery = useQuery({
    queryKey: ["telegram", "bots"],
    queryFn: async () => {
      const res = await api.telegram.bots();
      if (!res.ok) throw new Error(res.error || "Failed to fetch bots");
      return ((res.data as any)?.bots as BotInfo[]) ?? [];
    },
  });

  const threads = threadsQuery.data ?? [];

  useEffect(() => {
    if (selectedThread !== null) return;
    if (threads.length === 0) return;
    setSelectedThread(threads[0].id);
  }, [threads, selectedThread]);

  const messagesQuery = useQuery({
    queryKey: ["telegram", "messages", selectedThread],
    queryFn: async () => {
      if (selectedThread === null) return [] as UnifiedMessage[];
      const res = await api.telegram.messages(selectedThread, 200);
      if (!res.ok) throw new Error(res.error || "Failed to fetch messages");
      return ((res.data as any)?.messages as UnifiedMessage[]) ?? [];
    },
    enabled: selectedThread !== null,
    refetchInterval: wsConnected ? false : 10000,
  });

  const sendMutation = useMutation({
    mutationFn: async ({ text, thread_id }: { text: string; thread_id: number }) => {
      const res = await api.telegram.send(text, thread_id);
      if (!res.ok) throw new Error(res.error || "Failed to send");
      return res.data;
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["telegram", "messages"] });
    },
  });

  const whoMutation = useMutation({
    mutationFn: async () => {
      const res = await api.telegram.who();
      if (!res.ok) throw new Error(res.error || "Failed to send roll call");
      return res.data;
    },
  });

  const saveTokenMutation = useMutation({
    mutationFn: async ({ tokenEnv, token }: { tokenEnv: string; token: string }) => {
      const res = await api.telegram.upsertBotToken(tokenEnv, token);
      if (!res.ok) throw new Error(res.error || "Failed to save token");
      return res.data;
    },
    onSuccess: (_data, vars) => {
      setTokenMessage(`Saved ${vars.tokenEnv}`);
      queryClient.invalidateQueries({ queryKey: ["telegram", "bots"] });
      setTimeout(() => setTokenMessage(null), 2000);
    },
    onError: (err) => {
      setTokenMessage(err instanceof Error ? err.message : "Failed to save token");
    },
  });

  const handleWhoRequest = useCallback(() => {
    whoMutation.mutate();
  }, [whoMutation]);

  const syncBridgesMutation = useMutation({
    mutationFn: async () => {
      const res = await api.telegram.syncBridges();
      if (!res.ok) throw new Error(res.error || "Failed to sync bridges");
      return res.data;
    },
    onSuccess: (data: any) => {
      const bridged = Number(data?.bridged_departments || 0);
      const total = Number(data?.total_departments || 0);
      const heads = data?.heads_bridge?.thread_id ? `heads:${data.heads_bridge.thread_id}` : "heads:missing";
      setTokenMessage(`Bridge sync complete ${bridged}/${total}, ${heads}`);
      queryClient.invalidateQueries({ queryKey: ["telegram", "threads"] });
      queryClient.invalidateQueries({ queryKey: ["telegram", "bots"] });
    },
    onError: (err) => {
      setTokenMessage(err instanceof Error ? err.message : "Failed to sync bridges");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  const messages = messagesQuery.data ?? [];
  const currentThread = threads.find((t) => t.id === selectedThread);
  const missingDepartmentBridges = (botsQuery.data ?? []).filter((b) => !b.hasThread);
  const inboundCount = messages.filter((m) => m.direction === "inbound").length;
  const outboundCount = messages.filter((m) => m.direction === "outbound").length;

  return (
    <div className="flex h-full gap-4">
      <div className="w-64 flex flex-col gap-4 shrink-0">
        <div className="yaswarm-card flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-yaswarm-border shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-yaswarm-accent" />
                <h3 className="text-sm font-semibold text-yaswarm-text">Threads</h3>
              </div>
              {wsConnected && (
                <span className="flex items-center gap-1 text-[10px] text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {threadsQuery.isLoading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="w-5 h-5 animate-spin text-yaswarm-muted" />
              </div>
            ) : threads.length === 0 ? (
              <div className="text-xs text-yaswarm-muted p-2">No bridged threads yet.</div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-colors text-sm ${
                    selectedThread === thread.id
                      ? "bg-yaswarm-accent/10 text-yaswarm-accent border border-yaswarm-accent/25"
                      : "text-yaswarm-text hover:bg-yaswarm-hover border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{thread.name}</span>
                    <span className="text-[10px] text-yaswarm-muted shrink-0">{thread.messageCount} msgs</span>
                  </div>
                  {thread.lastActivity && (
                    <div className="text-[10px] text-yaswarm-muted mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(thread.lastActivity).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
          {missingDepartmentBridges.length > 0 && (
            <div className="border-t border-yaswarm-border p-2 space-y-1">
              <p className="text-[10px] text-yaswarm-warning px-1">
                Missing bridges ({missingDepartmentBridges.length})
              </p>
              {missingDepartmentBridges.slice(0, 6).map((bot) => (
                <div key={bot.department} className="text-[10px] text-yaswarm-muted px-2 py-1 rounded bg-yaswarm-hover/60">
                  {bot.department} ({bot.name})
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowRoles(!showRoles)}
          className={`yaswarm-card p-3 flex items-center justify-between transition-colors ${
            showRoles ? "border-yaswarm-accent bg-yaswarm-accent/10" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-yaswarm-accent" />
            <span className="text-sm font-medium text-yaswarm-text">Bot Roles</span>
          </div>
          <span className="text-xs text-yaswarm-muted">{botsQuery.data?.length ?? 0} bots</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0 gap-4">
        {showRoles && (
          <>
            <BotRolesPanel
              bots={botsQuery.data ?? []}
              isLoading={botsQuery.isLoading}
              onWhoRequest={handleWhoRequest}
              onSyncBridges={() => syncBridgesMutation.mutate()}
              onSaveToken={(tokenEnv, token) => saveTokenMutation.mutate({ tokenEnv, token })}
              savingTokenEnv={saveTokenMutation.isPending ? saveTokenMutation.variables?.tokenEnv ?? null : null}
            />
            {tokenMessage && <div className="text-xs text-yaswarm-muted">{tokenMessage}</div>}
          </>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
                <Radio className="w-5 h-5 text-yaswarm-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-yaswarm-text">Telegram Group Mirror</h2>
                <p className="text-xs text-yaswarm-muted">
                  {currentThread ? `#${currentThread.name} · ${currentThread.botHandle}` : "Select a thread"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <div className="flex items-center gap-3 mr-2 text-[10px] text-yaswarm-muted">
                  <span className="flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3 text-yaswarm-accent" />
                    {inboundCount} in
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-green-400" />
                    {outboundCount} out
                  </span>
                </div>
              )}
              {currentThread && (
                <span
                  className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                    DEPT_COLORS[currentThread.department] || "border-yaswarm-border text-yaswarm-muted"
                  }`}
                >
                  {currentThread.department}
                </span>
              )}
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["telegram"] })}
                className="yaswarm-btn-ghost text-xs px-3 py-1.5 border border-yaswarm-border flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
          </div>

          <div className="flex-1 yaswarm-card flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-yaswarm-muted">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 opacity-40" />
                  <p className="text-xs">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-yaswarm-muted">
                  <Inbox className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No messages in this thread</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="p-3 border-t border-yaswarm-border shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && messageInput.trim() && currentThread) {
                      e.preventDefault();
                      sendMutation.mutate({ text: messageInput.trim(), thread_id: currentThread.id });
                    }
                  }}
                  placeholder={currentThread ? `Message #${currentThread.name}...` : "Select a thread first"}
                  className="yaswarm-input flex-1"
                  disabled={!currentThread || sendMutation.isPending}
                />
                <button
                  onClick={() => {
                    if (messageInput.trim() && currentThread) {
                      sendMutation.mutate({ text: messageInput.trim(), thread_id: currentThread.id });
                    }
                  }}
                  disabled={!currentThread || !messageInput.trim() || sendMutation.isPending}
                  className="yaswarm-btn-primary px-4 disabled:opacity-50"
                >
                  {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              {(sendMutation.isError || whoMutation.isError) && (
                <p className="text-xs text-red-400 mt-1">
                  {sendMutation.error?.message || whoMutation.error?.message || "Telegram action failed"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: UnifiedMessage }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = msg.text.length > 600;

  return (
    <div className={`flex gap-3 ${msg.direction === "outbound" ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          msg.direction === "outbound"
            ? "bg-green-400/10 border border-green-400/20"
            : "bg-yaswarm-hover border border-yaswarm-border"
        }`}
      >
        {msg.from_is_bot ? (
          <Bot className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <User className="w-3.5 h-3.5 text-yaswarm-accent" />
        )}
      </div>

      <div
        className={`flex-1 max-w-[85%] rounded-lg px-3 py-2 ${
          msg.direction === "outbound"
            ? DEPT_BG[msg.department ?? ""] || "bg-green-400/5 border border-green-400/15"
            : "bg-yaswarm-hover border border-yaswarm-border"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-yaswarm-text">
            {msg.first_name || msg.username || (msg.from_id ? `User ${msg.from_id}` : "User")}
          </span>
          {msg.username && <span className="text-[10px] text-yaswarm-muted">@{msg.username}</span>}
          {msg.source === "events" && <ArrowDownRight className="w-3 h-3 text-yaswarm-accent/50" />}
          <span className="text-[10px] text-yaswarm-muted ml-auto">{msg.ts ? new Date(msg.ts).toLocaleString() : ""}</span>
        </div>

        {msg.direction === "outbound" && (
          <div className="flex items-center gap-2 mb-1.5">
            {msg.department && (
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                  DEPT_COLORS[msg.department] || "border-yaswarm-border text-yaswarm-muted"
                }`}
              >
                {msg.department}
              </span>
            )}
            {msg.botHandle && <span className="text-[10px] text-yaswarm-muted">{msg.botHandle}</span>}
            <ArrowUpRight className="w-3 h-3 text-green-400/60" />
            <span className="text-[10px] text-green-400/60 font-medium">Response</span>
          </div>
        )}

        <div className="text-sm text-yaswarm-text/90 whitespace-pre-wrap break-words">
          {isLong && !expanded ? (
            <>
              {msg.text.slice(0, 600)}...
              <button onClick={() => setExpanded(true)} className="text-[11px] text-yaswarm-accent hover:underline mt-1">
                Show full response
              </button>
            </>
          ) : (
            <>
              {msg.text}
              {isLong && (
                <button onClick={() => setExpanded(false)} className="text-[11px] text-yaswarm-accent hover:underline mt-1">
                  Show less
                </button>
              )}
            </>
          )}
        </div>

        {msg.reply_to_message_id && (
          <div className="text-[10px] text-yaswarm-muted mt-1.5">Reply to #{msg.reply_to_message_id}</div>
        )}
      </div>
    </div>
  );
}
