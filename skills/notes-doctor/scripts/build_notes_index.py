#!/usr/bin/env python3
import argparse
import json
import re
from datetime import datetime
from pathlib import Path


def summarize(text: str, n: int = 220) -> str:
    s = " ".join(text.split())
    return s[:n] + ("..." if len(s) > n else "")


def count_words(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text, flags=re.UNICODE))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    root = Path(args.root)
    entries = []

    for f in sorted(root.rglob("*")):
        if f.suffix.lower() not in {".md", ".txt", ".rtf"}:
            continue
        try:
            txt = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        stat = f.stat()
        lines = txt.splitlines()
        title = lines[0].strip("# ").strip() if lines else f.stem

        entries.append({
            "path": str(f),
            "title": title,
            "summary": summarize(txt),
            "updated_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "bytes": stat.st_size,
            "lines": len(lines),
            "words": count_words(txt),
        })

    payload = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "root": str(root),
        "count": len(entries),
        "notes": entries,
    }

    Path(args.out).write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(args.out)

if __name__ == "__main__":
    main()
