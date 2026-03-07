#!/usr/bin/env python3
"""Classify plain-text notes and recommend routing.

This is a lightweight heuristic router to support preview-first note intake.
"""

import argparse
import json
from pathlib import Path

RULES = [
    ("finance", "YaMac - Finance", ["budget", "invoice", "expense", "money", "bank"]),
    ("task", "YaMac - Tasks", ["todo", "to do", "follow up", "remind", "deadline"]),
    ("journal", "YaMac - Journal", ["today", "felt", "journal", "reflection"]),
    ("project", "YaMac - Projects", ["milestone", "deliverable", "scope", "timeline"]),
    ("idea", "YaMac - Ideas", ["idea", "concept", "what if", "brainstorm"]),
]


def classify(text: str):
    lower = text.lower()
    for note_type, folder, keys in RULES:
        if any(k in lower for k in keys):
            return note_type, folder
    return "reference", "YaMac - Knowledge"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Text file with one raw note")
    parser.add_argument("--out", required=True, help="Output JSON file")
    args = parser.parse_args()

    raw = Path(args.input).read_text(errors="ignore").strip()
    note_type, folder = classify(raw)

    title = raw.splitlines()[0][:80] if raw else "Untitled"
    summary = (raw[:200] + "...") if len(raw) > 200 else raw

    result = {
        "title": title or "Untitled",
        "type": note_type,
        "suggested_folder": folder,
        "tags": [f"type:{note_type}", "status:inbox"],
        "summary": summary,
        "duplicate_candidates": [],
    }
    Path(args.out).write_text(json.dumps(result, indent=2))
    print(f"Wrote routing recommendation: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
