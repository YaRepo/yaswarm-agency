#!/usr/bin/env python3
"""Build a project storyboard markdown from JSON rows."""

import argparse
import json
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="JSON array of project rows")
    p.add_argument("--out", required=True)
    args = p.parse_args()

    rows = json.loads(Path(args.input).read_text())
    lines = [
        "# Project Status Storyboard",
        "",
        "| Project | Now | Next | Blockers | Owner | Target Date | Risk |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in rows:
        lines.append(
            "| {project} | {now} | {next} | {blockers} | {owner} | {date} | {risk} |".format(
                project=r.get("project", ""),
                now=r.get("now", ""),
                next=r.get("next", ""),
                blockers=r.get("blockers", ""),
                owner=r.get("owner", ""),
                date=r.get("target_date", ""),
                risk=r.get("risk", ""),
            )
        )
    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote storyboard: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
