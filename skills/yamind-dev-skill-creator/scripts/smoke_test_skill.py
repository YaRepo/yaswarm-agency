#!/usr/bin/env python3
"""Smoke tests for generated skills.

Goal: ensure a skill has a runnable prompt surface and output-contract compliance.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

SEVERITY_DEDUCTION = {
    "critical": 30,
    "high": 15,
    "medium": 8,
    "low": 3,
}


def _issue(report: dict, severity: str, message: str) -> None:
    report["issues"].append({"severity": severity, "message": message})
    report["score"] = max(0, report["score"] - SEVERITY_DEDUCTION[severity])


def _extract_section(body: str, heading: str) -> str:
    h = re.search(rf"^##\s+{re.escape(heading)}\s*$", body, re.MULTILINE)
    if not h:
        return ""
    start = h.end()
    rest = body[start:]
    nxt = re.search(r"^##\s+", rest, re.MULTILINE)
    end = start + nxt.start() if nxt else len(body)
    return body[start:end].strip()


def run_smoke_test(skill_path: str | Path, min_score: int = 90) -> dict:
    path = Path(skill_path)
    report = {
        "skill_path": str(path.resolve()),
        "score": 100,
        "min_score": min_score,
        "pass": False,
        "issues": [],
    }

    skill_md = path / "SKILL.md"
    agent_yaml = path / "agents" / "openai.yaml"

    if not skill_md.exists():
        _issue(report, "critical", "SKILL.md missing")
        report["pass"] = False
        return report

    content = skill_md.read_text(encoding="utf-8", errors="replace")

    # Verify prompt trigger surface
    if not re.search(r"^##\s+Use This Skill When\s*$", content, re.MULTILINE):
        _issue(report, "high", "Missing 'Use This Skill When' section")
    if "Use when" not in content and "use when" not in content:
        _issue(report, "high", "Missing explicit trigger phrasing ('Use when')")

    # Verify workflow exists
    if not re.search(r"^##\s+Workflow\s*$", content, re.MULTILINE):
        _issue(report, "high", "Missing 'Workflow' section")

    # Verify output contract structure
    output_contract = _extract_section(content, "Output Contract")
    if not output_contract:
        _issue(report, "critical", "Missing 'Output Contract' section")
    else:
        items = len(re.findall(r"^\s*\d+\.\s+", output_contract, re.MULTILINE))
        if items < 4:
            _issue(report, "high", "Output Contract must contain at least 4 numbered items")

    # Verify agent prompt exists and is usable
    if not agent_yaml.exists():
        _issue(report, "high", "Missing agents/openai.yaml")
    else:
        agent_text = agent_yaml.read_text(encoding="utf-8", errors="replace")
        m = re.search(r"^default_prompt:\s*(.+)$", agent_text, re.MULTILINE)
        if not m:
            _issue(report, "high", "openai.yaml missing default_prompt")
        else:
            prompt = m.group(1).strip().strip('"').strip("'")
            if len(prompt) < 20:
                _issue(report, "medium", "default_prompt is too short for reliable triggering")
            skill_name = path.name
            if skill_name not in prompt and f"${skill_name}" not in prompt:
                _issue(report, "medium", "default_prompt should reference the target skill name")

    report["pass"] = report["score"] >= min_score and not any(
        i["severity"] in {"critical", "high"} for i in report["issues"]
    )
    return report


def main() -> int:
    ap = argparse.ArgumentParser(description="Smoke-test a skill for prompt and output-contract compliance")
    ap.add_argument("skill_directory")
    ap.add_argument("--min-score", type=int, default=90)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    report = run_smoke_test(args.skill_directory, min_score=args.min_score)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        status = "PASS" if report["pass"] else "FAIL"
        print(f"{status}: smoke score={report['score']}/{100} (min {report['min_score']})")
        for issue in report["issues"]:
            print(f"- [{issue['severity']}] {issue['message']}")

    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
