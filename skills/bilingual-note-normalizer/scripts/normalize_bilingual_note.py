#!/usr/bin/env python3
"""Heuristic normalizer for mixed-language notes (preview mode)."""

import argparse
import json
from pathlib import Path

ARABIC_RANGE = tuple(range(0x0600, 0x0700))


def has_arabic(text: str) -> bool:
    return any(ord(ch) in ARABIC_RANGE for ch in text)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    raw = Path(args.input).read_text(errors="ignore").strip()
    is_ar = has_arabic(raw)
    words = [w for w in raw.replace("\n", " ").split(" ") if w]
    title = " ".join(words[:10]) if words else "Untitled"
    result = {
        "original": raw,
        "language_mix": "ar-en" if is_ar else "en",
        "normalized_title": title,
        "summary": (raw[:220] + "...") if len(raw) > 220 else raw,
        "tags": ["lang:ar-en" if is_ar else "lang:en", "status:normalized-preview"],
        "ambiguities": [],
    }
    Path(args.out).write_text(json.dumps(result, indent=2, ensure_ascii=False))
    print(f"Wrote normalized note preview: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
