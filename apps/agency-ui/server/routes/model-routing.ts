import { Router, Request, Response } from "express";
import { promises } from "fs";
import { existsSync } from "fs";

const router = Router();

const ROUTING_LOG_FILE = "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency/desk/sessions/routing-events.jsonl";

interface RoutingEvent {
  id: string;
  timestamp: string;
  task_type: string;
  from_model: string;
  to_model: string;
  department: string;
  reason: string;
}

router.get("/model-routing/events", async (_req: Request, res: Response) => {
  try {
    if (!existsSync(ROUTING_LOG_FILE)) {
      res.json({ events: [], sourcePath: ROUTING_LOG_FILE, exists: false });
      return;
    }
    const data = await promises.readFile(ROUTING_LOG_FILE, "utf-8");
    const lines = data.trim().split("\n").filter(Boolean);

    const events: RoutingEvent[] = [];
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        if (event.type === "routing_decision") {
          events.push(event);
        }
      } catch {}
    }

    res.json({
      events: events.reverse().slice(0, 100),
      sourcePath: ROUTING_LOG_FILE,
      exists: true,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
