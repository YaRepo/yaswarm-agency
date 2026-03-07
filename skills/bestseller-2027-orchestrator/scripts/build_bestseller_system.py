#!/usr/bin/env python3
import argparse
from datetime import date
from pathlib import Path


def chapter_word_count(chapters_dir: Path) -> int:
    total = 0
    for p in sorted(chapters_dir.glob('chapter-*.md')):
        total += len(p.read_text(encoding='utf-8').split())
    return total


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding='utf-8')


def main() -> int:
    ap = argparse.ArgumentParser(description='Generate end-to-end bestseller system docs for a novel project')
    ap.add_argument('--project-root', required=True)
    ap.add_argument('--book-slug', required=True)
    ap.add_argument('--target-year', type=int, default=2027)
    ap.add_argument('--path', choices=['self', 'traditional', 'hybrid'], default='hybrid')
    ap.add_argument('--target-words', default='80000-100000')
    args = ap.parse_args()

    root = Path(args.project_root).expanduser().resolve()
    book_root = root / 'manuscripts' / args.book_slug
    drafts = book_root / '02-DRAFTS'
    out = book_root / '03-PUBLISHING'

    wc = chapter_word_count(drafts)
    today = date.today().isoformat()

    write(
        out / '01-positioning.md',
        f"""# Positioning

Date: {today}
Book: {args.book_slug}
Path: {args.path}
Target Launch Year: {args.target_year}

## One-Line Positioning
A high-concept speculative thriller set in Egypt's 2011 upheaval, driven by a mother's rescue war against a trafficking network.

## Shelf Strategy
- Primary shelf: Speculative Thriller
- Secondary hook: Political-Emotional Suspense

## Reader Promise
- High chapter propulsion
- Identity/mask tension
- Maternal mission urgency
- Historical-pressure atmosphere

## Differentiators
- Egypt 2011 timeline integration
- Dual-identity shapeshifter premise with reproductive paradox
- Emotional + operational thriller structure

## Comp Direction (working)
- High-concept thriller with intimate maternal stakes
- Character-driven speculative suspense with political backdrop

## Risk to Fix
- Current draft length: ~{wc} words; commercial target is {args.target_words}
- Expand scene depth and aftermath texture before publication path lock
""",
    )

    write(
        out / '02-revision-commercial-roadmap.md',
        f"""# Commercial Revision Roadmap

Date: {today}

## Current State
- Draft chapters: 24
- Draft word count: ~{wc}
- Target word count: {args.target_words}

## Priority Sequence
1. Expansion pass (high priority)
- Expand to target range via scene deepening, not filler.
- Add sensory grounding, conflict reversals, and consequence beats per chapter.

2. Reader retention pass
- Keep first 20% extremely high velocity.
- Ensure every chapter ends with irreversible pressure.

3. Character memory pass
- Increase emotionally sticky motifs (specific recurring lines/objects).
- Sharpen relationship texture among narrator, Alyga, Huda.

4. Market-facing polish
- Tighten blurbs, opening pages, and sample extract.
- Extract quote-card lines for social discovery.

## Expansion Targets by Arc
- Ch. 1-6: +10k to +15k words
- Ch. 7-13: +12k to +18k words
- Ch. 14-19: +10k to +15k words
- Ch. 20-24: +8k to +12k words

## Definition of Done
- Word count in target range
- Continuity pass clean
- Beta reader packet ready
- Metadata and launch assets drafted
""",
    )

    write(
        out / '03-launch-plan-2026-2027.md',
        f"""# Launch Plan 2026-2027

Date: {today}
Target Year: {args.target_year}

## Phase 1: Foundation (Now -> 2026 Q2)
- Finish expansion revision to target range.
- Build cover brief and title/subtitle test set.
- Prepare ARC list (readers, creators, reviewers).

## Phase 2: Prelaunch System (2026 Q3-Q4)
- Send ARC waves in cohorts.
- Collect blurbs and early review commitments.
- Test hooks: 6 ad/organic angles based on themes.
- Build launch list assets (email sequence + landing page).

## Phase 3: Launch Window ({args.target_year} Q1-Q2)
- Week -4 to -1: creator clips, quote cards, preorder push.
- Launch week: concentrated outreach, social cadence, ad scaling only on winning creatives.
- Week +2 onward: pricing/promo pulses and continued creator partnerships.

## Phase 4: Sustain (90 days post-launch)
- Weekly KPI review and creative refresh.
- Bundle/promo experiments.
- Reader retention content and sequel/universe signal.
""",
    )

    write(
        out / '04-channel-playbook.md',
        f"""# Channel Playbook

Date: {today}

## Core Channels
- Direct audience: email + owned site
- Social discovery: short-form quote/hook clips
- Review channels: ARC teams + platform reviewers
- Paid tests: small-budget ad creatives, scaled only on winners
- Audio pathway: early narration feasibility and sample assets

## Content Angles to Test
- Identity split / one body-two lives
- Mother-on-a-mission urgency
- Historical chaos + private loss mirror
- Medical/legal conspiracy layer

## Weekly Output Cadence
- 2-3 short hook posts
- 1 deeper world/character post
- 1 quote-card post
- 1 reader interaction prompt
""",
    )

    write(
        out / '05-kpi-dashboard.md',
        f"""# KPI Dashboard

Date: {today}
Owner: Weekly review meeting

## Leading Indicators
- ARC accept rate: target >= 25%
- ARC completion/review rate: target >= 40%
- Creator reply rate: target >= 10%
- Landing-page conversion: target >= 3%
- Email click-to-buy proxy: target >= 4%

## Launch Indicators
- Day-1 unit target: set after ARC confidence baseline
- Day-7 rank momentum: monitor slope, not single snapshot
- Review velocity: >= 25 qualified reviews in early window

## Decision Rules
- If ARC completion < 25%: rework onboarding packet and timeline.
- If creator reply < 8%: replace outreach hooks and targeting list.
- If conversion < 2%: rewrite positioning line + blurb + CTA.
- If week-2 sales drop > 60%: trigger promo stack and fresh creative set.
""",
    )

    write(
        out / '06-weekly-operating-rhythm.md',
        f"""# Weekly Operating Rhythm

Date: {today}

## Monday (Strategy)
- Review KPI dashboard
- Choose one bottleneck and one experiment

## Tuesday-Wednesday (Execution)
- Implement manuscript or packaging changes
- Run outreach and channel tasks

## Thursday (Measurement)
- Compare results vs thresholds
- Keep/kill experiments

## Friday (Iteration)
- Lock next week's priorities
- Update risk register and dependencies

## Non-Negotiables
- No random tactic switching without metrics
- One major experiment per week
- Archive learning in plain language
""",
    )

    write(
        out / '07-14-day-sprint.md',
        f"""# 14-Day Sprint (Immediate)

Date: {today}

## Goal
Increase commercial readiness and prepare prelaunch infrastructure.

## Day 1-3
- Finalize positioning line and 3 blurb variants.
- Select primary publication path: {args.path}.

## Day 4-7
- Expand two highest-leverage chapters (opening + first major reversal).
- Build ARC candidate list (minimum 75 targets).

## Day 8-10
- Draft creator outreach templates (3 hook angles).
- Draft landing-page copy with clear CTA.

## Day 11-14
- Set KPI baseline sheet from this plan.
- Run first outreach batch and log response metrics.

## Deliverables by Day 14
- Revised opening package
- ARC/outreach list v1
- KPI tracker live
- Next 30-day backlog prioritized
""",
    )

    print(f'Generated bestseller system in: {out}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
