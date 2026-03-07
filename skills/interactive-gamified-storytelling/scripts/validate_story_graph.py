#!/usr/bin/env python3
"""Validate interactive story graph reachability and references."""

import argparse
import json
from collections import deque
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    data = json.loads(Path(args.input).read_text())
    nodes = {n["id"]: n for n in data.get("nodes", []) if "id" in n}
    start = data.get("start_node")

    errors = []
    if start not in nodes:
        errors.append(f"start_node '{start}' not found")

    for nid, node in nodes.items():
        for c in node.get("choices", []):
            to = c.get("to")
            if to not in nodes:
                errors.append(f"node {nid} references missing target {to}")

    reachable = set()
    if start in nodes:
        q = deque([start])
        while q:
            cur = q.popleft()
            if cur in reachable:
                continue
            reachable.add(cur)
            for c in nodes[cur].get("choices", []):
                to = c.get("to")
                if to in nodes and to not in reachable:
                    q.append(to)

    unreachable = sorted(set(nodes.keys()) - reachable)

    lines = ["# Story Graph Validation", ""]
    if errors:
        lines.append("## Errors")
        lines.extend([f"- {e}" for e in errors])
    else:
        lines.append("## Errors")
        lines.append("- none")

    lines.extend(["", "## Reachability", f"- reachable_nodes: {len(reachable)}", f"- total_nodes: {len(nodes)}"])
    lines.append(f"- unreachable_nodes: {', '.join(unreachable) if unreachable else 'none'}")

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote validation report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
