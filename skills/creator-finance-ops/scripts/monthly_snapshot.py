#!/usr/bin/env python3
"""Create a monthly cashflow snapshot from CSV ledger data."""

import argparse
import csv
from collections import defaultdict
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--ledger", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    totals = defaultdict(float)
    with open(args.ledger, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            key = (row.get("date", "")[:7], row.get("type", "unknown"))
            try:
                amt = float(row.get("amount", "0") or "0")
            except ValueError:
                amt = 0.0
            totals[key] += amt

    lines = ["# Monthly Snapshot", ""]
    months = sorted({m for m, _ in totals})
    for m in months:
        inc = totals.get((m, "income"), 0.0)
        exp = totals.get((m, "expense"), 0.0)
        net = inc - exp
        lines.append(f"- {m}: income={inc:.2f}, expense={exp:.2f}, net={net:.2f}")

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote monthly snapshot: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
