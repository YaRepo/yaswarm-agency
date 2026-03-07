#!/usr/bin/env python3
"""Build a research digest markdown from JSON input."""

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
        f"# Digest: {d.get('topic', 'Untitled')}",
        "",
        "## Key Insights",
    ]
    lines.extend([f"- {x}" for x in d.get("insights", ["TBD"])])
    lines.extend(["", "## Actions"])
    lines.extend([f"- {x}" for x in d.get("actions", ["TBD"])])
    lines.extend(["", "## Open Questions"])
    lines.extend([f"- {x}" for x in d.get("questions", ["TBD"])])

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote digest: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
