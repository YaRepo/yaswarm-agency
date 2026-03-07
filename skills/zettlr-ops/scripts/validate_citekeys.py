#!/usr/bin/env python3
"""Validate citekeys used in markdown against references.json."""

import argparse
import json
import re
from pathlib import Path

CITE_RE = re.compile(r"@([A-Za-z0-9_.:-]+)")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--workspace", required=True)
    p.add_argument("--refs", default="references.json")
    p.add_argument("--out", required=True)
    args = p.parse_args()

    root = Path(args.workspace)
    refs_path = root / args.refs
    if not refs_path.exists():
        Path(args.out).write_text("# Citekey Validation\n\n- [error] references file not found\n")
        print(f"Wrote report: {args.out}")
        return 0

    refs = json.loads(refs_path.read_text())
    valid = {r.get("id") for r in refs if isinstance(r, dict) and r.get("id")}

    used = {}
    for f in root.rglob("*.md"):
        text = f.read_text(errors="ignore")
        keys = CITE_RE.findall(text)
        if keys:
            used[str(f.relative_to(root))] = keys

    missing = []
    for file, keys in used.items():
        for k in keys:
            if k not in valid:
                missing.append((file, k))

    lines = ["# Citekey Validation", "", f"Valid refs: {len(valid)}", f"Files with cites: {len(used)}", ""]
    if missing:
        lines.append("## Missing Citekeys")
        for file, k in missing:
            lines.append(f"- {file}: @{k}")
    else:
        lines.extend(["## Missing Citekeys", "- none"])

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
