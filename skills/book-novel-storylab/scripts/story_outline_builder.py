#!/usr/bin/env python3
"""Build chapter outline markdown from JSON story config."""

import argparse
import json
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    d = json.loads(Path(args.input).read_text())
    title = d.get("title", "Untitled Story")
    chapters = int(d.get("chapters", 10))
    premise = d.get("premise", "")

    lines = [f"# {title}", "", "## Premise", premise or "TBD", "", "## Chapter Outline"]
    for i in range(1, chapters + 1):
        lines.append(f"- Chapter {i}: Goal, conflict, outcome")

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote story outline: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
