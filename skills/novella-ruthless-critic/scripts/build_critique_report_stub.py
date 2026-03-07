#!/usr/bin/env python3
"""Build a structured critique-report stub from signal JSON."""

import argparse
import json
from datetime import date
from pathlib import Path


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--signals-json", required=True, help="Path to audit_manuscript_signals output")
    p.add_argument("--out", required=True, help="Output markdown path")
    return p.parse_args()


def as_list(items):
    if not items:
        return "none"
    return ", ".join(str(x) for x in items)


def main() -> int:
    args = parse_args()
    data = json.loads(Path(args.signals_json).read_text(encoding="utf-8"))

    flags = data.get("flags", {})
    low_agency = flags.get("low_agency_chapters", [])
    timeline = flags.get("timeline_regression_chapters", [])
    unknown = flags.get("unknown_thread_density", {})

    unknown_sorted = sorted(unknown.items(), key=lambda x: x[1], reverse=True)
    unknown_text = ", ".join(f"Ch{x[0]}:{x[1]}" for x in unknown_sorted[:8]) if unknown_sorted else "none"

    lines = [
        "# Ruthless Manuscript Critique Report",
        "",
        f"Generated: {date.today().isoformat()}",
        f"Signal source: `{args.signals_json}`",
        "",
        "## Executive Diagnosis",
        f"- Top `P0` blockers: timeline regressions in chapters {as_list(timeline)}; agency drift risk in chapters {as_list(low_agency)}.",
        "- Core engine status: strong concept pressure, but execution reliability depends on fixing chronology + agency before prose polish.",
        "- Immediate rewrite mandate (1 sentence): convert every passive threat intake into protagonist-led counter-action while repairing chronology and payoff logic.",
        "",
        "## 1. Core Themes and Tension",
        "### Analysis/Critique",
        f"- [P1][High] Low-agency signal chapters: {as_list(low_agency)} (objective marker ratio).",
        "- [P1][Medium] Validate dual-role tension is dramatized through decisions, not only internal statements.",
        "",
        "### Recommended Fixes",
        "- Action: `rewrite`",
        f"- Target: chapters {as_list(low_agency)}",
        "- Exact instruction: add explicit counter-move beat within 1-2 paragraphs after each incoming threat.",
        "- Intended effect: preserve thriller velocity under lockdown constraints.",
        "- Suggested word delta: +50 to +180 per affected chapter.",
        "",
        "## 2. Narrative Balance and Structure",
        "### Analysis/Critique",
        "- [P1][Medium] Review transition from identity struggle to custody/legal war for abruptness and procedural overload.",
        "",
        "### Recommended Fixes",
        "- Action: `cut` + `rewrite`",
        "- Target: paperwork-heavy scenes and repeated notification clusters.",
        "- Exact instruction: remove duplicate protocol explanation; convert retained content into decision-consequence beats.",
        "- Intended effect: restore narrative momentum while preserving opsec clarity.",
        "- Suggested word delta: -80 to -240 per overloaded chapter.",
        "",
        "## 3. Setting, Atmosphere, and Context",
        "### Analysis/Critique",
        "- [P1][Medium] Verify Cairo unrest changes tactical outcomes (routing/legal/surveillance), not only atmosphere.",
        "",
        "### Recommended Fixes",
        "- Action: `add`",
        "- Target: key routing/legal scenes before and after delivery-abduction sequence.",
        "- Exact instruction: inject one concrete cause-effect beat per scene linking civil unrest to protagonist survival windows.",
        "- Intended effect: setting becomes a mechanical story force.",
        "- Suggested word delta: +40 to +120 per target scene.",
        "",
        "## 4. Character and Dialogue",
        "### Analysis/Critique",
        "- [P1][Medium] Validate distinct voice signatures for celebrity-public mask vs private operative cognition.",
        f"- [P1][Medium] Unknown-thread concentration: {unknown_text}.",
        "",
        "### Recommended Fixes",
        "- Action: `rewrite`",
        "- Target: scene dialogue and internal narration at chapter openings/endings.",
        "- Exact instruction: enforce two voice registers and define unknown-sender reliability/payoff by finale.",
        "- Intended effect: stronger characterization and cleaner suspense logic.",
        "- Suggested word delta: +30 to +120 per target chapter.",
        "",
        "## 5. Logic, Consistency, and Accuracy",
        "### Analysis/Critique",
        f"- [P0][High] Timeline regression signals detected in chapters: {as_list(timeline)}.",
        "- [P1][Medium] Review convenience dependencies in detection evasion and rescue logistics.",
        "",
        "### Recommended Fixes",
        "- Action: `reorder` + `rewrite`",
        f"- Target: chapters {as_list(timeline)}",
        "- Exact instruction: reorder timestamped beats into monotonic sequence, allowing only explicit day-rollover transitions.",
        "- Intended effect: eliminate chronology trust breaks.",
        "- Suggested word delta: -20 to +60 per affected chapter.",
        "",
        "## Prioritized Fix Queue",
        "1. `P0`: repair timeline integrity in flagged chapters and verify no backward timestamp drift remains.",
        "2. `P1`: convert low-agency chapters into command-led chapters.",
        "3. `P1`: resolve unknown-sender logic and antagonist intent clarity.",
        "4. `P2`: prose compression after structural fixes are locked.",
        "",
        "## Execution Handoff",
        "- Chapters to revise first: timeline-flagged chapters, then low-agency chapters.",
        "- Dependencies and ordering: chronology -> agency -> antagonist logic -> polish.",
        "- Regression checks after rewrite: rerun signal audit and manually verify cited lines.",
    ]

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"Wrote critique stub: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
