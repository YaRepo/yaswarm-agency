#!/usr/bin/env python3
"""Generate a starter card-set CSV skeleton."""

import argparse
import csv
from pathlib import Path


FIELDS = [
    "id",
    "name",
    "faction",
    "type",
    "rarity",
    "cost",
    "power",
    "toughness",
    "keywords",
    "effect_text",
    "flavor_text",
    "version",
]


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True)
    p.add_argument("--size", type=int, default=40, help="Number of placeholder rows")
    p.add_argument("--prefix", default="CARD")
    args = p.parse_args()

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        for i in range(1, args.size + 1):
            w.writerow(
                {
                    "id": f"{args.prefix}-{i:03}",
                    "name": f"Placeholder {i}",
                    "faction": "TBD",
                    "type": "Unit",
                    "rarity": "Common",
                    "cost": 1,
                    "power": 1,
                    "toughness": 1,
                    "keywords": "",
                    "effect_text": "",
                    "flavor_text": "",
                    "version": "v0.1",
                }
            )

    print(f"Wrote card set scaffold: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
