---
name: playtest-log-analyzer
description: Analyze card-game playtest logs to detect overpowered/underpowered cards, matchup imbalance, and recurring failure modes, then propose patch candidates by card ID. Use when the user asks to review test sessions, evaluate balance, or generate iteration notes.
---

# Playtest Log Analyzer

## Overview
Use this skill to turn raw playtest logs into actionable balance insights and patch recommendations.

## Workflow
1. Ingest logs.
- Parse session records, decks, match outcomes, and notable card events.

2. Compute metrics.
- Win rate by card and archetype.
- Frequency of card appearance and performance deltas.
- Match length and concession patterns.

3. Detect balance signals.
- Flag cards with strong win-rate deviation at meaningful sample sizes.
- Identify dead cards (high inclusion, low impact) and oppressive loops.

4. Suggest patches.
- Propose small, reversible changes: cost, stats, timing, usage limits.
- Add confidence score based on sample size.

5. Export report.
- Produce concise patch list and follow-up test plan.

## Safety Rules
- Do not claim statistical certainty with tiny samples.
- Keep patch suggestions incremental and versioned.
- Separate observation from recommendation.

## Resources
- Log schema: `references/log-schema.md`
- Metrics guide: `references/metrics-guide.md`
- Analyzer script: `scripts/analyze_playtests.py`

## Output Contract
1. Key findings
2. Flagged cards with evidence
3. Suggested patch candidates
4. Next playtest plan
