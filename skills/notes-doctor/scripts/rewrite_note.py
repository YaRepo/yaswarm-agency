#!/usr/bin/env python3
import argparse
from datetime import datetime
from pathlib import Path


def ensure_header(lines, fallback_title):
    if lines and lines[0].startswith("# "):
        title = lines[0]
        body = lines[1:]
    else:
        title = f"# {fallback_title}"
        body = lines
    return title, body


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--file", required=True)
    p.add_argument("--in-place", action="store_true")
    args = p.parse_args()

    path = Path(args.file)
    original = path.read_text(encoding="utf-8", errors="ignore")
    lines = original.splitlines()

    title, body = ensure_header(lines, path.stem.replace("_", " ").title())
    content = "\n".join([ln for ln in body if ln.strip()])

    summary = content[:280].strip().replace("\n", " ")
    if not summary:
        summary = "No summary content detected."

    now = datetime.now().strftime("%Y-%m-%d")
    rewritten = [
        title,
        "",
        f"Updated: {now}",
        "",
        "## Summary",
        summary,
        "",
        "## Notes",
        content if content else "(empty)",
        "",
        "## Action Items",
        "- [ ] Review and refine this note",
        "",
    ]
    out = "\n".join(rewritten)

    if args.in_place:
        backup = path.with_suffix(path.suffix + ".bak")
        backup.write_text(original, encoding="utf-8")
        path.write_text(out, encoding="utf-8")
        print(f"rewritten_in_place: {path}")
        print(f"backup: {backup}")
    else:
        print(out)

if __name__ == "__main__":
    main()
