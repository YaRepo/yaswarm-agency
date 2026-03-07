---
name: knowledge-action-auditor
description: Audit fiction for "who knows what" consistency by mapping each character's knowledge state against their actions, reveals, and reactions. Use when checking support-character logic, reveal plausibility, knowledge leaks, implausible ignorance, red-herring fairness, and continuity across chapters.
---

# Knowledge Action Auditor

Use this skill when a story risks knowledge-state plot holes: characters knowing too much, knowing too little, or acting against what they know.

## What This Skill Produces

1. Character knowledge matrix (who knows what, when, and how).
2. Action-consistency audit (does behavior match known info).
3. Reveal plausibility check (timing and target of secret reveals).
4. Clue/red-herring fairness check.
5. Chapter-level rewrite directives with priorities.

## When To Use

- The user asks "who knows what" questions.
- A reveal/twist feels convenient or unearned.
- Support characters seem unrealistically oblivious.
- You need to verify that clues are fair without leaking too early.
- You are polishing a draft before export or publication.

## Inputs To Gather

- Chapter files in order.
- Character list (core and support cast).
- World-rule constraints that affect inference (what can and cannot be observed/deduced).
- Reveal scenes and chapter numbers.

## Workflow

1. Build a chapter-by-chapter knowledge ledger.
- For each character, log: `Known Fact`, `How Learned`, `Chapter`, `Confidence`.

2. Build a chapter-by-chapter action ledger.
- For each character, log: `Action`, `Decision Basis`, `Chapter`, `Expected if Knowledge Were Different`.

3. Compare knowledge and behavior.
- Flag contradictions:
  - Impossible knowledge (they know before evidence exists).
  - Missing inference (they should suspect but do not).
  - Forgotten knowledge (they act as if prior facts vanished).
  - Motivation mismatch (action does not follow from beliefs).

4. Stress-test reveal logic.
- Why this reveal target, why now, why not earlier.
- Verify costs/risks of revealing to each alternative character.

5. Validate clue and red-herring fairness.
- Ensure clues are present and interpretable.
- Ensure misdirection has a valid in-world cause.

6. Produce an execution plan.
- Priority order: `P0` (trust-breaking), `P1` (major plausibility), `P2` (polish).
- Each fix must include exact chapter location and rewrite intent.

## Optional Script Assist

Run the scanner to generate candidate evidence lines before manual judgment:

```bash
python3 scripts/knowledge_action_scan.py \
  --manuscript-dir <path/to/chapters> \
  --characters "Name1,Name2,Name3" \
  --out <path/to/report.md>
```

Use scanner output as triage only. Final decisions must be narrative, not keyword-only.

## Severity Framework

| Severity | Meaning | Typical Fix |
|---|---|---|
| CRITICAL | Reader trust break (impossible knowledge, reveal cheat) | Rewrite causal chain or reveal timing |
| HIGH | Strong plausibility damage | Add/shift setup beats, adjust reactions |
| MEDIUM | Noticeable but recoverable | Clarify scene logic, tighten dialogue |
| LOW | Minor friction | Line edits and cue cleanup |

## Output Contract

Return a structured report with these sections:

1. `Knowledge Matrix`
2. `Action-Consistency Findings`
3. `Reveal Plausibility Findings`
4. `Clue/Red-Herring Fairness`
5. `Chapter-by-Chapter Fix Plan`

Every finding must include:
- Chapter reference.
- Why it breaks logic (or risks breaking it).
- Exact patch instruction (`cut/add/rewrite`).

## Collaboration With Other Skills

- Use `plot-architect` for macro escalation and payoff logic.
- Use `mystery-plot-consultant` for fair-play clue design.
- Use `logic-simulator` for causality stress tests.
- Use `continuity-checker` for canonical/timeline cleanup.

## Safety Rules

- Prefer minimal, reversible edits first.
- Do not rewrite broad sections until `P0` issues are closed.
- If evidence is ambiguous, mark it as an assumption instead of forcing a claim.
