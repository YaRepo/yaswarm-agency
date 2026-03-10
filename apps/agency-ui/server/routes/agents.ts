import { Router, Request, Response } from "express";
import { spawn } from "child_process";
import { existsSync } from "fs";

const router = Router();

interface AgentStatus {
  bot_id: string;
  bot_name: string;
  department: string;
  status: "idle" | "active" | "busy" | "offline";
  last_activity: string;
  pid: number | null;
  current_task: string | null;
}

interface AgentStatusResponse {
  timestamp: string;
  agents: AgentStatus[];
}

router.get("/agents/status", async (_req: Request, res: Response) => {
  try {
    const sessionScript = "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency/scripts/session_manager.py";
    if (!existsSync(sessionScript)) {
      res.json({
        timestamp: new Date().toISOString(),
        agents: [],
        sourcePath: sessionScript,
        exists: false,
      });
      return;
    }

    const proc = spawn("python3", [
      sessionScript,
      "--sessions-root",
      "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency/desk/sessions",
      "status",
    ], {
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => { stdout += data.toString(); });
    proc.stderr.on("data", (data) => { stderr += data.toString(); });

    const timeout = setTimeout(() => {
      if (!proc.killed) {
        proc.kill();
      }
    }, 8000);

    const response = await new Promise<AgentStatusResponse>((resolve, reject) => {
      proc.on("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0 && !stdout) {
          reject(new Error(`Command failed with code ${code}`));
          return;
        }

        let sessionData: any = {};
        try {
          sessionData = stdout.trim() ? JSON.parse(stdout) : {};
        } catch {
          sessionData = {};
        }
        const agents: AgentStatus[] = [];

        if (sessionData.sessions && typeof sessionData.sessions === "object") {
          const sessions = sessionData.sessions as Record<string, any>;
          for (const [sid, session] of Object.entries(sessions)) {
            const pid = session.pid;
            const command = session.command;
            const status = session.status === "running" ? "active" : "offline";
            const lastActivity = session.started_at || "";

            let botId = sid;
            let botName = sid;
            let currentTask = null;

            if (command) {
              const commandParts = command.split(/[\s]+/);
              const firstPart = commandParts[0]?.toLowerCase() || "";
              if (firstPart === "python3" || firstPart === "python") {
                const scriptName = commandParts[1];
                if (scriptName) {
                  botName = sid;
                  currentTask = scriptName;
                }
              }
            }

            agents.push({
              bot_id: botId,
              bot_name: botName,
              department: sid,
              status: status,
              last_activity: lastActivity,
              pid: pid || null,
              current_task: currentTask,
            });
          }
        }

        const response: AgentStatusResponse = {
          timestamp: new Date().toISOString(),
          agents: agents.sort((a, b) => {
            return a.department.localeCompare(b.department);
          }),
        };

        resolve(response);
      });

      proc.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    res.json(response);
  } catch (err) {
    console.error("Agent status error:", err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
