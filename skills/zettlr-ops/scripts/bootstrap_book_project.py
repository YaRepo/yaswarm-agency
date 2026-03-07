#!/usr/bin/env python3
"""Bootstrap a book project structure inside a Zettlr workspace."""

import argparse
from pathlib import Path


def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text(content)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--workspace", required=True)
    p.add_argument("--book-id", default="book-01")
    p.add_argument("--title", default="Untitled Book")
    p.add_argument("--chapters", type=int, default=10)
    args = p.parse_args()

    root = Path(args.workspace)
    base = root / "manuscripts" / args.book_id

    for d in ["00-META", "01-OUTLINE", "02-DRAFTS", "03-REVISIONS", "04-EXPORT"]:
        (base / d).mkdir(parents=True, exist_ok=True)

    write(base / "00-META" / "PROJECT.md", f"# Project\n\n## Working Title\n{args.title}\n\n## Premise\nTBD\n")
    write(base / "00-META" / "CHARACTER_BIBLE.md", "# Character Bible\n\n## Protagonist\n- Name:\n- Arc:\n")
    write(base / "00-META" / "TIMELINE.md", "# Timeline\n\n- Day 1:\n")
    write(base / "01-OUTLINE" / "MASTER_OUTLINE.md", "# Master Outline\n\n## Act I\n-\n\n## Act II\n-\n\n## Act III\n-\n")

    for i in range(1, args.chapters + 1):
        c = base / "02-DRAFTS" / f"chapter-{i:03}.md"
        write(c, f"# Chapter {i}\n\n## Goal\n\n## Scene\n\n## Open Questions\n-\n")

    print(f"Bootstrapped: {base}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
