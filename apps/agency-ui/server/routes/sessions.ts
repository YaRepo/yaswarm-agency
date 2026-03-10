import { Router, Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";

const router = Router();

const SESSION_SCRIPT = "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency/scripts/session_manager.py";
const SESSIONS_ROOT = "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency/desk/sessions";

function runSessionCommand(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn("python3", [SESSION_SCRIPT, "--sessions-root", SESSIONS_ROOT, ...args], {
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (data) => { stdout += data.toString(); });
    proc.stderr.on("data", (data) => { stderr += data.toString(); });
    proc.on("close", (code) => {
      resolve({ stdout, stderr, code: code ?? 1 });
    });
  });
}

router.get("/sessions", async (_req: Request, res: Response) => {
  try {
    const result = await runSessionCommand(["status"]);
    if (result.code !== 0) {
      res.status(500).json({ error: result.stderr || "Command failed" });
      return;
    }
    const data = JSON.parse(result.stdout);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/sessions/spawn", async (req: Request, res: Response) => {
  const { session_id, command, cwd } = req.body;
  if (!command) {
    res.status(400).json({ error: "command is required" });
    return;
  }
  try {
    const args = ["spawn", "--command", command];
    if (session_id) args.push("--session-id", session_id);
    if (cwd) args.push("--cwd", cwd);
    const result = await runSessionCommand(args);
    if (result.code !== 0) {
      res.status(500).json({ error: result.stderr || "Spawn failed" });
      return;
    }
    const data = JSON.parse(result.stdout);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/sessions/stop", async (req: Request, res: Response) => {
  const { session_id } = req.body;
  if (!session_id) {
    res.status(400).json({ error: "session_id is required" });
    return;
  }
  try {
    const result = await runSessionCommand(["stop", "--session-id", session_id]);
    if (result.code !== 0) {
      res.status(500).json({ error: result.stderr || "Stop failed" });
      return;
    }
    const data = JSON.parse(result.stdout);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/sessions/send", async (req: Request, res: Response) => {
  const { session_id, text } = req.body;
  if (!session_id || !text) {
    res.status(400).json({ error: "session_id and text are required" });
    return;
  }
  try {
    const result = await runSessionCommand(["send", "--session-id", session_id, "--text", text]);
    if (result.code !== 0) {
      res.status(500).json({ error: result.stderr || "Send failed" });
      return;
    }
    const data = JSON.parse(result.stdout);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/sessions/:session_id/logs", async (req: Request, res: Response) => {
  const sessionId = String(req.params.session_id ?? "");
  const tail = req.query.tail ? parseInt(req.query.tail as string, 10) : 0;
  try {
    const args = ["logs", "--session-id", sessionId];
    if (tail > 0) args.push("--tail", String(tail));
    const result = await runSessionCommand(args);
    if (result.code !== 0) {
      res.status(500).json({ error: result.stderr || "Logs failed" });
      return;
    }
    res.type("text/plain").send(result.stdout);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
