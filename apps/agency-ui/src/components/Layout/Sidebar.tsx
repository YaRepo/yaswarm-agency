import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import {
  Bot,
  MessageSquare,
  BarChart3,
  Terminal,
  Bug,
  Brain,
  Sparkles,
  Wrench,
  Upload,
  ScrollText,
  Inbox,
  FolderTree,
  FileText,
  LogOut,
  Zap,
  Radio,
  Cpu,
  BookOpen,
  KeyRound,
  X,
  Users,
  MessagesSquare,
  GitBranch,
} from "lucide-react";

const navItems = [
  { path: "/bots", label: "Bots", icon: Bot },
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/telegram", label: "Telegram", icon: Radio },
  { path: "/agents", label: "Agents", icon: Users },
  { path: "/communication", label: "Inter-Bot", icon: MessagesSquare },
  { path: "/telemetry", label: "Telemetry", icon: BarChart3 },
  { path: "/terminal", label: "Terminal", icon: Terminal },
  { path: "/tickets", label: "Tickets", icon: Bug },
  { path: "/memory", label: "Memory", icon: Brain },
  { path: "/skills", label: "Skills", icon: Sparkles },
  { path: "/mcp", label: "MCP & Tools", icon: Wrench },
  { path: "/api-keys", label: "API Keys", icon: KeyRound },
  { path: "/models", label: "Models", icon: Cpu },
  { path: "/model-routing", label: "Model Routing", icon: GitBranch },
  { path: "/obsidian", label: "Obsidian", icon: BookOpen },
  { path: "/upload", label: "Upload", icon: Upload },
  { path: "/logs", label: "Logs", icon: ScrollText },
  { path: "/desk", label: "Desk", icon: Inbox },
  { path: "/files", label: "Files", icon: FolderTree },
  { path: "/changelog", label: "Changelog", icon: FileText },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  mobile?: boolean;
}

export default function Sidebar({ className = "", onNavigate, mobile = false }: SidebarProps) {
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className={`w-56 h-screen bg-yaswarm-surface border-r border-yaswarm-border flex flex-col shrink-0 ${className}`}>
      {/* Brand */}
      <div className="p-4 border-b border-yaswarm-border">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yaswarm-accent/15 border border-yaswarm-accent/25 flex items-center justify-center">
              <Zap className="w-4 h-4 text-yaswarm-accent" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-yaswarm-text leading-tight">YaSwarm</h1>
              <p className="text-[10px] text-yaswarm-muted leading-tight">Agency Command Center</p>
            </div>
          </div>
          {mobile && (
            <button
              onClick={onNavigate}
              className="md:hidden p-1.5 rounded-md text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-100 ${
                isActive
                  ? "bg-yaswarm-accent/10 text-yaswarm-accent border-l-2 border-yaswarm-accent"
                  : "text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover"
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-yaswarm-border">
        <button
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-yaswarm-muted hover:text-yaswarm-error hover:bg-yaswarm-error/5 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
