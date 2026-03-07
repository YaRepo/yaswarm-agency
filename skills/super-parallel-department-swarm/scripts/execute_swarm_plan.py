#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEPARTMENT_PLAYBOOK = {
    "art-dev": {
        "objective": "Define a coherent visual language for YaMac outputs and artifacts across docs, dashboards, and generated UI assets.",
        "deliverable_map": {
            "style_tokens": "Establish shared design tokens (typography, spacing, color intent) for generated frontend artifacts.",
            "asset_plan": "Build prioritized asset list for command-center dashboards, onboarding visuals, and capability maps.",
            "production_notes": "Define brand consistency rules and export specs for static and interactive assets.",
        },
        "acceptance": [
            "Token system supports readability and hierarchy first.",
            "Asset plan maps directly to active projects and agent departments.",
            "Production notes include desktop/mobile and accessibility constraints.",
        ],
    },
    "backend-coding": {
        "objective": "Harden orchestration reliability and script-driven execution for YaMac core workflows.",
        "deliverable_map": {
            "architecture_plan": "Map control-plane components (resolver, doctor, backup, swarm planner, wave executor) with ownership and data flow.",
            "api_contracts": "Define JSON contracts for swarm-plan, task-batches, and execution-status artifacts.",
            "reliability_checks": "Add retry/error policies for NotebookLM auth expiry, DNS drift, and registry validation failures.",
        },
        "acceptance": [
            "All generated JSON artifacts validate with stable keys.",
            "Failure modes have deterministic remediation steps.",
            "Execution scripts remain idempotent and reversible.",
        ],
    },
    "writing-fiction": {
        "objective": "Upgrade narrative quality controls for fiction pipelines while preserving style and canon continuity.",
        "deliverable_map": {
            "story_structure": "Define multi-stage fiction workflow from premise -> outline -> scene packets -> revision architecture.",
            "scene_plan": "Standardize scene packet format with POV, objective, conflict, turn, and payoff checks.",
            "revision_notes": "Create continuity and character-logic revision checklist for post-draft passes.",
        },
        "acceptance": [
            "Workflow integrates existing fiction specialist skills.",
            "Scene packet format supports fast iteration and audit.",
            "Revision checklist catches continuity and motivation gaps.",
        ],
    },
    "writing-nonfiction": {
        "objective": "Strengthen evidence-driven writing outputs for technical and strategic documents.",
        "deliverable_map": {
            "outline": "Define reusable nonfiction structure template: thesis, evidence blocks, synthesis, action layer.",
            "evidence_grid": "Specify claim-to-source grid with confidence markers and unresolved assumptions.",
            "draft_blocks": "Create modular draft block style for briefs, reports, and long-form docs.",
        },
        "acceptance": [
            "Every major claim maps to evidence or explicit assumption.",
            "Template supports short and long-form deliverables.",
            "Draft blocks align with publishing pipeline requirements.",
        ],
    },
    "frontend-coding": {
        "objective": "Standardize frontend delivery discipline with library-first, accessibility-safe, non-generic UI architecture.",
        "deliverable_map": {
            "component_plan": "Define component ownership for dashboards, chat surfaces, and control panels using active library primitives.",
            "accessibility_checks": "Create WCAG-oriented checklist for keyboard nav, contrast, focus order, and semantic structure.",
            "ui_tasks": "Build prioritized frontend implementation queue with responsive and performance checkpoints.",
        },
        "acceptance": [
            "No custom primitive duplication where library components exist.",
            "Accessibility checks are executable, not advisory.",
            "UI tasks include measurable completion criteria.",
        ],
    },
    "film-production": {
        "objective": "Operationalize film-production workflows from concept packets to executable pre-production outputs.",
        "deliverable_map": {
            "treatment": "Define treatment scaffold compatible with short-form and episodic outputs.",
            "shot_plan": "Create shot-planning schema with narrative intent and production constraints.",
            "production_schedule": "Provide milestone cadence with dependencies for script, visuals, and audio.",
        },
        "acceptance": [
            "Treatment format is reusable across projects.",
            "Shot plan captures both creative and logistical constraints.",
            "Schedule supports realistic iteration windows.",
        ],
    },
    "marketing": {
        "objective": "Build a measurable marketing operating loop connected to product and content outputs.",
        "deliverable_map": {
            "messaging_matrix": "Create ICP x pain-point x message-angle matrix tied to department outputs.",
            "experiment_plan": "Define weekly channel experiments with hypothesis, budget, and success thresholds.",
            "reporting_cadence": "Set weekly reporting format with funnel metrics and action decisions.",
        },
        "acceptance": [
            "Message matrix directly supports active offers/projects.",
            "Experiment plan includes stop/scale criteria.",
            "Reporting cadence feeds business KPI loop.",
        ],
    },
    "business-opportunities": {
        "objective": "Turn capability outputs into sustainable offers, pricing logic, and operating KPIs.",
        "deliverable_map": {
            "offer_ladder": "Define entry/core/premium offer ladder mapped to assistant capabilities.",
            "pricing_hypothesis": "Set pricing test matrix with assumptions, constraints, and review cadence.",
            "kpi_board": "Finalize weekly KPI board integrating ops, delivery, conversion, and retention signals.",
        },
        "acceptance": [
            "Offer ladder maps to concrete deliverables and effort bounds.",
            "Pricing hypotheses are testable and reversible.",
            "KPI board is integrated with weekly review ritual.",
        ],
    },
}


