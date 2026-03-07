#!/usr/bin/env python3
"""Extract checkbox tasks from markdown notes and create a weekly rollup."""

import argparse
import re
from pathlib import Path

TASK_RE = re.compile(r"^\s*-\s*\[( |x|X)\]\s+(.*)$")


def collect_tasks(root: Path):
    tasks = []
    for p in root.rglob("*.md"):
        try:
            for line in p.read_text(errors="ignore").splitlines():
                m = TASK_RE.match(line)
                if m:
                    done = m.group(1).lower() == "x"
                    tasks.append((str(p), done, m.group(2).strip()))
        except Exception:
            continue
    return tasks


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    tasks = collect_tasks(Path(args.root))
    open_tasks = [t for t in tasks if not t[1]]

    lines = ["# Weekly Task Rollup", "", f"Open tasks: {len(open_tasks)}", ""]
    for src, _, text in open_tasks:
        lines.append(f"- [ ] {text} ({src})")

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote rollup: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
