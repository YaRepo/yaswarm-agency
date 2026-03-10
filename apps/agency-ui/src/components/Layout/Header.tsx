import { useLocation } from "react-router-dom";
import { Circle, Menu } from "lucide-react";

const routeTitles: Record<string, string> = {
  "/bots": "Bot Management",
  "/chat": "Agency Chat",
  "/telegram": "Telegram Bridge",
  "/telemetry": "Telemetry Dashboard",
  "/terminal": "Web Terminal",
  "/tickets": "Bug Tickets",
  "/memory": "Memory Hub",
  "/skills": "Skill System",
  "/mcp": "MCP & Tools",
  "/api-keys": "API Keys",
  "/models": "Models & Backends",
  "/obsidian": "Obsidian Vaults",
  "/upload": "File Upload",
  "/logs": "Live Logs",
  "/desk": "Desk Workflow",
  "/files": "File Explorer",
  "/changelog": "Changelog",
  "/agents": "Agent Status",
  "/communication": "Inter-Bot Communication",
  "/model-routing": "Model Routing",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const title = routeTitles[location.pathname] || "Dashboard";

  return (
    <header className="h-12 bg-yaswarm-surface border-b border-yaswarm-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-md text-yaswarm-muted hover:text-yaswarm-text hover:bg-yaswarm-hover"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-yaswarm-text">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-yaswarm-muted">
          <Circle className="w-2 h-2 fill-yaswarm-success text-yaswarm-success" />
          <span>Bridge Online</span>
        </div>
      </div>
    </header>
  );
}
