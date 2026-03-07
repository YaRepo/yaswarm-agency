#!/usr/bin/env python3
"""Generate objective manuscript signals to support ruthless critique passes."""

import argparse
import json
import re
from pathlib import Path

LINE_TIME_RE = re.compile(r"^\s*(?:[-*]\s*)?(?:At|at)\s+([01]?\d|2[0-3]):([0-5]\d)\b")
YEAR_RE = re.compile(r"\b(19\d{2}|20\d{2})\b")
WORD_RE = re.compile(r"\b[\w']+\b")

PASSIVE_MARKERS = {
    "wait",
    "waits",
    "waited",
    "waiting",
    "watch",
    "watches",
    "watched",
    "watching",
    "scroll",
    "scrolls",
    "scrolled",
    "scrolling",
    "stare",
    "stares",
    "stared",
    "staring",
    "sit",
    "sits",
    "sat",
    "sitting",
    "hide",
    "hides",
    "hid",
    "hiding",
    "listen",
    "listens",
    "listened",
    "listening",
    "hesitate",
    "hesitates",
    "hesitated",
    "hesitating",
}

ACTION_MARKERS = {
    "order",
    "orders",
    "ordered",
    "ordering",
    "command",
    "commands",
    "commanded",
    "commanding",
    "direct",
    "directs",
    "directed",
    "directing",
    "call",
    "calls",
    "called",
    "calling",
    "deploy",
    "deploys",
    "deployed",
    "deploying",
    "plant",
    "plants",
    "planted",
    "planting",
    "interrogate",
    "interrogates",
    "interrogated",
    "interrogating",
    "cross-examine",
    "cross-examines",
    "cross-examining",
    "moved",
    "move",
    "moves",
    "moving",
    "trigger",
    "triggers",
    "triggered",
    "triggering",
    "assign",
    "assigns",
    "assigned",
    "assigning",
    "instruct",
    "instructs",
    "instructed",
    "instructing",
}

UNKNOWN_THREAD_RE = re.compile(
    r"unknown sender|no caller id|private number|unlisted|burner", re.IGNORECASE
)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--chapters-dir", required=True, help="Directory with chapter-*.md files")
    p.add_argument("--out", help="Optional path to write JSON")
    return p.parse_args()


def chapter_num(p: Path) -> int:
    m = re.search(r"chapter-(\d+)\.md$", p.name)
    return int(m.group(1)) if m else 10**9


def minutes(h: str, m: str) -> int:
    return int(h) * 60 + int(m)


def extract_time_regressions(lines):
    """
    Detect likely chronology regressions from narrative timestamp lines.

    Rules:
    - Only consider lines that begin with "At HH:MM" style markers.
    - Allow one or more midnight rollovers when going from late evening to early morning.
    - Flag other backward jumps as likely regressions.
    """
    found = []
    for idx, line in enumerate(lines, 1):
        m = LINE_TIME_RE.search(line)
        if not m:
            continue
        hh, mm = m.group(1), m.group(2)
        day_mins = minutes(hh, mm)
        found.append({"line": idx, "time": f"{int(hh):02d}:{mm}", "day_mins": day_mins})

    regressions = []
    day_offset = 0
    prev = None

    for item in found:
        current = item["day_mins"]
        if prev is not None and current < prev["day_mins"]:
            # Treat late-evening -> early-morning as next-day rollover.
            if prev["day_mins"] >= 18 * 60 and current <= 6 * 60:
                day_offset += 24 * 60
            else:
                regressions.append(
                    {
                        "from": {"line": prev["line"], "time": prev["time"]},
                        "to": {"line": item["line"], "time": item["time"]},
                    }
                )

        item["abs_mins"] = current + day_offset
        prev = item

    return regressions


def marker_count(words, markers):
    return sum(1 for w in words if w in markers)


def analyze_file(path: Path):
    text = path.read_text(encoding="utf-8", errors="ignore")
    lines = text.splitlines()
    words = [w.lower() for w in WORD_RE.findall(text)]

    passive = marker_count(words, PASSIVE_MARKERS)
    action = marker_count(words, ACTION_MARKERS)
    ratio = round(action / (passive + 1), 3)

    years = sorted({int(y) for y in YEAR_RE.findall(text)})
    regressions = extract_time_regressions(lines)
    unknown_hits = []
    for idx, line in enumerate(lines, 1):
        if UNKNOWN_THREAD_RE.search(line):
            unknown_hits.append({"line": idx, "text": line.strip()[:180]})

    return {
        "chapter": chapter_num(path),
        "file": str(path),
        "word_count": len(words),
        "years_mentioned": years,
        "passive_marker_count": passive,
        "action_marker_count": action,
        "agency_ratio": ratio,
        "timestamp_regressions": regressions,
        "unknown_thread_hits": unknown_hits,
    }


def main() -> int:
    args = parse_args()
    base = Path(args.chapters_dir)
    rows = []

    for path in sorted(base.glob("chapter-*.md"), key=chapter_num):
        rows.append(analyze_file(path))

    flagged = {
        "low_agency_chapters": [r["chapter"] for r in rows if r["agency_ratio"] < 0.8],
        "timeline_regression_chapters": [r["chapter"] for r in rows if r["timestamp_regressions"]],
        "unknown_thread_density": {
            r["chapter"]: len(r["unknown_thread_hits"]) for r in rows if r["unknown_thread_hits"]
        },
    }

    report = {
        "meta": {
            "tool": "audit_manuscript_signals",
            "chapters_dir": str(base),
            "chapter_count": len(rows),
        },
        "chapters": rows,
        "flags": flagged,
    }

    out = json.dumps(report, indent=2)
    if args.out:
        p = Path(args.out)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(out + "\n", encoding="utf-8")
        print(f"Wrote signals: {p}")
    else:
        print(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
