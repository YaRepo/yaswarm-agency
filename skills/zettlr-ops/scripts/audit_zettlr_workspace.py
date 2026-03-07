#!/usr/bin/env python3
"""Audit a Zettlr workspace for structure, metadata, and linking hygiene."""

import argparse
import re
from pathlib import Path


def has_frontmatter(text: str) -> bool:
    return text.startswith("---\n") and "\n...\n" in text


def extract_wikilinks(text: str):
    return re.findall(r"\[\[([^\]]+)\]\]", text)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True, help="Zettlr workspace root")
    p.add_argument("--out", required=True, help="Output markdown report")
    args = p.parse_args()

    root = Path(args.root)
    md_files = sorted(root.rglob("*.md"))
    issues = []

    if not md_files:
        issues.append(("high", "No markdown files found"))

    # references detection
    if not (root / "references.json").exists() and not any(root.rglob("*.bib")):
        issues.append(("medium", "No references database found (references.json or .bib)"))

    existing_stems = {f.stem for f in md_files}

    for f in md_files:
        text = f.read_text(errors="ignore")
        rel = f.relative_to(root)

        if not has_frontmatter(text):
            issues.append(("low", f"Missing Zettlr-style frontmatter block: {rel}"))

        if "# " not in text:
            issues.append(("low", f"No H1 heading found: {rel}"))

        for link in extract_wikilinks(text):
            if link not in existing_stems:
                issues.append(("medium", f"Broken wikilink [[{link}]] in {rel}"))

    score = max(100 - len(issues) * 3, 0)

    lines = ["# Zettlr Workspace Audit", "", f"Workspace: {root}", f"Markdown files: {len(md_files)}", f"Score: {score}/100", ""]
    if issues:
        lines.append("## Findings")
        for sev, msg in issues:
            lines.append(f"- [{sev}] {msg}")
    else:
        lines.extend(["## Findings", "- No issues detected"])

    lines.extend(["", "## Next Steps", "1. Fix medium/high issues first", "2. Standardize frontmatter and H1 headings", "3. Re-run audit after changes"])

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote audit report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
