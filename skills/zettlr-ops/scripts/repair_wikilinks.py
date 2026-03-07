#!/usr/bin/env python3
"""Repair broken wikilinks by matching file stems in a workspace."""

import argparse
import re
from pathlib import Path

WIKI_RE = re.compile(r"\[\[([^\]]+)\]\]")


def normalize(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--workspace", required=True)
    p.add_argument("--apply", action="store_true")
    p.add_argument("--out", required=True)
    args = p.parse_args()

    root = Path(args.workspace)
    stems = {f.stem: f for f in root.rglob("*.md")}
    by_norm = {normalize(k): k for k in stems.keys()}

    changes = []
    for f in root.rglob("*.md"):
        text = f.read_text(errors="ignore")
        new_text = text
        for target in WIKI_RE.findall(text):
            if target in stems:
                continue
            n = normalize(target)
            if n in by_norm:
                fixed = by_norm[n]
                new_text = new_text.replace(f"[[{target}]]", f"[[{fixed}]]")
                changes.append((str(f.relative_to(root)), target, fixed))
        if args.apply and new_text != text:
            f.write_text(new_text)

    lines = ["# Wikilink Repair", "", f"Changes suggested: {len(changes)}", f"Mode: {'apply' if args.apply else 'dry-run'}", ""]
    for file, old, new in changes:
        lines.append(f"- {file}: [[{old}]] -> [[{new}]]")
    if not changes:
        lines.append("- no broken wikilinks auto-matched")

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
