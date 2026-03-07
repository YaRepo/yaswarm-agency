#!/usr/bin/env python3
"""Strict validator for Codex skills.

Maintains backward compatibility with the old API:
    validate_skill(path) -> (bool, message)

Adds a detailed report mode and score gating.
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

REQUIRED_FRONTMATTER_KEYS = ("name", "description")
REQUIRED_SECTIONS = (
    "Use This Skill When",
    "Workflow",
    "Safety Rules",
    "Output Contract",
)
OUTPUT_CONTRACT_MIN_ITEMS = 4
DESCRIPTION_HARD_MAX = 1024
DESCRIPTION_SOFT_MAX = 280


def _issue(report: dict, severity: str, message: str) -> None:
    report["issues"].append({"severity": severity, "message": message})
    report["score"] = max(0, report["score"] - SEVERITY_DEDUCTION[severity])


def _parse_frontmatter(content: str) -> tuple[dict[str, str], str] | tuple[None, str]:
    if not content.startswith("---\n"):
        return None, content
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", content, re.DOTALL)
    if not m:
        return None, content
    fm_text, body = m.group(1), m.group(2)

    frontmatter: dict[str, str] = {}
    for line in fm_text.splitlines():
        lm = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if not lm:
            continue
        key = lm.group(1).strip()
        val = lm.group(2).strip().strip('"').strip("'")
        frontmatter[key] = val
    return frontmatter, body


def _extract_section(body: str, heading: str) -> str:
    h = re.search(rf"^##\s+{re.escape(heading)}\s*$", body, re.MULTILINE)
    if not h:
        return ""
    start = h.end()
    rest = body[start:]
    nxt = re.search(r"^##\s+", rest, re.MULTILINE)
    end = start + nxt.start() if nxt else len(body)
    return body[start:end].strip()


def validate_skill_detailed(skill_path: str | Path, min_score: int = 95) -> dict:
    path = Path(skill_path)
    report = {
        "skill_path": str(path.resolve()),
        "score": 100,
        "min_score": min_score,
        "pass": False,
        "issues": [],
    }

    if not path.exists() or not path.is_dir():
        _issue(report, "critical", "Skill directory not found")
        report["pass"] = False
        return report

    skill_md = path / "SKILL.md"
    if not skill_md.exists():
        _issue(report, "critical", "SKILL.md not found")
        report["pass"] = False
        return report

    content = skill_md.read_text(encoding="utf-8", errors="replace")
    frontmatter, body = _parse_frontmatter(content)

    if frontmatter is None:
        _issue(report, "critical", "Invalid or missing YAML frontmatter")
        frontmatter = {}
        body = content

    for key in REQUIRED_FRONTMATTER_KEYS:
        if not frontmatter.get(key):
            _issue(report, "critical", f"Missing frontmatter key: {key}")

    name = frontmatter.get("name", "")
    if name:
        if not re.match(r"^[a-z0-9-]+$", name):
            _issue(report, "high", "Frontmatter 'name' must be hyphen-case")
        if name.startswith("-") or name.endswith("-") or "--" in name:
            _issue(report, "high", "Frontmatter 'name' has invalid hyphen structure")

    desc = frontmatter.get("description", "")
    if desc:
        if len(desc) > DESCRIPTION_HARD_MAX:
            _issue(report, "critical", f"Description exceeds {DESCRIPTION_HARD_MAX} chars (runtime risk)")
        elif len(desc) > DESCRIPTION_SOFT_MAX:
            _issue(report, "medium", f"Description is verbose ({len(desc)} chars); trim for better routing")
        if "<" in desc or ">" in desc:
            _issue(report, "high", "Description must not contain angle brackets")

    for section in REQUIRED_SECTIONS:
        if not re.search(rf"^##\s+{re.escape(section)}\s*$", body, re.MULTILINE):
            _issue(report, "high", f"Missing required section: {section}")

    if "Use when" not in content and "use when" not in content:
        _issue(report, "high", "Trigger phrasing missing ('Use when')")

    output_contract = _extract_section(body, "Output Contract")
    if output_contract:
        items = len(re.findall(r"^\s*\d+\.\s+", output_contract, re.MULTILINE))
        if items < OUTPUT_CONTRACT_MIN_ITEMS:
            _issue(report, "medium", f"Output Contract should have >= {OUTPUT_CONTRACT_MIN_ITEMS} numbered items")

    if re.search(r"\bTODO\b|\bTBD\b|\[TODO", content):
        _issue(report, "medium", "Found placeholder markers (TODO/TBD)")

    agent_yaml = path / "agents" / "openai.yaml"
    if not agent_yaml.exists():
        _issue(report, "high", "Missing agents/openai.yaml")
    else:
        agent_text = agent_yaml.read_text(encoding="utf-8", errors="replace")
        for key in ("display_name:", "short_description:", "default_prompt:"):
            if key not in agent_text:
                _issue(report, "high", f"agents/openai.yaml missing key: {key[:-1]}")

    scripts_dir = path / "scripts"
    if scripts_dir.exists():
        for script in scripts_dir.iterdir():
            if not script.is_file() or script.suffix not in {".py", ".sh"}:
                continue
            if script.stat().st_mode & 0o111 == 0:
                _issue(report, "medium", f"Script not executable: {script.name}")

    report["pass"] = report["score"] >= min_score and not any(
        i["severity"] in {"critical", "high"} for i in report["issues"]
    )
    return report


def validate_skill(skill_path: str | Path, min_score: int = 95) -> tuple[bool, str]:
    """Backward-compatible validation API used by package_skill.py."""
    report = validate_skill_detailed(skill_path, min_score=min_score)
    status = "PASS" if report["pass"] else "FAIL"
    if report["issues"]:
        top = "; ".join(f"[{i['severity']}] {i['message']}" for i in report["issues"][:3])
        msg = f"{status}: score={report['score']}/{100} (min {report['min_score']}) | {top}"
    else:
        msg = f"{status}: score={report['score']}/{100} (min {report['min_score']}) | no issues"
    return report["pass"], msg


def main() -> int:
    ap = argparse.ArgumentParser(description="Strict skill validator with score gating")
    ap.add_argument("skill_directory")
    ap.add_argument("--min-score", type=int, default=95)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    report = validate_skill_detailed(args.skill_directory, min_score=args.min_score)
    ok, msg = validate_skill(args.skill_directory, min_score=args.min_score)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(msg)
        if report["issues"]:
            print("Issues:")
            for issue in report["issues"]:
                print(f"- [{issue['severity']}] {issue['message']}")

    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
