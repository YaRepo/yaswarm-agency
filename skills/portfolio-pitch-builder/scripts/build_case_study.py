#!/usr/bin/env python3
"""Generate a case-study markdown skeleton from JSON facts."""

import argparse
import json
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    d = json.loads(Path(args.input).read_text())
    lines = [
        f"# {d.get('project', 'Untitled Project')}",
        "",
        f"Role: {d.get('role', 'TBD')}",
        "",
        "## Challenge",
        d.get("challenge", "TBD"),
        "",
        "## Approach",
        d.get("approach", "TBD"),
        "",
        "## Deliverables",
        "\n".join([f"- {x}" for x in d.get("deliverables", ["TBD"])]),
        "",
        "## Outcome",
        d.get("outcome", "Not provided"),
    ]
    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote case study draft: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
