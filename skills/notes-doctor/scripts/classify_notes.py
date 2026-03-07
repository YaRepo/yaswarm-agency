#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

KEYWORDS = {
    "projects": ["project", "milestone", "spec", "roadmap"],
    "tasks": ["todo", "task", "follow up", "deadline", "checklist"],
    "journal": ["today", "felt", "reflection", "journal"],
    "ideas": ["idea", "brainstorm", "concept", "draft"],
    "knowledge": ["reference", "how to", "guide", "notes"],
    "finance": ["budget", "invoice", "bill", "expense", "payment"],
    "health": ["health", "workout", "sleep", "doctor", "nutrition"],
    "personal": ["family", "home", "trip", "personal"],
}

def classify(text: str) -> str:
    lc = text.lower()
    best = ("inbox", 0)
    for category, kws in KEYWORDS.items():
      score = sum(1 for k in kws if k in lc)
      if score > best[1]:
        best = (category, score)
    return best[0]

def tags_for(text: str):
    lc = text.lower()
    tags = []
    if "urgent" in lc or "asap" in lc:
        tags.append("urgent")
    if "waiting" in lc or "blocked" in lc:
        tags.append("waiting")
    if "draft" in lc:
        tags.append("draft")
    if not tags:
        tags.append("needs-review")
    return tags


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    root = Path(args.root)
    files = [f for f in root.rglob("*") if f.suffix.lower() in {".md", ".txt", ".rtf"}]

    with Path(args.out).open("w", encoding="utf-8") as out:
        for f in sorted(files):
            try:
                txt = f.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            rec = {
                "path": str(f),
                "category": classify(txt),
                "tags": tags_for(txt),
                "title": txt.splitlines()[0].strip() if txt.splitlines() else f.stem,
            }
            out.write(json.dumps(rec, ensure_ascii=True) + "\n")

if __name__ == "__main__":
    main()
