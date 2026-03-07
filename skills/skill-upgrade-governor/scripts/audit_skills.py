#!/usr/bin/env python3
"""Audit installed skills and produce a prioritized weakness report.

Scoring starts at 100 per skill and deducts points by issue severity.
"""

import argparse
import re
from pathlib import Path


REQUIRED_FRONTMATTER_KEYS = ("name:", "description:")


def has_frontmatter(text: str) -> bool:
    return text.startswith("---\n") and "\n---\n" in text[4:]


def extract_frontmatter(text: str) -> str:
    m = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    return m.group(1) if m else ""


def audit_skill_dir(skill_dir: Path):
    issues = []
    score = 100

    skill_md = skill_dir / "SKILL.md"
    openai_yaml = skill_dir / "agents" / "openai.yaml"

    if not skill_md.exists():
        issues.append(("critical", "Missing SKILL.md"))
        return 0, issues

    text = skill_md.read_text(errors="ignore")

    if not has_frontmatter(text):
        issues.append(("critical", "Invalid or missing frontmatter block"))
        score -= 40
    else:
        fm = extract_frontmatter(text)
        for k in REQUIRED_FRONTMATTER_KEYS:
            if k not in fm:
                issues.append(("critical", f"Missing frontmatter key: {k[:-1]}"))
                score -= 25

    if not openai_yaml.exists():
        issues.append(("high", "Missing agents/openai.yaml"))
        score -= 15

    if "Use when" not in text:
        issues.append(("high", "Description/workflow lacks explicit trigger phrasing ('Use when')"))
        score -= 12

    if "## Safety Rules" not in text:
        issues.append(("high", "Missing Safety Rules section"))
        score -= 10

    if "## Output Contract" not in text:
        issues.append(("high", "Missing Output Contract section"))
        score -= 10

    if "TODO" in text or "[TODO" in text:
        issues.append(("medium", "Found TODO placeholders"))
        score -= 8

    # Script checks
    scripts_dir = skill_dir / "scripts"
    if scripts_dir.exists():
        for script in scripts_dir.iterdir():
            if script.is_file() and script.suffix in (".py", ".sh"):
                mode = script.stat().st_mode
                if mode & 0o111 == 0:
                    issues.append(("medium", f"Script not executable: {script.name}"))
                    score -= 4

    # Size hygiene
    line_count = len(text.splitlines())
    if line_count > 500:
        issues.append(("low", f"SKILL.md is large ({line_count} lines); consider progressive disclosure"))
        score -= 3

    score = max(score, 0)
    return score, issues


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True, help="Skills root directory")
    p.add_argument("--out", required=True, help="Output markdown report")
    args = p.parse_args()

    root = Path(args.root)
    skills = sorted([d for d in root.iterdir() if d.is_dir() and not d.name.startswith(".")])

    rows = []
    for d in skills:
        score, issues = audit_skill_dir(d)
        rows.append((d.name, score, issues))

    rows.sort(key=lambda x: x[1])

    lines = ["# Skill Audit Report", "", f"Skills audited: {len(rows)}", "", "## Scoreboard"]
    for name, score, _ in rows:
        lines.append(f"- {name}: {score}/100")

    lines.extend(["", "## Findings"])
    for name, score, issues in rows:
        if not issues:
            lines.append(f"- {name}: no issues detected")
            continue
        lines.append(f"- {name} ({score}/100):")
        for sev, msg in issues:
            lines.append(f"  - [{sev}] {msg}")

    lines.extend(["", "## Priority Fix Plan", "1. Fix all critical issues", "2. Fix high-severity trigger/safety/output gaps", "3. Remove TODO placeholders and tighten scripts", "4. Re-run audit and compare scores"])

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote skill audit report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