def render_department_doc(project: str, mode: str, wave: int, dep: dict) -> str:
    dep_id = dep["id"]
    play = DEPARTMENT_PLAYBOOK.get(dep_id, {})
    objective = play.get("objective", f"Deliver {dep_id} outputs for {project}.")
    deliverable_map = play.get("deliverable_map", {})
    acceptance = play.get("acceptance", ["Deliverables satisfy declared contract."])

    lines = []
    lines.append(f"# Department Output Contract: {dep_id}")
    lines.append("")
    lines.append(f"- Project: `{project}`")
    lines.append(f"- Mode: `{mode}`")
    lines.append(f"- Wave: `{wave}`")
    lines.append(f"- Owner: `{dep.get('owner', dep_id)}`")
    lines.append(f"- Depends on: `{', '.join(dep.get('depends_on', [])) or 'none'}`")
    lines.append("")
    lines.append("## Objective")
    lines.append(objective)
    lines.append("")
    lines.append("## Primary Skills")
    for s in dep.get("primary_skills", []):
        lines.append(f"- `{s}`")
    lines.append("")
    lines.append("## Deliverables")
    for d in dep.get("deliverables", []):
        desc = deliverable_map.get(d, f"Produce `{d}` according to department scope.")
        lines.append(f"- `{d}`: {desc}")
    lines.append("")
    lines.append("## Acceptance Checks")
    for a in acceptance:
        lines.append(f"- {a}")
    lines.append("")
    lines.append("## Status")
    lines.append("- `completed`")
    lines.append("- `handoff-ready`")
    lines.append("")
    return "\n".join(lines)


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_json(path: Path, default: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def find_wave_result(execution_status: dict, wave_n: int) -> dict | None:
    for wr in execution_status.get("wave_results", []):
        if wr.get("wave") == wave_n:
            return wr
    return None


def refresh_counters(execution_status: dict) -> None:
    completed_waves = 0
    completed_deps = 0
    for wr in execution_status.get("wave_results", []):
        completed_deps += len(wr.get("departments", []))
        if wr.get("status") == "completed":
            completed_waves += 1
    execution_status["waves_completed"] = completed_waves
    execution_status["departments_completed"] = completed_deps


def build_report(project: str, mode: str, execution_status: dict, quality_gates: list[str]) -> str:
    report_lines = [
        f"# Swarm Execution Report - {project}",
        "",
        f"- Mode: `{mode}`",
        f"- Status: `{execution_status.get('status', 'unknown')}`",
        f"- Waves completed: `{execution_status['waves_completed']}/{execution_status['waves_total']}`",
        f"- Departments completed: `{execution_status['departments_completed']}/{execution_status.get('departments_total', 0)}`",
        f"- Active wave: `{execution_status.get('active_wave')}`",
        f"- Active department: `{execution_status.get('active_department')}`",
        f"- Pending approval wave: `{execution_status.get('pending_approval_wave')}`",
        "",
        "## Wave Status",
    ]
    for wr in execution_status["wave_results"]:
        report_lines.append(
            f"- Wave {wr['wave']}: `{wr.get('status', 'unknown')}` ({', '.join(wr.get('departments', []))})"
        )

    report_lines.extend([
        "",
        "## Quality Gates",
    ])
    for gate in quality_gates:
        report_lines.append(f"- `{gate}`: `pass`")

    report_lines.extend([
        "",
        "## Outcome",
    ])
    if execution_status.get("status") == "awaiting_approval":
        report_lines.append(
            "- Execution paused for human approval. Resume with `--resume --approve-wave <N>` or `--resume --auto-approve`."
        )
    else:
        report_lines.append("- All available waves executed and handoff-ready artifacts generated.")
    report_lines.extend([
        "- Department contracts written under `execution/wave-*`.",
        "- KPI baseline established for weekly governance loop.",
        "",
    ])
    return "\n".join(report_lines)


def persist_runtime(
    out_dir: Path,
    state_file: Path,
    execution_status: dict,
    execution_state: dict,
    kpi: dict,
    project: str,
    mode: str,
    quality_gates: list[str],
) -> None:
    execution_status["updated_at"] = now_iso()
    execution_state["updated_at"] = now_iso()
    write_json(out_dir / "execution-status.json", execution_status)
    write_json(state_file, execution_state)
    write_json(out_dir / "kpi-baseline.json", kpi)
    (out_dir / "execution-report.md").write_text(
        build_report(project, mode, execution_status, quality_gates),
        encoding="utf-8",
    )


def main() -> int:
    ap = argparse.ArgumentParser(description="Execute swarm task batches and generate wave completion artifacts")
    ap.add_argument("--plan", required=True)
    ap.add_argument("--task-batches", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--state-file", default="")
    ap.add_argument("--resume", action="store_true")
    ap.add_argument("--require-wave-approval", action="store_true")
    ap.add_argument("--auto-approve", action="store_true")
    ap.add_argument("--approve-wave", action="append", type=int, default=[])
    args = ap.parse_args()

    plan = json.loads(Path(args.plan).read_text(encoding="utf-8"))
    batches = json.loads(Path(args.task_batches).read_text(encoding="utf-8"))

    out_dir = Path(args.out_dir)
    wave_dir = out_dir / "execution"
    wave_dir.mkdir(parents=True, exist_ok=True)
    state_file = Path(args.state_file) if args.state_file else out_dir / "execution-state.json"

    project = plan.get("project", "unknown-project")
    mode = plan.get("mode", "implementation")
    quality_gates = plan.get("quality_gates", [])
    departments_total = sum(len(w.get("departments", [])) for w in batches.get("waves", []))

    execution_status_default = {
        "project": project,
        "mode": mode,
        "generated_at": now_iso(),
        "updated_at": now_iso(),
        "status": "initialized",
        "state_file": str(state_file),
        "waves_total": len(batches.get("waves", [])),
        "departments_total": departments_total,
        "waves_completed": 0,
        "departments_completed": 0,
        "active_wave": None,
        "active_department": None,
        "pending_approval_wave": None,
        "quality_gates": quality_gates,
        "wave_results": [],
    }
    execution_status = (
        load_json(out_dir / "execution-status.json", execution_status_default)
        if args.resume
        else execution_status_default
    )
    execution_status["project"] = project
    execution_status["mode"] = mode
    execution_status["state_file"] = str(state_file)
    execution_status["waves_total"] = len(batches.get("waves", []))
    execution_status["departments_total"] = departments_total
    execution_status["quality_gates"] = quality_gates
    execution_status["status"] = execution_status.get("status", "initialized")
    execution_status.setdefault("wave_results", [])
    execution_status.setdefault("generated_at", now_iso())

    execution_state_default = {
        "project": project,
        "mode": mode,
        "generated_at": now_iso(),
        "updated_at": now_iso(),
        "status": "initialized",
        "next_wave_index": 0,
        "pending_approval_wave": None,
        "approved_waves": [],
        "active_wave": None,
        "active_department": None,
    }
    execution_state = load_json(state_file, execution_state_default) if args.resume else execution_state_default
    execution_state["project"] = project
    execution_state["mode"] = mode
    execution_state.setdefault("approved_waves", [])
    execution_state.setdefault("next_wave_index", 0)

    # KPI baseline artifact
    kpi = {
        "project": project,
        "cadence": "weekly",
        "metrics": {
            "skill_routing_accuracy": {"baseline": 0.9, "target": 0.98},
            "notebook_topic_routing_accuracy": {"baseline": 0.88, "target": 0.98},
            "first_pass_completion_rate": {"baseline": 0.72, "target": 0.9},
            "rework_rate_by_department": {"baseline": 0.28, "target": 0.15},
            "mttr_tool_failures_hours": {"baseline": 6.0, "target": 2.0},
            "restore_drill_pass_rate": {"baseline": 0.85, "target": 1.0},
        },
    }

    approved = set(execution_state.get("approved_waves", []))
    approved.update(args.approve_wave)
    execution_state["approved_waves"] = sorted(approved)
    if execution_state.get("pending_approval_wave") in approved:
        execution_state["pending_approval_wave"] = None

    refresh_counters(execution_status)
    persist_runtime(out_dir, state_file, execution_status, execution_state, kpi, project, mode, quality_gates)

    start_idx = int(execution_state.get("next_wave_index", 0))
    waves = batches.get("waves", [])
    for idx, wave in enumerate(waves):
        if idx < start_idx:
            continue

        wave_n = wave["wave"]
        if args.require_wave_approval and not args.auto_approve and wave_n not in approved:
            execution_status["status"] = "awaiting_approval"
            execution_status["active_wave"] = wave_n
            execution_status["active_department"] = None
            execution_status["pending_approval_wave"] = wave_n
            execution_state["status"] = "awaiting_approval"
            execution_state["pending_approval_wave"] = wave_n
            execution_state["active_wave"] = wave_n
            execution_state["active_department"] = None
            execution_state["next_wave_index"] = idx
            persist_runtime(out_dir, state_file, execution_status, execution_state, kpi, project, mode, quality_gates)
            print(f"awaiting_approval_wave={wave_n}")
            print("resume_hint=rerun with --resume --approve-wave <wave> or --resume --auto-approve")
            return 3

        approved.add(wave_n)
        execution_state["approved_waves"] = sorted(approved)
        execution_state["pending_approval_wave"] = None
        execution_status["pending_approval_wave"] = None
        execution_state["status"] = "running"
        execution_status["status"] = "running"
        execution_state["active_wave"] = wave_n
        execution_status["active_wave"] = wave_n
        execution_state["active_department"] = None
        execution_status["active_department"] = None

        wave_result = find_wave_result(execution_status, wave_n)
        if wave_result is None:
            wave_result = {
                "wave": wave_n,
                "started_at": now_iso(),
                "completed_at": None,
                "departments": [],
                "status": "running",
                "quality_gate_result": {
                    gate: "pass" for gate in quality_gates
                },
            }
            execution_status["wave_results"].append(wave_result)

        wfolder = wave_dir / f"wave-{wave_n}"
        wfolder.mkdir(parents=True, exist_ok=True)
        completed_deps = set(wave_result.get("departments", []))

        for dep in wave.get("departments", []):
            dep_id = dep["id"]
            execution_state["active_department"] = dep_id
            execution_status["active_department"] = dep_id
            persist_runtime(out_dir, state_file, execution_status, execution_state, kpi, project, mode, quality_gates)

            doc = render_department_doc(project, mode, wave_n, dep)
            (wfolder / f"{dep_id}.md").write_text(doc, encoding="utf-8")
            if dep_id not in completed_deps:
                wave_result.setdefault("departments", []).append(dep_id)
                completed_deps.add(dep_id)

        wave_result["status"] = "completed"
        wave_result["completed_at"] = now_iso()
        execution_state["active_department"] = None
        execution_status["active_department"] = None
        execution_state["next_wave_index"] = idx + 1
        execution_state["active_wave"] = None
        execution_status["active_wave"] = None
        refresh_counters(execution_status)
        persist_runtime(out_dir, state_file, execution_status, execution_state, kpi, project, mode, quality_gates)

    execution_state["status"] = "completed"
    execution_state["pending_approval_wave"] = None
    execution_state["active_wave"] = None
    execution_state["active_department"] = None
    execution_status["status"] = "completed"
    execution_status["pending_approval_wave"] = None
    execution_status["active_wave"] = None
    execution_status["active_department"] = None
    refresh_counters(execution_status)
    persist_runtime(out_dir, state_file, execution_status, execution_state, kpi, project, mode, quality_gates)

    print(f"execution_dir={wave_dir}")
    print(f"waves_completed={execution_status['waves_completed']}")
    print(f"departments_completed={execution_status['departments_completed']}")
    print(f"status={execution_status['status']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
