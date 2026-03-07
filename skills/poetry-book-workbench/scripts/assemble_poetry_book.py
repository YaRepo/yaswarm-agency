#!/usr/bin/env python3
"""Assemble multiple poem text files into one manuscript markdown file."""

import argparse
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--title", required=True)
    p.add_argument("--author", default="")
    p.add_argument("--input-dir", required=True, help="Directory containing .txt/.md poem files")
    p.add_argument("--out", required=True)
    args = p.parse_args()

    root = Path(args.input_dir)
    files = sorted([x for x in root.iterdir() if x.is_file() and x.suffix.lower() in {".txt", ".md"}])

    lines = [f"# {args.title}", ""]
    if args.author:
        lines += [f"Author: {args.author}", ""]

    lines += ["## Table of Contents"]
    for i, f in enumerate(files, 1):
        poem_title = f.stem.replace("_", " ").strip() or f"Poem {i}"
        lines.append(f"{i}. {poem_title}")

    for i, f in enumerate(files, 1):
        poem_title = f.stem.replace("_", " ").strip() or f"Poem {i}"
        content = f.read_text(errors="ignore").strip()
        lines += ["", f"## {i}. {poem_title}", "", content or "[Empty poem draft]"]

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote poetry manuscript: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
