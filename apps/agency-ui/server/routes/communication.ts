import { Router, Request, Response } from "express";
import { existsSync, readFileSync } from "fs";

const router = Router();

const COMMUNICATION_LOG_FILE = "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency/desk/sessions/communication.jsonl";

interface DelegationEvent {
  id: string;
  timestamp: string;
  from_bot: string;
  to_bot: string;
  task_summary: string;
  status: "sent" | "failed" | "acknowledged";
}

interface MentionEvent {
  id: string;
  timestamp: string;
  bot_id: string;
  mention_text: string;
  target_bot: string;
  status: "resolved" | "failed" | "not_found";
}

router.get("/communication/delegations", async (_req: Request, res: Response) => {
  try {
    if (!existsSync(COMMUNICATION_LOG_FILE)) {
      res.json({ events: [], sourcePath: COMMUNICATION_LOG_FILE, exists: false });
      return;
    }
    const data = readFileSync(COMMUNICATION_LOG_FILE, "utf-8");
    const lines = data.trim().split("\n").filter(Boolean);

    const events: DelegationEvent[] = [];
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        if (event.type === "delegation") {
          events.push(event);
        }
      } catch {}
    }

    res.json({
      events: events.reverse().slice(0, 100),
      sourcePath: COMMUNICATION_LOG_FILE,
      exists: true,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/communication/mentions", async (_req: Request, res: Response) => {
  try {
    if (!existsSync(COMMUNICATION_LOG_FILE)) {
      res.json({ events: [], sourcePath: COMMUNICATION_LOG_FILE, exists: false });
      return;
    }
    const data = readFileSync(COMMUNICATION_LOG_FILE, "utf-8");
    const lines = data.trim().split("\n").filter(Boolean);

    const events: MentionEvent[] = [];
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        if (event.type === "mention") {
          events.push(event);
        }
      } catch {}
    }

    res.json({
      events: events.reverse().slice(0, 100),
      sourcePath: COMMUNICATION_LOG_FILE,
      exists: true,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
