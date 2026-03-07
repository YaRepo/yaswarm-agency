#!/usr/bin/env python3
import argparse
import hashlib
import json
from pathlib import Path
from collections import defaultdict


def norm(s: str) -> str:
    return "\n".join(line.strip() for line in s.lower().splitlines() if line.strip())


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    files = [f for f in Path(args.root).rglob("*") if f.suffix.lower() in {".md", ".txt", ".rtf"}]
    buckets = defaultdict(list)

    for f in files:
        try:
            txt = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        h = hashlib.sha256(norm(txt).encode("utf-8")).hexdigest()
        buckets[h].append(str(f))

    groups = [v for v in buckets.values() if len(v) > 1]
    result = {"duplicate_groups": groups, "group_count": len(groups)}
    Path(args.out).write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(args.out)

if __name__ == "__main__":
    main()
