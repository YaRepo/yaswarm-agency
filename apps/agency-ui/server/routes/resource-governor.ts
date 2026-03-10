import { Router, Request, Response } from "express";
import {
  readGovernorConfig,
  writeGovernorConfig,
  collectMachineSnapshot,
  evaluateGovernorState,
  detectTremcpStatus,
  adviseTaskRun,
  type TaskWeight,
} from "../lib/resource-governor";

const router = Router();

function normalizeWeight(raw: string): TaskWeight {
  const w = String(raw || "medium").toLowerCase();
  if (w === "light" || w === "medium" || w === "heavy") return w;
  return "medium";
}

router.get("/resource/governor", (req: Request, res: Response) => {
  try {
    const cfg = readGovernorConfig();
    const snapshot = collectMachineSnapshot();
    const tremcp = detectTremcpStatus();
    const activeHeavy = Math.max(0, Number(req.query.activeHeavy || 0));
    const evaluation = evaluateGovernorState(snapshot, cfg, activeHeavy);

    res.json({
      ok: true,
      config: cfg,
      health: snapshot,
      state: evaluation.state,
      reasons: evaluation.reasons,
      tremcp,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to load resource governor", detail });
  }
});

router.put("/resource/governor", (req: Request, res: Response) => {
  try {
    const current = readGovernorConfig();
    const body = (req.body || {}) as any;
    const next = {
      ...current,
      ...body,
      thresholds: {
        ...current.thresholds,
        ...(body.thresholds || {}),
      },
      scheduling: {
        ...current.scheduling,
        ...(body.scheduling || {}),
      },
    };
    writeGovernorConfig(next);
    res.json({ ok: true, config: next });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to update resource governor", detail });
  }
});

router.get("/resource/health", (req: Request, res: Response) => {
  try {
    const cfg = readGovernorConfig();
    const snapshot = collectMachineSnapshot();
    const activeHeavy = Math.max(0, Number(req.query.activeHeavy || 0));
    const evaluation = evaluateGovernorState(snapshot, cfg, activeHeavy);
    const tremcp = detectTremcpStatus();
    res.json({
      ok: true,
      health: snapshot,
      state: evaluation.state,
      reasons: evaluation.reasons,
      tremcp,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to collect health", detail });
  }
});

router.post("/resource/advise", (req: Request, res: Response) => {
  try {
    const cfg = readGovernorConfig();
    const snapshot = collectMachineSnapshot();
    const tremcp = detectTremcpStatus();
    const activeHeavy = Math.max(0, Number(req.body?.activeHeavy || 0));
    const taskWeight = normalizeWeight(String(req.body?.taskWeight || "medium"));
    const evaluation = evaluateGovernorState(snapshot, cfg, activeHeavy);
    const advice = adviseTaskRun({
      state: evaluation.state,
      taskWeight,
      config: cfg,
      tremcp,
    });
    res.json({
      ok: true,
      state: evaluation.state,
      reasons: evaluation.reasons,
      taskWeight,
      advice,
      health: snapshot,
      tremcp,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to produce advice", detail });
  }
});

export default router;
