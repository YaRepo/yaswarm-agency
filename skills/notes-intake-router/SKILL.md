---
name: notes-intake-router
description: Classify and route raw notes into the right folders with titles, tags, summaries, and action items. Use when the user adds messy notes, voice dumps, bilingual snippets, or uncategorized content and wants fast organization.
---

# Notes Intake Router

## Overview
Use this skill to process new notes quickly and safely: classify, retitle, tag, route, and flag duplicates.

## Workflow
1. Intake parsing.
- Normalize raw text and detect language mix.
- Infer note intent: task, idea, reference, journal, finance, project.

2. Structure upgrade.
- Propose title, summary, and explicit next actions.
- Extract entities: people, project names, dates, tools.

3. Routing.
- Suggest destination folder based on taxonomy.
- Add tags aligned with the note type and domain.

4. Duplicate and conflict checks.
- Flag near-duplicate notes.
- Surface conflicting tasks or repeated reminders.

## Safety Rules
- Default to preview mode; avoid in-place rewrites until approved.
- Never delete notes automatically.
- Preserve original raw note text in output.

## Resources
- Routing taxonomy: `references/routing-taxonomy.md`
- Intake script: `scripts/route_notes.py`

## Output Contract
Always return:
1. Original input excerpt
2. Proposed title/summary/tags
3. Suggested folder and reason
4. Duplicate candidates and confidence
