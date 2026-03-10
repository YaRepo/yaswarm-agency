import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  Plus,
  Trash2,
  Clock,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import api, {
  type ChatSessionSummary,
  type ChatMsg,
} from "@/api/bridge-api";

// ─── Types ───────────────────────────────────────────────────

const CEO_DEPARTMENT = "CEO";
const DEPT_STYLE_PALETTE = [
  "text-blue-400 border-blue-400/30 bg-blue-400/10",
  "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  "text-green-400 border-green-400/30 bg-green-400/10",
  "text-orange-400 border-orange-400/30 bg-orange-400/10",
  "text-pink-400 border-pink-400/30 bg-pink-400/10",
  "text-purple-400 border-purple-400/30 bg-purple-400/10",
] as const;

function hashDeptKey(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function isCeoDepartment(dept: string): boolean {
  return dept.trim().toLowerCase() === "ceo";
}

function getDepartmentStyle(dept: string): string {
  if (isCeoDepartment(dept)) {
    return "text-yaswarm-accent border-yaswarm-accent/30 bg-yaswarm-accent/10";
  }
  return DEPT_STYLE_PALETTE[hashDeptKey(dept) % DEPT_STYLE_PALETTE.length];
}

function formatDepartmentLabel(dept: string): string {
  if (isCeoDepartment(dept)) return CEO_DEPARTMENT;
  return dept
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

// ─── Component ───────────────────────────────────────────────

export default function ChatPanel() {
  const queryClient = useQueryClient();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>(CEO_DEPARTMENT);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch sessions list ────────────────────────────────────
  const sessionsQuery = useQuery({
    queryKey: ["chat", "sessions"],
    queryFn: async () => {
      const res = await api.chat.sessions();
      if (!res.ok) throw new Error(res.error || "Failed to fetch sessions");
      return res.data!.sessions;
    },
    refetchInterval: 30000,
  });

  const sessions: ChatSessionSummary[] = sessionsQuery.data ?? [];

  const botsConfigQuery = useQuery({
    queryKey: ["bots", "config", "chat"],
    queryFn: async () => {
      const res = await api.bots.list();
      if (!res.ok) throw new Error(res.error || "Failed to fetch departments");
      return res.data as any;
    },
    refetchInterval: 30000,
  });

  const departments: string[] = useMemo(() => {
    const set = new Set<string>([CEO_DEPARTMENT]);
    const configured = Object.keys(
      (botsConfigQuery.data?.departments || {}) as Record<string, any>,
    );
    configured.forEach((dept) => {
      if (dept) set.add(isCeoDepartment(dept) ? CEO_DEPARTMENT : dept);
    });
    sessions.forEach((session) => {
      if (session.department) {
        set.add(
          isCeoDepartment(session.department) ? CEO_DEPARTMENT : session.department,
        );
      }
    });
    const all = Array.from(set);
    const nonCeo = all
      .filter((dept) => !isCeoDepartment(dept))
      .sort((a, b) => a.localeCompare(b));
    return [CEO_DEPARTMENT, ...nonCeo];
  }, [botsConfigQuery.data, sessions]);

  useEffect(() => {
    if (!departments.includes(selectedDept)) {
      setSelectedDept(CEO_DEPARTMENT);
    }
  }, [departments, selectedDept]);

  // ─── Load session messages when switching ───────────────────
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await api.chat.getSession(activeSessionId);
      if (cancelled) return;
      if (res.ok && res.data) {
        setMessages(res.data.messages);
        const dept = (res.data.department as string) || CEO_DEPARTMENT;
        setSelectedDept(isCeoDepartment(dept) ? CEO_DEPARTMENT : dept);
      }
    })();
    return () => { cancelled = true; };
  }, [activeSessionId]);

  // ─── Auto-scroll on new messages ────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ─── Focus input on mount ──────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ─── Create new session ────────────────────────────────────
  const handleNewChat = useCallback(async () => {
    // Just clear current session — actual session gets created on first message send
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }, []);

  // ─── Delete a session ──────────────────────────────────────
  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await api.chat.deleteSession(id);
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
      }
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
    } finally {
      setDeletingId(null);
    }
  }, [activeSessionId, queryClient]);

  // ─── Select a session ──────────────────────────────────────
  const handleSelectSession = useCallback((session: ChatSessionSummary) => {
    setActiveSessionId(session.id);
  }, []);

  // ─── Send message ──────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    // Optimistic user message
    const userMsg: ChatMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
      department: selectedDept,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const result = await api.chat.send(text, selectedDept, activeSessionId ?? undefined);
      if (!result.ok) {
        throw new Error(result.error || "Send failed");
      }
      const data = result.data!;

      // If this was a new session, update activeSessionId
      if (!activeSessionId && data.sessionId) {
        setActiveSessionId(data.sessionId);
      }

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: data.content,
          timestamp: new Date().toISOString(),
          department: data.department || selectedDept,
          model: data.model,
        },
      ]);

      // Refresh sessions list to show new/updated session
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "system",
          content: `Failed to send message: ${errMsg}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
    }

    setSending(false);
    inputRef.current?.focus();
  }, [input, sending, selectedDept, activeSessionId, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-0 h-[calc(100vh-7rem)] md:h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between mb-3 md:mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-yaswarm-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-yaswarm-text">
              Agency Chat
            </h2>
            <p className="text-xs text-yaswarm-muted">
              Persistent sessions with CEO routing and direct department access
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-yaswarm-muted">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Server-side relay</span>
        </div>
      </div>

      {/* Main layout: sidebar + chat area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden">
        {/* ─── Session Sidebar ─────────────────────────────────── */}
        <div className="w-full lg:w-64 lg:shrink-0 max-h-64 lg:max-h-none yaswarm-card flex flex-col overflow-hidden">
          {/* Sidebar header */}
          <div className="p-3 border-b border-yaswarm-border flex items-center justify-between">
            <span className="text-xs font-semibold text-yaswarm-muted uppercase tracking-wider">
              Sessions
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] })}
                className="p-1 rounded hover:bg-yaswarm-hover text-yaswarm-muted hover:text-yaswarm-text transition-colors"
                title="Refresh sessions"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sessionsQuery.isFetching ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleNewChat}
                className="p-1 rounded hover:bg-yaswarm-hover text-yaswarm-accent hover:text-yaswarm-accent transition-colors"
                title="New chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* New Chat button */}
          <button
            onClick={handleNewChat}
            className={`mx-2 mt-2 mb-1 px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
              !activeSessionId
                ? "bg-yaswarm-accent/15 text-yaswarm-accent border border-yaswarm-accent/25"
                : "text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover border border-transparent"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessionsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8 text-yaswarm-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-6 text-yaswarm-muted text-xs opacity-60">
                No chat sessions yet
              </div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors group relative ${
                    activeSessionId === s.id
                      ? "bg-yaswarm-accent/10 border border-yaswarm-accent/20"
                      : "hover:bg-yaswarm-hover border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {/* Department badge */}
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        getDepartmentStyle(s.department)
                      }`}
                    >
                      {formatDepartmentLabel(s.department)}
                    </span>
                    <span className="text-[10px] text-yaswarm-muted ml-auto">
                      {s.messageCount}
                    </span>
                  </div>
                  <div className="text-xs text-yaswarm-text truncate pr-5">
                    {s.title}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-yaswarm-muted">
                    <Clock className="w-2.5 h-2.5" />
                    {formatRelativeTime(s.updatedAt)}
                  </div>

                  {/* Delete button (on hover) */}
                  <button
                    onClick={(e) => handleDelete(s.id, e)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-yaswarm-muted hover:text-red-400 transition-all"
                    title="Delete session"
                  >
                    {deletingId === s.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ─── Chat Area ───────────────────────────────────────── */}
        <div className="flex-1 yaswarm-card flex flex-col overflow-hidden">
          {/* Department tabs */}
          <div className="p-3 pb-2 border-b border-yaswarm-border">
            <div className="flex gap-1.5 overflow-x-auto">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 border ${
                    selectedDept === dept
                      ? getDepartmentStyle(dept)
                      : "text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover border-transparent"
                  }`}
                >
                  {isCeoDepartment(dept)
                    ? `${CEO_DEPARTMENT} (Default)`
                    : formatDepartmentLabel(dept)}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-yaswarm-muted mt-1.5 px-1">
              {selectedDept === CEO_DEPARTMENT
                ? "Messages go to the CEO agent (main). Select a department tab to message it directly."
                : `Messages routed directly to ${selectedDept} agent.`}
            </p>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center h-full text-yaswarm-muted">
                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">
                  {activeSessionId ? "Empty session" : "Start a new conversation"}
                </p>
                <p className="text-xs mt-1 opacity-70">
                  Select a department or use CEO routing to start chatting
                </p>
                <div className="mt-4 text-xs opacity-50 max-w-sm text-center">
                  Messages are persisted server-side. Switch panels and come back
                  — your chat history will still be here.
                </div>
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
            )}

            {/* Sending indicator */}
            {sending && (
              <div className="flex items-center gap-2 text-yaswarm-muted text-xs pl-11">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Waiting for response...</span>
              </div>
            )}

            {/* Scroll anchor */}
            {messages.length > 0 && <div className="h-1" />}
          </div>

          {/* Input area */}
          <div className="border-t border-yaswarm-border p-3">
            <div className="flex items-center gap-2">
              {/* Department indicator */}
              <div
                className={`px-2 py-1 rounded text-[10px] font-semibold border shrink-0 ${
                  getDepartmentStyle(selectedDept)
                }`}
              >
                {selectedDept}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedDept === CEO_DEPARTMENT ? "the agency" : selectedDept}...`}
                className="yaswarm-input flex-1"
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className={`yaswarm-btn-primary px-3 py-2 transition-opacity ${
                  !input.trim() || sending
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-100"
                }`}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="px-3 py-1.5 rounded-md bg-yaswarm-hover text-yaswarm-muted text-xs max-w-md text-center">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-yaswarm-accent/15 border border-yaswarm-accent/25"
            : "bg-yaswarm-hover border border-yaswarm-border"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-yaswarm-accent" />
        ) : (
          <Bot className="w-4 h-4 text-yaswarm-muted" />
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Meta line */}
        <div
          className={`flex items-center gap-2 text-[10px] text-yaswarm-muted ${
            isUser ? "flex-row-reverse" : ""
          }`}
        >
          {msg.department && (
            <span
              className={`px-1.5 py-0.5 rounded border font-semibold ${
                getDepartmentStyle(msg.department)
              }`}
            >
              {formatDepartmentLabel(msg.department)}
            </span>
          )}
          <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
          {msg.model && <span className="opacity-60">{msg.model}</span>}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
            isUser
              ? "bg-yaswarm-accent/15 text-yaswarm-text border border-yaswarm-accent/20"
              : "bg-yaswarm-hover text-yaswarm-text border border-yaswarm-border"
          }`}
        >
          {isUser ? (
            <span>{msg.content}</span>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function formatRelativeTime(isoStr: string): string {
  const now = Date.now();
  const then = new Date(isoStr).getTime();
  const diff = now - then;

  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  if (diff < 604800_000) return `${Math.floor(diff / 86400_000)}d ago`;
  return new Date(isoStr).toLocaleDateString();
}
