---
name: novella-ruthless-critic
description: Ruthless literary and operational critique for novella manuscripts. Use when the user needs evidence-backed flaws with exact actionable fixes across theme tension, structure, setting, character, continuity, timeline integrity, and plot logic.
---

# Novella Ruthless Critic

## Purpose
Deliver a brutally honest critique that is operationally useful: every weakness is mapped to an exact fix.

## Use This Skill When
- The user asks for ruthless or high-level literary critique.
- The user needs chapter-precise fix guidance, not generic feedback.
- The user wants continuity, timeline, and logic audits with rewrite directions.
- The user wants pre-revision and post-revision quality gates.

## Inputs
- Chapter directory (default: `manuscripts/shapeshifter/02-DRAFTS`).
- Optional context docs: timeline, character bible, continuity report.
- Review mode:
  - `full-audit` (default)
  - `delta-audit` (review only changed chapters)
  - `post-revision` (verify fixes actually landed)

## Workflow
1. Load the manuscript context.
- Read chapter files and critical supporting docs.
- Keep notes on timeline anchors and unresolved threat threads.

2. Run objective signal checks.
- Run `scripts/audit_manuscript_signals.py` for word counts, timestamp regressions, and agency/passivity indicators.
- Treat signal output as evidence, not final judgment.

3. Evaluate using strict rubric.
- Apply `references/critique-framework.md` section by section.
- Score each section with severity (`P0` to `P3`) and confidence (`High/Medium/Low`).

4. Produce structured report.
- Optional fast start: run `scripts/build_critique_report_stub.py` on signal JSON to generate a section-complete draft.
- Use `references/report-template.md` for the final pass.
- For each required section, include `Analysis/Critique` and `Recommended Fixes`.
- Every finding must include location references and clear execution instructions.

5. Handoff to execution.
- Output prioritized fix queue.
- If user requests implementation planning, hand off to the surgical revision planner with chapter-level cut/add/rewrite directives.

## Hard Rules
- No praise padding. Be direct and specific.
- Every flaw must have at least one actionable fix.
- Fixes must specify: action type (`cut`, `add`, `rewrite`, `reorder`), target location, and intended effect.
- Timeline findings must use concrete dates/times when available.
- Separate objective evidence from inferred interpretation.
- Flag any unresolved contradiction as `P0` until closed.

## Safety Rules
- Do not invent chapter evidence; cite only observed text locations.
- Do not collapse distinct characters/events into one finding without proof.
- Keep critique severity proportional to evidence.
- If context is missing, label uncertainty explicitly before recommending rewrites.

## Resources
- Rubric: `references/critique-framework.md`
- Output format: `references/report-template.md`
- Objective signals: `scripts/audit_manuscript_signals.py`
- Report stub builder: `scripts/build_critique_report_stub.py`

## Output Contract
1. Executive diagnosis with top blockers.
2. Full 5-section critique report (strict format).
3. Prioritized fix queue (`P0` -> `P3`) with chapter references.
4. Revision handoff summary for immediate execution.
