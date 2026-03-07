#!/usr/bin/env python3
"""Append daily operational memory, optionally promote stable context, and index in SQLite.

Usage example:
  append_daily_memory.py --root /Users/yascene --entry "Completed poetry-book skill scaffold"
  append_daily_memory.py --root /Users/yascene --entry "Prefers US English for product copy" --promote-stable
"""

import argparse
import sqlite3
from datetime import datetime
from pathlib import Path


MEMORY_TEMPLATE = """# MEMORY

## Stable Context
- 

## Current Focus
- 

## Memory Policy
- Append daily operational notes to `memory/YYYY-MM-DD.md`.
- Keep this file for long-term stable context only.
"""


def ensure_memory_md(path: Path) -> None:
    if not path.exists():
        path.write_text(MEMORY_TEMPLATE)


def ensure_daily_log(path: Path, date_str: str) -> None:
    if not path.exists():
        path.write_text(f"# {date_str}\n\n")


def append_daily_entry(path: Path, timestamp: str, entry: str, tag: str) -> str:
    prefix = f"[{tag}] " if tag else ""
    line = f"- {timestamp} - {prefix}{entry}".rstrip()
    text = path.read_text(errors="ignore")
    if not text.endswith("\n"):
        text += "\n"
    text += line + "\n"
    path.write_text(text)
    return line


def promote_stable(memory_path: Path, entry: str) -> bool:
    text = memory_path.read_text(errors="ignore")
    marker = "## Stable Context\n"
    if marker not in text:
        text += "\n## Stable Context\n"

    idx = text.find(marker)
    next_idx = text.find("\n## ", idx + len(marker))
    if next_idx == -1:
        stable_block = text[idx + len(marker) :]
        rest = ""
    else:
        stable_block = text[idx + len(marker) : next_idx]
        rest = text[next_idx:]

    bullet = f"- {entry}"
    if bullet in stable_block:
        return False

    stable_block = stable_block.rstrip("\n")
    if stable_block.strip():
        stable_block += "\n"
    stable_block += bullet + "\n"

    new_text = text[: idx + len(marker)] + stable_block + rest
    memory_path.write_text(new_text)
    return True


def index_entry(db_path: Path, note_path: str, summary: str) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    try:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS memory_index (id INTEGER PRIMARY KEY, note_path TEXT NOT NULL, summary TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);"
        )
        conn.execute(
            "INSERT INTO memory_index (note_path, summary) VALUES (?, ?)",
            (note_path, summary),
        )
        conn.commit()
    finally:
        conn.close()


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True, help="Workspace root")
    p.add_argument("--entry", required=True, help="Daily memory entry text")
    p.add_argument("--tag", default="", help="Optional entry tag")
    p.add_argument("--promote-stable", action="store_true", help="Also add entry to MEMORY.md stable context")
    p.add_argument("--date", default="", help="Override date (YYYY-MM-DD) for backfill/testing")
    p.add_argument("--no-index", action="store_true", help="Skip SQLite indexing")
    args = p.parse_args()

    root = Path(args.root)
    memory_md = root / "MEMORY.md"
    memory_dir = root / "memory"
    memory_dir.mkdir(parents=True, exist_ok=True)

    now = datetime.now()
    date_str = args.date.strip() or now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M")

    daily = memory_dir / f"{date_str}.md"

    ensure_memory_md(memory_md)
    ensure_daily_log(daily, date_str)
    line = append_daily_entry(daily, time_str, args.entry.strip(), args.tag.strip())

    promoted = False
    if args.promote_stable:
        promoted = promote_stable(memory_md, args.entry.strip())

    if not args.no_index:
        db_path = memory_dir / "memory.sqlite"
        index_entry(db_path, str(daily), line)

    print(f"Appended daily entry: {daily}")
    if args.promote_stable:
        if promoted:
            print("Promoted to MEMORY.md stable context")
        else:
            print("Stable context already contained this entry")
    if not args.no_index:
        print(f"Indexed entry in SQLite: {memory_dir / 'memory.sqlite'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
