#!/usr/bin/env python3
"""Build a chapter-by-chapter surgical revision plan from seeded directives."""

import argparse
import json
import re
from datetime import date
from pathlib import Path


PRIORITY_ORDER = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--chapters-dir", required=True, help="Directory containing chapter-*.md files")
    p.add_argument("--seed-json", required=True, help="Path to chapter directive seed JSON")
    p.add_argument("--mode", choices=["novella", "novel"], default="novella")
    p.add_argument("--out", required=True, help="Output markdown path")
    return p.parse_args()


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w']+\b", text))


def chapter_number(path: Path) -> int:
    m = re.search(r"chapter-(\d+)\.md$", path.name)
    if not m:
        return 10**9
    return int(m.group(1))


def load_chapters(chapters_dir: Path):
    rows = []
    for p in sorted(chapters_dir.glob("chapter-*.md"), key=chapter_number):
        text = p.read_text(encoding="utf-8", errors="ignore")
        lines = text.splitlines()
        title = lines[0].strip().lstrip("# ").strip() if lines else p.stem
        rows.append(
            {
                "chapter": chapter_number(p),
                "path": p,
                "title": title,
                "current_words": word_count(text),
            }
        )
    return rows


def load_seed(seed_path: Path):
    data = json.loads(seed_path.read_text(encoding="utf-8"))
    mapping = {}
    for item in data.get("chapters", []):
        mapping[int(item["chapter"])] = item
    return mapping


def build_plan_rows(chapters, seed_map, mode: str):
    rows = []
    for ch in chapters:
        item = seed_map.get(ch["chapter"], {})
        delta_key = "delta_novella" if mode == "novella" else "delta_novel"
        delta = int(item.get(delta_key, 0))
        target = max(0, ch["current_words"] + delta)
        rows.append(
            {
                **ch,
                "priority": item.get("priority", "P2"),
                "delta": delta,
                "target_words": target,
                "cut": item.get("cut", ["No cut directive seeded."]),
                "add": item.get("add", ["No add directive seeded."]),
                "rewrite": item.get("rewrite", ["No rewrite directive seeded."]),
                "checks": item.get("checks", ["No continuity check seeded."]),
            }
        )
    return rows


def format_table(rows):
    lines = [
        "| Ch | Title | Priority | Current | Delta | Target |",
        "| --- | --- | --- | ---: | ---: | ---: |",
    ]
    for r in rows:
        lines.append(
            f"| {r['chapter']:02d} | {r['title']} | {r['priority']} | "
            f"{r['current_words']} | {r['delta']:+d} | {r['target_words']} |"
        )
    return lines


def format_execution_sequence(rows):
    ordered = sorted(rows, key=lambda r: (PRIORITY_ORDER.get(r["priority"], 9), r["chapter"]))
    lines = ["## Execution Sequence (By Priority)"]
    for idx, r in enumerate(ordered, 1):
        lines.append(
            f"{idx}. Ch {r['chapter']:02d} ({r['priority']}): {r['title']} "
            f"[{r['current_words']} -> {r['target_words']}]"
        )
    lines.append("")
    return lines


def format_chapter_directive(r):
    lines = [f"## Chapter {r['chapter']:02d} - {r['title']}"]
    lines.append(f"- Priority: `{r['priority']}`")
    lines.append(f"- Current words: `{r['current_words']}`")
    lines.append(f"- Target delta: `{r['delta']:+d}`")
    lines.append(f"- Target words: `{r['target_words']}`")
    lines.append("")

    lines.append("### Cut")
    for x in r["cut"]:
        lines.append(f"- {x}")
    lines.append("")

    lines.append("### Add")
    for x in r["add"]:
        lines.append(f"- {x}")
    lines.append("")

    lines.append("### Rewrite")
    for x in r["rewrite"]:
        lines.append(f"- {x}")
    lines.append("")

    lines.append("### Continuity and Logic Checks")
    for x in r["checks"]:
        lines.append(f"- {x}")
    lines.append("")

    return lines


def main() -> int:
    args = parse_args()
    chapters_dir = Path(args.chapters_dir)
    seed_path = Path(args.seed_json)
    out_path = Path(args.out)

    chapters = load_chapters(chapters_dir)
    seed_map = load_seed(seed_path)
    rows = build_plan_rows(chapters, seed_map, mode=args.mode)

    current_total = sum(r["current_words"] for r in rows)
    target_total = sum(r["target_words"] for r in rows)

    lines = [
        "# Surgical Revision Plan (Ch1-Ch24)",
        "",
        f"Generated: {date.today().isoformat()}",
        f"Mode: `{args.mode}`",
        f"Current total words: `{current_total}`",
        f"Projected total words: `{target_total}`",
        "",
        "## Chapter Summary",
    ]

    lines.extend(format_table(rows))
    lines.append("")
    lines.extend(format_execution_sequence(rows))

    lines.append("## Chapter Directives")
    lines.append("")
    for r in rows:
        lines.extend(format_chapter_directive(r))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")

    print(f"Wrote plan: {out_path}")
    print(f"Current total: {current_total}")
    print(f"Projected total: {target_total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
