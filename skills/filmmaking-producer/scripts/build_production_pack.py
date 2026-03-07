#!/usr/bin/env python3
"""Build a simple production pack markdown from a JSON note payload.

Input JSON format:
{
  "title": "Project",
  "premise": "...",
  "beats": ["..."],
  "scenes": ["..."]
}
"""

import argparse
import json
from pathlib import Path


def build(payload: dict) -> str:
    title = payload.get("title", "Untitled Project")
    premise = payload.get("premise", "")
    beats = payload.get("beats", [])
    scenes = payload.get("scenes", [])

    lines = [f"# {title}", "", "## Premise", premise or "TBD", "", "## Beat Sheet"]
    if beats:
        lines.extend([f"- {b}" for b in beats])
    else:
        lines.append("- TBD")

    lines.extend(["", "## Scene Breakdown"])
    if scenes:
        lines.extend([f"- {s}" for s in scenes])
    else:
        lines.append("- TBD")

    lines.extend(["", "## Open Risks", "- Budget assumptions not validated", "- Location/permit status unknown"])
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input JSON file")
    parser.add_argument("--out", required=True, help="Output markdown file")
    args = parser.parse_args()

    payload = json.loads(Path(args.input).read_text())
    out = build(payload)
    Path(args.out).write_text(out)
    print(f"Wrote production pack: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
