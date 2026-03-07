#!/usr/bin/env python3
"""Scaffold a new Zettlr markdown note with tutorial-compatible frontmatter."""

import argparse
from datetime import date
from pathlib import Path


def slugify(name: str) -> str:
    out = []
    for ch in name.strip().lower():
        if ch.isalnum():
            out.append(ch)
        elif ch in {" ", "_", "-"}:
            out.append("-")
    slug = "".join(out).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug or "untitled-note"


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dir", required=True, help="Target directory")
    p.add_argument("--title", required=True)
    p.add_argument("--keywords", default="")
    p.add_argument("--with-id", action="store_true", help="Include an ID line for Zettelkasten linking")
    args = p.parse_args()

    target_dir = Path(args.dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = slugify(args.title) + ".md"
    path = target_dir / filename

    keywords = [k.strip() for k in args.keywords.split(",") if k.strip()]
    kw_lines = "\n".join([f"  - {k}" for k in keywords]) if keywords else "  - note"
    id_line = f"id: \"{date.today().strftime('%Y%m%d')}-{slugify(args.title)}\"\n" if args.with_id else ""

    content = (
        "---\n"
        f"title: \"{args.title}\"\n"
        f"{id_line}"
        "keywords:\n"
        f"{kw_lines}\n"
        "...\n\n"
        f"# {args.title}\n\n"
        "## Summary\n"
        "\n"
        "## Body\n"
        "\n"
        "## Links\n"
        "\n"
    )

    path.write_text(content)
    print(f"Created note: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
