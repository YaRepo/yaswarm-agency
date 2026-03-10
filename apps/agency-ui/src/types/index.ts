// ─── Bot & Agency Types ──────────────────────────────────────

export interface DepartmentBot {
  id: string;
  name: string;
  handle: string;
  department: string;
  role: string;
  status: "online" | "offline" | "busy" | "error";
  model?: string;
  fallbackModels?: string[];
  lastActivity?: string;
  systemContext?: string;
}

export interface SubAgent {
  name: string;
  department: string;
  model: string;
  fallbackChain: string[];
  backend: string;
  status: "active" | "disabled";
}

// ─── Chat Types ──────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  department?: string;
  botHandle?: string;
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

// ─── Telemetry Types ─────────────────────────────────────────

export interface TelemetryEvent {
  timestamp: string;
  department: string;
  subAgent: string;
  model: string;
  backend: string;
  durationMs: number;
  tokensIn: number;
  tokensOut: number;
  success: boolean;
  fallbackUsed: boolean;
  taskId?: string;
  error?: string;
}

export interface ModelPerformance {
  model: string;
  totalCalls: number;
  successRate: number;
  avgDurationMs: number;
  avgTokensIn: number;
  avgTokensOut: number;
  failureCount: number;
  lastUsed: string;
}

// ─── Ticket Types ────────────────────────────────────────────

export interface BugTicket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  department: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  resolution?: string;
  tags?: string[];
}

// ─── Memory Types ────────────────────────────────────────────

export interface MemoryEntry {
  id: string;
  source: "hive_sql" | "memory_md" | "daily_md" | "injected";
  department?: string;
  botHandle?: string;
  taskId?: string;
  status?: string;
  summary: string;
  project?: string;
  tags?: string[];
  sourcePath?: string;
  timestamp: string;
  content?: string;
}

// ─── Skill Types ─────────────────────────────────────────────

export interface Skill {
  name: string;
  directory: string;
  description: string;
  triggers: string[];
  context: "global" | "project" | "series";
  quality: "high" | "medium" | "low";
  autoSelect: boolean;
  status: "ready" | "draft" | "deprecated";
  lastUpdated?: string;
}

// ─── MCP & Tools Types ──────────────────────────────────────

export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  source: string;
  enabled: boolean;
}

export interface MCPServer {
  name: string;
  url?: string;
  command?: string;
  args?: string[];
  status: "connected" | "disconnected" | "error";
  tools: MCPTool[];
}

// ─── Desk / Workflow Types ──────────────────────────────────

export type DeskStage = "inbox" | "wip" | "review" | "done" | "rejected";

export interface DeskItem {
  id: string;
  title: string;
  department: string;
  stage: DeskStage;
  createdAt: string;
  updatedAt: string;
  assignee?: string;
  artifacts?: string[];
  metadata?: Record<string, unknown>;
}

// ─── File Explorer Types ────────────────────────────────────

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  modifiedAt?: string;
  children?: FileNode[];
}

// ─── Log Types ──────────────────────────────────────────────

export interface LogEntry {
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  source: string;
  message: string;
  data?: Record<string, unknown>;
}

// ─── Changelog Types ────────────────────────────────────────

export interface ChangelogEntry {
  date: string;
  version?: string;
  type: "feature" | "fix" | "enhancement" | "refactor" | "docs";
  title: string;
  description: string;
  author?: string;
  commitHash?: string;
}

// ─── API Response Types ─────────────────────────────────────

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ─── Auth Types ─────────────────────────────────────────────

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<boolean>;
  logout: () => void;
}

// ─── Navigation Types ───────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: number;
}
