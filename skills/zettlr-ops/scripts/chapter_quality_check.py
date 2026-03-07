#!/usr/bin/env python3
"""Run lightweight quality checks on chapter markdown files."""

import argparse
import re
from pathlib import Path


def score_file(text: str, mode: str, min_words: int):
    issues = []
    if not re.search(r"(?m)^#\s+Chapter\b", text):
        issues.append("missing chapter heading")
    if len(text.split()) < min_words:
        issues.append(f"very short draft (<{min_words} words)")

    # Template mode expects drafting scaffolding.
    if mode == "template":
        if "## Goal" not in text:
            issues.append("missing goal section")
        if "## Open Questions" not in text:
            issues.append("missing open questions section")
    # Publication mode expects clean-reader chapter files.
    else:
        if "## Goal" in text:
            issues.append("contains draft scaffolding: goal section")
        if "## Open Questions" in text:
            issues.append("contains draft scaffolding: open questions section")
        if re.search(r"(?im)^\s*-\s*(todo|tbd|placeholder)\b", text):
            issues.append("contains unresolved placeholder/todo bullets")

    if "***" not in text:
        issues.append("no scene break marker (***)")
    return issues


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--chapters-dir", required=True)
    p.add_argument("--out", required=True)
    p.add_argument(
        "--mode",
        choices=["publication", "template"],
        default="publication",
        help="Validation profile to use (default: publication).",
    )
    p.add_argument(
        "--min-words",
        type=int,
        default=120,
        help="Minimum words required per chapter (default: 120).",
    )
    args = p.parse_args()

    d = Path(args.chapters_dir)
    files = sorted(d.glob("chapter-*.md"))

    lines = ["# Chapter Quality Report", "", f"Chapters scanned: {len(files)}", ""]
    lines.append(f"Mode: {args.mode}")
    lines.append(f"Minimum words: {args.min_words}")
    lines.append("")
    total_issues = 0

    for f in files:
        text = f.read_text(errors="ignore")
        issues = score_file(text, mode=args.mode, min_words=args.min_words)
        total_issues += len(issues)
        lines.append(f"## {f.name}")
        if issues:
            for i in issues:
                lines.append(f"- [issue] {i}")
        else:
            lines.append("- OK")
        lines.append("")

    lines.append(f"Total issues: {total_issues}")
    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
