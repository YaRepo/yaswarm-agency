#!/usr/bin/env python3
"""Analyze playtest CSV and produce card-level balance report."""

import argparse
import csv
from collections import defaultdict
from pathlib import Path


MIN_SAMPLE = 8


def split_cards(s: str):
    if not s:
        return []
    return [x.strip() for x in s.split("|") if x.strip()]


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="Playtest CSV")
    p.add_argument("--out", required=True, help="Markdown report")
    args = p.parse_args()

    stats = defaultdict(lambda: {"appear": 0, "wins": 0})
    total_matches = 0

    with open(args.input, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            total_matches += 1
            wc = split_cards(row.get("winner_cards", ""))
            lc = split_cards(row.get("loser_cards", ""))
            for c in wc:
                stats[c]["appear"] += 1
                stats[c]["wins"] += 1
            for c in lc:
                stats[c]["appear"] += 1

    lines = ["# Playtest Analysis", "", f"Matches analyzed: {total_matches}", "", "## Card Metrics"]

    rows = []
    for card, s in stats.items():
        a = s["appear"]
        w = s["wins"]
        wr = (w / a * 100.0) if a else 0.0
        rows.append((card, a, w, wr))

    rows.sort(key=lambda x: (-x[3], -x[1], x[0]))
    for card, a, w, wr in rows:
        lines.append(f"- {card}: appear={a}, wins={w}, win_rate={wr:.1f}%")

    lines.extend(["", "## Patch Candidates"])
    found = False
    for card, a, _, wr in rows:
        if a >= MIN_SAMPLE and wr >= 65.0:
            lines.append(f"- {card} (overperforming): consider +1 cost or narrower trigger timing.")
            found = True
        elif a >= MIN_SAMPLE and wr <= 35.0:
            lines.append(f"- {card} (underperforming): consider -1 cost or minor stat/effect buff.")
            found = True
    if not found:
        lines.append("- No high-confidence patch candidates at current sample size.")

    lines.extend(["", "## Next Tests", "- Re-test flagged cards in mirror and counter-matchups.", "- Track changes with card version tags (e.g., v0.2 -> v0.3)."])

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote playtest report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
