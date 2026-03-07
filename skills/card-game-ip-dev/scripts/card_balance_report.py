#!/usr/bin/env python3
"""Create a simple balance report from card CSV data."""

import argparse
import csv
from collections import Counter, defaultdict
from pathlib import Path


def to_int(value, default=0):
    try:
        return int(value)
    except Exception:
        return default


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--cards", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    rarity = Counter()
    type_counts = Counter()
    cost_hist = Counter()
    cost_by_type = defaultdict(list)

    with open(args.cards, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            r = (row.get("rarity") or "Unknown").strip()
            t = (row.get("type") or "Unknown").strip()
            c = to_int(row.get("cost"), 0)
            rarity[r] += 1
            type_counts[t] += 1
            cost_hist[c] += 1
            cost_by_type[t].append(c)

    lines = ["# Card Balance Report", "", "## Rarity Distribution"]
    for k, v in rarity.most_common():
        lines.append(f"- {k}: {v}")

    lines.extend(["", "## Type Distribution"])
    for k, v in type_counts.most_common():
        lines.append(f"- {k}: {v}")

    lines.extend(["", "## Cost Curve"])
    for k in sorted(cost_hist):
        lines.append(f"- Cost {k}: {cost_hist[k]}")

    lines.extend(["", "## Flags"])
    for t, vals in cost_by_type.items():
        if vals:
            avg = sum(vals) / len(vals)
            if avg < 1.2 and len(vals) >= 5:
                lines.append(f"- {t}: very low average cost ({avg:.2f}); check for early-game pressure.")
            if avg > 5.5 and len(vals) >= 5:
                lines.append(f"- {t}: very high average cost ({avg:.2f}); check playability.")

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote balance report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
