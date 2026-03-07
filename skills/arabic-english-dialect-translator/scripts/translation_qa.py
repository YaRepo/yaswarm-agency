#!/usr/bin/env python3
"""Basic QA checks for source/translation pairs."""

import argparse
import re
from pathlib import Path


def extract_numbers(text: str):
    return re.findall(r"\d+(?:[\.,]\d+)?", text)


def extract_emails(text: str):
    return re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--source", required=True)
    p.add_argument("--target", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    src = Path(args.source).read_text(errors="ignore")
    tgt = Path(args.target).read_text(errors="ignore")

    src_nums = extract_numbers(src)
    tgt_nums = extract_numbers(tgt)
    src_emails = extract_emails(src)
    tgt_emails = extract_emails(tgt)

    lines = ["# Translation QA", "", "## Checks"]
    lines.append(f"- Numbers preserved: {'yes' if src_nums == tgt_nums else 'no'}")
    lines.append(f"- Emails preserved: {'yes' if src_emails == tgt_emails else 'no'}")

    if src_nums != tgt_nums:
        lines.append(f"- Source numbers: {src_nums}")
        lines.append(f"- Target numbers: {tgt_nums}")

    if src_emails != tgt_emails:
        lines.append(f"- Source emails: {src_emails}")
        lines.append(f"- Target emails: {tgt_emails}")

    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"Wrote QA report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
