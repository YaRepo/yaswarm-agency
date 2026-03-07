#!/usr/bin/env python3
"""Build a publish queue markdown from JSON items."""

import argparse
import json
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    items = json.loads(Path(args.input).read_text())
    lines = [
        "# Publishing Queue",
        "",
        "| Date | Channel | Title | Status |",
        "|---|---|---|---|",
    ]
    for it in items:
        lines.append(
            f"| {it.get('date','')} | {it.get('channel','')} | {it.get('title','')} | {it.get('status','draft')} |"
        )

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote publishing queue: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
