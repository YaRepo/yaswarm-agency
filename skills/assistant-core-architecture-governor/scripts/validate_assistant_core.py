#!/usr/bin/env python3
"""Validate assistant core architecture compliance.

Checks identity files, memory model, heartbeat, and adapter boundary metadata.
"""

import argparse
from pathlib import Path


CRITICAL_FILES = ["AGENTS.md", "SOUL.md", "USER.md", "MEMORY.md", "HEARTBEAT.md"]


def score_penalty(severity: str) -> int:
    return {"critical": 20, "high": 12, "medium": 6, "low": 3}[severity]


def add_issue(issues, severity, msg):
    issues.append((severity, msg))


def file_nonempty(path: Path) -> bool:
    if not path.exists():
        return False
    text = path.read_text(errors="ignore").strip()
    return bool(text and text not in {"# HEARTBEAT", "# HEARTBEAT.md"})


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True, help="Workspace root")
    p.add_argument("--out", required=True, help="Report markdown path")
    args = p.parse_args()

    root = Path(args.root)
    issues = []

    for fname in CRITICAL_FILES:
        fp = root / fname
        if not fp.exists():
            add_issue(issues, "critical", f"Missing required file: {fname}")

    memory_dir = root / "memory"
    if not memory_dir.exists() or not memory_dir.is_dir():
        add_issue(issues, "high", "Missing memory/ directory")
    else:
        daily = sorted(memory_dir.glob("*.md"))
        if not daily:
            add_issue(issues, "medium", "No daily markdown memory logs found in memory/")

    sqlite_candidates = [
        root / "memory" / "memory.sqlite",
        root / "memory" / "index.sqlite",
        root / ".yaswarm" / "memory.sqlite",
    ]
    if not any(p.exists() for p in sqlite_candidates):
        add_issue(issues, "high", "No SQLite memory index found in expected locations")

    hb = root / "HEARTBEAT.md"
    if hb.exists() and not file_nonempty(hb):
        add_issue(issues, "low", "HEARTBEAT.md exists but appears empty/minimal")

    adapters_dir = root / "adapters"
    if not adapters_dir.exists() or not adapters_dir.is_dir():
        add_issue(issues, "medium", "Missing adapters/ directory")
    else:
        manifests = list(adapters_dir.glob("*.json")) + list(adapters_dir.glob("*.yaml")) + list(adapters_dir.glob("*.yml"))
        if not manifests:
            add_issue(issues, "medium", "No adapter manifests found in adapters/")

    score = 100 - sum(score_penalty(s) for s, _ in issues)
    if score < 0:
        score = 0

    lines = ["# Assistant Core Architecture Report", "", f"Compliance score: {score}/100", ""]

    if not issues:
        lines += ["## Findings", "- No issues detected"]
    else:
        lines += ["## Findings"]
        for sev, msg in issues:
            lines.append(f"- [{sev}] {msg}")

    lines += ["", "## Recommended Next Steps", "1. Fix critical file gaps first", "2. Ensure markdown memory + SQLite index both exist", "3. Define heartbeat cadence and actionable checklist", "4. Add adapter manifests with transport and retry policy"]

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote assistant core report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
