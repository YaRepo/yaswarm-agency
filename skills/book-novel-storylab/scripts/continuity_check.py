#!/usr/bin/env python3
"""Basic continuity checker for manuscript text files."""

import argparse
import re
from collections import Counter
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--manuscript", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    text = Path(args.manuscript).read_text(errors="ignore")
    names = re.findall(r"\b[A-Z][a-z]{2,}\b", text)
    c = Counter(names)

    lines = ["# Continuity Check", "", "## Repeated Proper Names"]
    for name, n in c.most_common(20):
        lines.append(f"- {name}: {n}")

    lines.extend(["", "## Manual Checks", "- Timeline consistency", "- POV consistency", "- Location continuity"])
    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote continuity report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
