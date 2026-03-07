#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

DEPARTMENTS = [
    {
        "id": "art-dev",
        "owner": "Art Development",
        "inputs": ["creative_brief", "audience", "format_constraints"],
        "outputs": ["style_tokens", "asset_plan", "production_notes"],
        "primary_skills": [
            "yamind-design-canvas-design",
            "yamind-design-image-enhancer",
            "yamind-design-cover-designer",
        ],
    },
    {
        "id": "backend-coding",
        "owner": "Backend Coding",
        "inputs": ["functional_requirements", "integration_constraints", "scale_targets"],
        "outputs": ["architecture_plan", "api_contracts", "reliability_checks"],
        "primary_skills": [
            "yamind-dev-mcp-builder",
            "yamind-dev-langsmith-fetch",
            "yamind-dev-create-pull-request",
        ],
    },
    {
        "id": "frontend-coding",
        "owner": "Frontend Coding",
        "inputs": ["ux_goals", "ui_library_constraints", "device_targets"],
        "outputs": ["component_plan", "accessibility_checks", "ui_tasks"],
        "primary_skills": [
            "frontend-intentional-minimalism-architect",
            "frontend-library-compliance-guard",
            "yamind-dev-web-design-guidelines",
        ],
    },
    {
        "id": "writing-fiction",
        "owner": "Writing Fiction",
        "inputs": ["premise", "tone", "canon"],
        "outputs": ["story_structure", "scene_plan", "revision_notes"],
        "primary_skills": [
            "book-novel-storylab",
            "yamind-writing-scene-writer",
            "yamind-writing-plot-architect",
            "yamind-writing-character-psychologist",
        ],
    },
    {
        "id": "writing-nonfiction",
        "owner": "Writing Non-Fiction",
        "inputs": ["topic_scope", "audience_level", "source_constraints"],
        "outputs": ["outline", "evidence_grid", "draft_blocks"],
        "primary_skills": [
            "yamind-writing-content-research-writer",
            "research-digest-builder",
            "content-publishing-pipeline",
        ],
    },
    {
        "id": "film-production",
        "owner": "Film Production",
        "inputs": ["concept", "runtime_target", "production_constraints"],
        "outputs": ["treatment", "shot_plan", "production_schedule"],
        "primary_skills": [
            "filmmaking-producer",
            "yamind-writing-showrunner-expert",
            "yamind-writing-prose-cinematographer",
        ],
    },
    {
        "id": "marketing",
        "owner": "Marketing",
        "inputs": ["segment", "channel_mix", "campaign_goal"],
        "outputs": ["messaging_matrix", "experiment_plan", "reporting_cadence"],
        "primary_skills": [
            "content-publishing-pipeline",
            "yamind-writing-competitive-ads-extractor",
            "portfolio-pitch-builder",
        ],
    },
    {
        "id": "business-opportunities",
        "owner": "Business Opportunities",
        "inputs": ["value_prop", "market_assumptions", "revenue_goal"],
        "outputs": ["offer_ladder", "pricing_hypothesis", "kpi_board"],
        "primary_skills": [
            "project-to-business-architect",
            "creator-finance-ops",
            "legal-admin-tracker",
        ],
    },
]


def main() -> int:
    ap = argparse.ArgumentParser(description="Build a super-parallel department swarm plan JSON")
    ap.add_argument("--project", required=True, help="Project identifier")
    ap.add_argument("--mode", default="implementation", choices=["design-only", "implementation", "audit-and-upgrade"])
    ap.add_argument("--max-parallel", type=int, default=4)
    ap.add_argument("--include-business", action="store_true")
    ap.add_argument("--out", required=True, help="Output JSON file")
    args = ap.parse_args()

    departments = [d for d in DEPARTMENTS if args.include_business or d["id"] != "business-opportunities"]

    plan = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "project": args.project,
        "mode": args.mode,
        "orchestrator": {
            "id": "swarm-orchestrator",
            "policy": [
                "enforce_owner_department",
                "reject_contract_violations",
                "escalate_risky_actions_for_approval",
            ],
        },
        "execution": {
            "max_parallel_departments": args.max_parallel,
            "queue_policy": "dependency-aware",
            "retry_policy": "owner-only-rework",
        },
        "departments": departments,
        "quality_gates": [
            "technical_correctness",
            "ux_accessibility",
            "content_clarity",
            "strategy_risk",
        ],
        "roadmap": {
            "day_30": "core orchestrator + engineering departments + baseline QA",
            "day_60": "creative departments + higher parallel throughput + improved handoffs",
            "day_90": "full cross-domain operation + KPI loop + continuous optimization",
        },
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(plan, indent=2), encoding="utf-8")
    print(f"wrote={out}")
    print(f"departments={len(departments)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
