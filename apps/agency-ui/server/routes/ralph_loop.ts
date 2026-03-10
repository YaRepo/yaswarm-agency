import { Router, Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";
import { readFile, writeFile } from "fs/promises";

const router = Router();

const RALPH_SCRIPT = "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency/scripts/ralph_loop.py";
const RALPH_REPORT_PATH = "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency/desk/sessions/ralph-loop-report.json";

interface RalphReport {
  timestamp: string;
  loop_duration_seconds: number;
  summary: {
    sessions_checked: number;
    stale_tasks: number;
    git_discoveries: number;
    ci_failures: number;
    total_actions: number;
  };
  actions: Array<{
    type: string;
    session_id?: string;
    task_id?: string;
    age_hours?: number;
    owner_dept?: string;
    objective?: string;
    reason?: string;
    previous_pid?: number;
  }>;
}

router.get("/ralph-loop/status", async (_req: Request, res: Response) => {
  try {
    const data = await readFile(RALPH_REPORT_PATH, "utf-8");
    const report: RalphReport = JSON.parse(data);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/ralph-loop/log", async (_req: Request, res: Response) => {
  try {
    const data = await readFile("/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency/desk/sessions/ralph-loop.log", "utf-8");
    const lines = data.split("\n").reverse();
    const tail = _req.query.tail ? parseInt(_req.query.tail as string, 100) : 50;
    res.type("text/plain").send(lines.slice(0, tail).join("\n"));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/ralph-loop/trigger", async (_req: Request, res: Response) => {
  try {
    const proc = spawn("python3", [RALPH_SCRIPT, "--once"], {
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    proc.on("close", (code) => {
      if (code === 0) {
        res.json({ ok: true, message: "Ralph Loop completed" });
      } else {
        res.status(500).json({ error: `Ralph Loop failed with code ${code}` });
      }
    });

    proc.on("error", (err) => {
      res.status(500).json({ error: String(err) });
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/ralph-loop/report", async (req: Request, res: Response) => {
  try {
    const reportBody = req.body as Partial<RalphReport>;
    if (!reportBody || !reportBody.timestamp) {
      res.status(400).json({ error: "Invalid report body" });
      return;
    }

    const existing = await readFile(RALPH_REPORT_PATH, "utf-8");
    const reports = existing.trim() ? JSON.parse(existing).reports || [] : [];
    reports.unshift(reportBody as RalphReport);

    await writeFile(
      RALPH_REPORT_PATH,
      JSON.stringify({ reports }, null, 2),
      "utf-8"
    );

    res.json({ ok: true, saved: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
