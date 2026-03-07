#!/usr/bin/env python3
"""Build a triage report for character knowledge-state vs action consistency.

This scanner is heuristic. It surfaces candidate evidence lines for manual review.
"""

from __future__ import annotations

import argparse
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple

KNOWLEDGE_STEMS = (
    "know",
    "knew",
    "learn",
    "realiz",
    "suspect",
    "aware",
    "tell",
    "told",
    "reveal",
    "truth",
    "secret",
    "discover",
    "hear",
    "heard",
    "saw",
    "seen",
    "witness",
    "understand",
    "admit",
    "confess",
    "recogniz",
)

ACTION_STEMS = (
    "decid",
    "choos",
    "chose",
    "plan",
    "send",
    "sent",
    "call",
    "move",
    "run",
    "ran",
    "hide",
    "hid",
    "lie",
    "lied",
    "attack",
    "report",
    "leak",
    "trace",
    "rescu",
    "follow",
    "escape",
    "warn",
    "protect",
    "forge",
    "smuggl",
    "track",
    "brib",
    "sign",
    "stamp",
)

REVEAL_PHRASES = (
    "truth",
    "secret",
    "revealed",
    "confessed",
    "admitted",
    "found out",
    "exposed",
    "shapeshift",
    "shape-shift",
    "shift",
    "one pulse",
    "two names",
    "no husband",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scan manuscript chapters for knowledge/action evidence lines."
    )
    parser.add_argument("--manuscript-dir", required=True)
    parser.add_argument("--characters", required=True, help="Comma-separated names")
    parser.add_argument("--out", required=True)
    parser.add_argument("--max-evidence", type=int, default=12)
    parser.add_argument("--context-radius", type=int, default=2)
    return parser.parse_args()


def chapter_sort_key(path: Path) -> Tuple[int, str]:
    match = re.search(r"(\d+)", path.stem)
    order = int(match.group(1)) if match else 10**9
    return (order, path.name.lower())


def load_chapters(manuscript_dir: Path) -> List[Path]:
    files = sorted(manuscript_dir.glob("chapter-*.md"), key=chapter_sort_key)
    if not files:
        files = sorted(manuscript_dir.glob("*.md"), key=chapter_sort_key)
    return [path for path in files if path.is_file()]


def compact(text: str, limit: int = 260) -> str:
    clean = " ".join(text.strip().split())
    if len(clean) <= limit:
        return clean
    return clean[: limit - 3].rstrip() + "..."


def add_unique(bucket: List[Tuple[str, int, str]], item: Tuple[str, int, str], max_items: int) -> None:
    if item in bucket:
        return
    if len(bucket) >= max_items:
        return
    bucket.append(item)


def contains_stem(text: str, stems: Tuple[str, ...]) -> bool:
    words = re.findall(r"[a-zA-Z']+", text.lower())
    for word in words:
        for stem in stems:
            if word.startswith(stem):
                return True
    return False


def contains_phrase(text: str, phrases: Tuple[str, ...]) -> bool:
    low = text.lower()
    for phrase in phrases:
        if phrase in low:
            return True
    return False


def context_window(lines: List[str], index: int, radius: int) -> str:
    start = max(0, index - radius)
    end = min(len(lines), index + radius + 1)
    return " ".join(lines[start:end])


def compile_char_patterns(names: List[str]) -> Dict[str, re.Pattern[str]]:
    patterns: Dict[str, re.Pattern[str]] = {}
    for name in names:
        patterns[name] = re.compile(r"(?<!\w)" + re.escape(name) + r"(?!\w)", re.IGNORECASE)
    return patterns


def collect(
    chapter_files: List[Path],
    characters: List[str],
    max_evidence: int,
    context_radius: int,
) -> Tuple[Dict[str, Dict[str, object]], List[Tuple[str, int, str]]]:
    char_patterns = compile_char_patterns(characters)
    data: Dict[str, Dict[str, object]] = {
        name: {"mentions": 0, "knowledge": [], "actions": []} for name in characters
    }
    reveal_hits: List[Tuple[str, int, str]] = []

    for chapter in chapter_files:
        try:
            raw_lines = chapter.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            raw_lines = chapter.read_text(encoding="latin-1").splitlines()

        for line_no, raw_line in enumerate(raw_lines, start=1):
            if not raw_line.strip():
                continue

            if contains_phrase(raw_line, REVEAL_PHRASES):
                add_unique(reveal_hits, (chapter.name, line_no, compact(raw_line)), max_evidence * 5)

            for name, pattern in char_patterns.items():
                if not pattern.search(raw_line):
                    continue

                entry = data[name]
                entry["mentions"] = int(entry["mentions"]) + 1

                ctx = context_window(raw_lines, line_no - 1, context_radius)
                ctx_compact = compact(ctx)

                if contains_stem(ctx, KNOWLEDGE_STEMS) or "found out" in ctx.lower():
                    add_unique(entry["knowledge"], (chapter.name, line_no, ctx_compact), max_evidence)

                if contains_stem(ctx, ACTION_STEMS):
                    add_unique(entry["actions"], (chapter.name, line_no, ctx_compact), max_evidence)

    return data, reveal_hits


