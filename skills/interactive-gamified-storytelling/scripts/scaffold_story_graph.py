#!/usr/bin/env python3
"""Create a starter interactive story graph JSON."""

import argparse
import json
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--title", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    graph = {
        "title": args.title,
        "start_node": "N001",
        "variables": {"trust": 0, "fear": 0},
        "nodes": [
            {
                "id": "N001",
                "text": "You wake in a silent corridor with two doors.",
                "choices": [
                    {"label": "Open the red door", "to": "N002", "effects": {"fear": 1}},
                    {"label": "Open the blue door", "to": "N003", "effects": {"trust": 1}},
                ],
            },
            {"id": "N002", "text": "A recorder whispers your name.", "choices": []},
            {"id": "N003", "text": "A child offers a map.", "choices": []},
        ],
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(graph, indent=2))
    print(f"Wrote story graph scaffold: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
