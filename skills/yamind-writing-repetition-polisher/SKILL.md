---
name: repetition-polisher
description: "Scan prose for repeated words, phrases, and sentence patterns, then suggest smart edits to vary diction without losing voice. Use when a draft feels repetitive, when you want richer diction, or when you need a repetition audit and rewrite plan."
---

# Repetition Polisher

Find and fix repetition in a way that keeps the voice alive and the prose varied.

## How to Use

1. Run the scanner on a draft to surface repeats.
2. Classify repeats as intentional echo or accidental redundancy.
3. Apply smart edits using the strategies reference.

## Tools

- Run: `python scripts/scan_repetition.py path/to/draft.txt`
- Optional project ignore profile: create `.repetition-ignore.json` in project root to auto-exclude intentional repeats.
- Explicit ignore profile: `python scripts/scan_repetition.py path/to/draft.txt --ignore-profile path/to/profile.json`
- Read: `references/repetition-strategies.md` for edit tactics and rewrites.

## Workflow

1. Scan the text and collect flagged repeats.
2. Group by type: near repeats, phrase repeats, sentence openings.
3. Decide what to keep (intentional emphasis) vs. what to vary.
4. Rewrite using a mix of synonym shift, syntax change, or detail swap.
5. Re-scan to confirm reduction without flattening voice.

## Output Expectations

- List the most distracting repeats first.
- Provide 1 to 3 rewrite options for each repeated pattern.
- Preserve the original meaning unless asked to replot or expand.

## Use This Skill When
- Use when this specialization is needed for the current task.
- Use when the task requires repeatable workflow guidance, not ad-hoc guessing.
- Use when working across any project, unless a stricter project or series scope applies.

## Safety Rules
- Prefer reversible, minimal changes first.
- Do not overwrite user content without explicit confirmation.
- Report assumptions and blockers instead of guessing hidden requirements.
- Keep sensitive data and credentials out of generated outputs.

## Output Contract
1. Clear execution summary for what was done and why.
2. Concrete deliverables (files, artifacts, or decisions) produced.
3. Validation status and remaining risks.
4. Exact next actions if further work is needed.
