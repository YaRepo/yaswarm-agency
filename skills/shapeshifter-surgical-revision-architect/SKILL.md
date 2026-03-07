---
name: shapeshifter-surgical-revision-architect
description: Merge critique findings into an executable chapter-by-chapter surgical revision plan for the Shapeshifter manuscript. Use when the user asks for ruthless critique synthesis, revision blueprints, exact cut/add/rewrite directives, agency restoration, continuity fixes, and target word deltas across Chapters 1-24.
---

# Shapeshifter Surgical Revision Architect

## Purpose
Turn broad critique into a precise execution plan: chapter-by-chapter cuts, additions, rewrites, continuity fixes, and word-delta targets.

## Use This Skill When
- The user asks for a surgical revision plan for Ch. 1-24.
- The user asks to merge multiple audits into one blueprint.
- The user wants direct, operational rewriting instructions instead of high-level feedback.
- The user asks for exact chapter targets and revision order.

## Inputs
- Chapter directory (default: `manuscripts/shapeshifter/02-DRAFTS`)
- Blueprint file (default: `manuscripts/shapeshifter/03-PUBLISHING/19-merged-surgical-revision-blueprint.md`)
- Mode:
  - `novella` for compact high-intensity route
  - `novel` for expanded commercial route

## Workflow
1. Load baseline context.
- Read timeline, character bible, continuity QA, and merged blueprint.
- Compute current chapter word counts.

2. Enforce non-negotiables.
- No passivity without counter-move.
- No chronology regressions.
- No unresolved high-impact threat threads by finale.
- Cairo unrest must change operational outcomes, not only atmosphere.

3. Generate surgical matrix.
- Run `scripts/build_surgical_revision_plan.py` to output a chapter plan scaffold with current words + target deltas + seeded directives.

4. Refine directives.
- Add project-current details from latest draft.
- Keep directives concrete and testable.
- Mark each chapter with one dominant objective and one failure risk.

5. Output plan.
- Save a single markdown plan in publishing folder.
- Include execution order and dependency notes.

## Hard Rules
- Always separate `Cut`, `Add`, and `Rewrite` directives.
- Always provide target word deltas by chapter.
- Always include at least one continuity/logic checkpoint per chapter.
- If an instruction is not executable, rewrite it until it is.

## Safety Rules
- Do not alter canon anchors unless the user explicitly approves canon changes.
- Do not issue rewrite directives without chapter-level evidence.
- Keep timeline corrections explicit with concrete dates/timestamps.
- Preserve prior approved constraints (POV, setting era, key subtext motifs) unless user requests changes.

## Resources
- Strategic blueprint: `references/blueprint-merge.md`
- Directive seeds: `references/chapter-directives-seed.json`
- Plan generator: `scripts/build_surgical_revision_plan.py`

## Output Contract
1. One merged revision blueprint.
2. One chapter-by-chapter surgical plan (Ch1-Ch24).
3. Explicit word-delta targets and execution sequence.
4. Clear list of P0 blockers before prose polish.
