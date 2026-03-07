#!/usr/bin/env python3
"""Swap common UK/US English spellings in text files.

This is a helper for localization cleanup after translation.
"""

import argparse
from pathlib import Path

US_TO_GB = {
    "color": "colour",
    "favorite": "favourite",
    "organize": "organise",
    "realize": "realise",
    "center": "centre",
    "meter": "metre",
    "traveling": "travelling",
}

GB_TO_US = {v: k for k, v in US_TO_GB.items()}


def swap_token(token: str, mapping: dict) -> str:
    lower = token.lower()
    if lower not in mapping:
        return token
    out = mapping[lower]
    if token.istitle():
        return out.title()
    if token.isupper():
        return out.upper()
    return out


def convert_text(text: str, mode: str) -> str:
    mapping = US_TO_GB if mode == "us-to-gb" else GB_TO_US
    words = text.split(" ")
    out = []
    for w in words:
        core = w.strip(".,;:!?()[]{}\"'")
        pre = w[: len(w) - len(w.lstrip(".,;:!?()[]{}\"'"))]
        post = w[len(w.rstrip(".,;:!?()[]{}\"'")) :]
        swapped = swap_token(core, mapping)
        out.append(f"{pre}{swapped}{post}")
    return " ".join(out)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--mode", required=True, choices=["us-to-gb", "gb-to-us"])
    args = p.parse_args()

    text = Path(args.input).read_text(errors="ignore")
    converted = convert_text(text, args.mode)
    Path(args.out).write_text(converted)
    print(f"Wrote localized text: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
