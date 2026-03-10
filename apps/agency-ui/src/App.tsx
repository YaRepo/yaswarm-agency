import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import AppShell from "@/components/Layout/AppShell";
import LoginScreen from "@/components/Auth/LoginScreen";
import BotManagementPanel from "@/components/BotManagement/BotManagementPanel";
import ChatPanel from "@/components/Chat/ChatPanel";
import TelemetryPanel from "@/components/Telemetry/TelemetryPanel";
import TerminalPanel from "@/components/Terminal/TerminalPanel";
import TicketsPanel from "@/components/Tickets/TicketsPanel";
import MemoryPanel from "@/components/Memory/MemoryPanel";
import SkillsPanel from "@/components/Skills/SkillsPanel";
import MCPPanel from "@/components/MCP/MCPPanel";
import APIKeysPanel from "@/components/APIKeys/APIKeysPanel";
import UploadPanel from "@/components/Upload/UploadPanel";
import LogsPanel from "@/components/Logs/LogsPanel";
import DeskPanel from "@/components/Desk/DeskPanel";
import FileExplorerPanel from "@/components/FileExplorer/FileExplorerPanel";
import ChangelogPanel from "@/components/Changelog/ChangelogPanel";
import TelegramPanel from "@/components/Telegram/TelegramPanel";
import ModelsPanel from "@/components/Models/ModelsPanel";
import AgentStatusPanel from "@/components/AgentStatusPanel";
import InterBotCommunicationLog from "@/components/InterBotCommunicationLog";
import ModelRoutingVisualization from "@/components/ModelRoutingVisualization";
import ObsidianPanel from "@/components/Obsidian/ObsidianPanel";

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/bots" element={<BotManagementPanel />} />
        <Route path="/chat" element={<ChatPanel />} />
        <Route path="/telemetry" element={<TelemetryPanel />} />
        <Route path="/terminal" element={<TerminalPanel />} />
        <Route path="/tickets" element={<TicketsPanel />} />
        <Route path="/memory" element={<MemoryPanel />} />
        <Route path="/skills" element={<SkillsPanel />} />
        <Route path="/mcp" element={<MCPPanel />} />
        <Route path="/api-keys" element={<APIKeysPanel />} />
        <Route path="/upload" element={<UploadPanel />} />
        <Route path="/logs" element={<LogsPanel />} />
        <Route path="/desk" element={<DeskPanel />} />
        <Route path="/files" element={<FileExplorerPanel />} />
        <Route path="/changelog" element={<ChangelogPanel />} />
        <Route path="/telegram" element={<TelegramPanel />} />
        <Route path="/models" element={<ModelsPanel />} />
        <Route path="/obsidian" element={<ObsidianPanel />} />
        <Route path="/agents" element={<AgentStatusPanel />} />
        <Route path="/communication" element={<InterBotCommunicationLog />} />
        <Route path="/model-routing" element={<ModelRoutingVisualization />} />
        <Route path="*" element={<Navigate to="/bots" replace />} />
      </Route>
    </Routes>
  );
}
