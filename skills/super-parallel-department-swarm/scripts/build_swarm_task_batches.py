#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import defaultdict, deque
from pathlib import Path

DEFAULT_DEPS = {
    "art-dev": [],
    "backend-coding": [],
    "frontend-coding": ["backend-coding", "art-dev"],
    "writing-fiction": [],
    "writing-nonfiction": [],
    "film-production": ["writing-fiction", "art-dev"],
    "marketing": ["frontend-coding", "writing-nonfiction", "art-dev"],
    "business-opportunities": ["marketing", "backend-coding", "frontend-coding"],
}


def topo_waves(nodes: list[str], deps: dict[str, list[str]]) -> list[list[str]]:
    indeg: dict[str, int] = {n: 0 for n in nodes}
    children: dict[str, list[str]] = defaultdict(list)

    for n in nodes:
        for d in deps.get(n, []):
            if d not in indeg:
                continue
            indeg[n] += 1
            children[d].append(n)

    q = deque(sorted([n for n, v in indeg.items() if v == 0]))
    waves: list[list[str]] = []
    visited = 0

    while q:
        wave = list(q)
        q.clear()
        waves.append(wave)
        for n in wave:
            visited += 1
            for c in sorted(children.get(n, [])):
                indeg[c] -= 1
                if indeg[c] == 0:
                    q.append(c)

    if visited != len(nodes):
        raise SystemExit("dependency cycle detected in department graph")
    return waves


def build_md(plan: dict, waves: list[list[str]], dept_map: dict[str, dict]) -> str:
    lines: list[str] = []
    lines.append(f"# Swarm Task Batches - {plan['project']}")
    lines.append("")
    lines.append(f"- Mode: `{plan.get('mode','implementation')}`")
    lines.append(f"- Max parallel departments: `{plan.get('execution',{}).get('max_parallel_departments','n/a')}`")
    lines.append(f"- Orchestrator: `{plan.get('orchestrator',{}).get('id','swarm-orchestrator')}`")
    lines.append("")
    lines.append("## Parallel Waves")

    for idx, wave in enumerate(waves, start=1):
        lines.append("")
        lines.append(f"### Wave {idx}")
        for dep_id in wave:
            d = dept_map[dep_id]
            owner = d.get("owner", dep_id)
            skills = ", ".join(d.get("primary_skills", []))
            outputs = ", ".join(d.get("outputs", []))
            dep_deps = ", ".join(DEFAULT_DEPS.get(dep_id, [])) or "none"
            lines.append(f"- `{dep_id}` ({owner})")
            lines.append(f"  deps: {dep_deps}")
            lines.append(f"  primary skills: {skills}")
            lines.append(f"  deliverables: {outputs}")

    lines.append("")
    lines.append("## Weekly Operating Cadence")
    lines.append("- Monday: orchestrator planning + dependency checks")
    lines.append("- Tuesday-Thursday: execution by wave with owner-only rework")
    lines.append("- Friday: integration QA gates + risk review + next-wave planning")
    lines.append("")
    lines.append("## Quality Gates")
    for gate in plan.get("quality_gates", []):
        lines.append(f"- `{gate}`")

    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description="Convert swarm plan into dependency-aware task batches")
    ap.add_argument("--plan", required=True, help="Path to swarm plan JSON")
    ap.add_argument("--out-dir", required=True, help="Output directory for task artifacts")
    args = ap.parse_args()

    plan = json.loads(Path(args.plan).read_text(encoding="utf-8"))
    departments = plan.get("departments", [])
    ids = [d["id"] for d in departments]
    dept_map = {d["id"]: d for d in departments}

    waves = topo_waves(ids, DEFAULT_DEPS)

    queue = {
        "project": plan.get("project"),
        "mode": plan.get("mode"),
        "waves": [
            {
                "wave": i + 1,
                "departments": [
                    {
                        "id": dep_id,
                        "owner": dept_map[dep_id].get("owner"),
                        "depends_on": [d for d in DEFAULT_DEPS.get(dep_id, []) if d in ids],
                        "deliverables": dept_map[dep_id].get("outputs", []),
                        "primary_skills": dept_map[dep_id].get("primary_skills", []),
                    }
                    for dep_id in wave
                ],
            }
            for i, wave in enumerate(waves)
        ],
    }

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    json_out = out_dir / "task-batches.json"
    md_out = out_dir / "task-batches.md"

    json_out.write_text(json.dumps(queue, indent=2), encoding="utf-8")
    md_out.write_text(build_md(plan, waves, dept_map), encoding="utf-8")

    print(f"json={json_out}")
    print(f"markdown={md_out}")
    print(f"waves={len(waves)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