def watchouts(mentions: int, knowledge: int, actions: int) -> str:
    flags: List[str] = []
    if mentions > 0 and knowledge == 0:
        flags.append("no explicit knowledge cue")
    if mentions > 0 and actions == 0:
        flags.append("no explicit action cue")
    if knowledge >= 5 and actions <= 1:
        flags.append("possible passivity")
    if actions >= 5 and knowledge == 0:
        flags.append("possible ungrounded actions")
    return "; ".join(flags) if flags else "-"


def render(
    manuscript_dir: Path,
    chapter_files: List[Path],
    characters: List[str],
    data: Dict[str, Dict[str, object]],
    reveal_hits: List[Tuple[str, int, str]],
) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    out: List[str] = []

    out.append("# Knowledge-Action Scan Report")
    out.append("")
    out.append(f"- Generated: {now}")
    out.append(f"- Manuscript dir: `{manuscript_dir}`")
    out.append(f"- Chapters scanned: {len(chapter_files)}")
    out.append(f"- Characters scanned: {len(characters)}")
    out.append("")

    out.append("## Character Coverage")
    out.append("")
    out.append("| Character | Mentions | Knowledge Evidence | Action Evidence | Watch-outs |")
    out.append("|---|---:|---:|---:|---|")

    sorted_chars = sorted(characters, key=lambda c: (-int(data[c]["mentions"]), c.lower()))

    for name in sorted_chars:
        mentions = int(data[name]["mentions"])
        knowledge = len(data[name]["knowledge"])
        actions = len(data[name]["actions"])
        out.append(
            f"| {name} | {mentions} | {knowledge} | {actions} | {watchouts(mentions, knowledge, actions)} |"
        )

    out.append("")
    out.append("## Global Reveal/Secret Signals")
    out.append("")
    if reveal_hits:
        for chapter_name, line_no, excerpt in reveal_hits[:60]:
            out.append(f"- `{chapter_name}:{line_no}` {excerpt}")
    else:
        out.append("- No reveal/secret signal lines matched the heuristic term set.")

    for name in sorted_chars:
        out.append("")
        out.append(f"## {name}")
        out.append("")
        out.append("### Knowledge Candidates")
        knowledge_hits = data[name]["knowledge"]
        if knowledge_hits:
            for chapter_name, line_no, excerpt in knowledge_hits:
                out.append(f"- `{chapter_name}:{line_no}` {excerpt}")
        else:
            out.append("- No explicit knowledge-cue lines found.")

        out.append("")
        out.append("### Action Candidates")
        action_hits = data[name]["actions"]
        if action_hits:
            for chapter_name, line_no, excerpt in action_hits:
                out.append(f"- `{chapter_name}:{line_no}` {excerpt}")
        else:
            out.append("- No explicit action-cue lines found.")

    out.append("")
    out.append("## Manual QA Next Steps")
    out.append("")
    out.append("1. Build final who-knows-what matrix by chapter from evidence above.")
    out.append("2. Verify each major action has a valid decision basis at that chapter.")
    out.append("3. Check reveal timing: why this person, why this moment, why not earlier.")
    out.append("4. Flag impossible knowledge, forgotten facts, or implausible ignorance.")
    out.append("5. Convert issues into chapter-level cut/add/rewrite directives.")

    return "\n".join(out) + "\n"


def main() -> int:
    args = parse_args()

    manuscript_dir = Path(args.manuscript_dir).expanduser().resolve()
    if not manuscript_dir.exists() or not manuscript_dir.is_dir():
        print(f"error: manuscript directory not found: {manuscript_dir}")
        return 1

    characters = [chunk.strip() for chunk in args.characters.split(",") if chunk.strip()]
    if not characters:
        print("error: provide at least one character in --characters")
        return 1

    chapter_files = load_chapters(manuscript_dir)
    if not chapter_files:
        print(f"error: no chapter files found in {manuscript_dir}")
        return 1

    data, reveal_hits = collect(chapter_files, characters, args.max_evidence, args.context_radius)
    report = render(manuscript_dir, chapter_files, characters, data, reveal_hits)

    out_path = Path(args.out).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(report, encoding="utf-8")

    print(f"wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
