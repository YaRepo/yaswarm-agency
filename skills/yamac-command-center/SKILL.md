---
name: yamac-command-center
description: Run weekly planning and control loops across YaMac notes by extracting tasks, rolling up project status, and maintaining archive hygiene. Use when the user asks for weekly review, project tracking, task consolidation, or command-center updates.
---

# YaMac Command Center

## Overview
Use this skill to maintain a reliable weekly operating system across `YaMac - Knowledge`, `Projects`, `Tasks`, `Journal`, and `Archive`.

## Workflow
1. Scan and summarize.
- Inventory note groups and recent activity.
- Highlight stale projects and overloaded task lists.

2. Task extraction.
- Pull actionable tasks from notes and normalize into one task list.
- Convert vague tasks into verb-first actions.

3. Project rollup.
- Produce status for each active project: now, next, blocked.
- Capture dependencies and owners when available.

4. Weekly reset.
- Close completed tasks.
- Move dead notes to archive candidates.
- Publish a short command-center brief.

## Safety Rules
- Never delete notes automatically.
- Flag archive candidates first; require confirmation before moving/deleting.
- Keep original wording available when rewriting tasks.

## Resources
- Weekly format: `references/weekly-brief-template.md`
- Task extraction script: `scripts/weekly_rollup.py`

## Output Contract
Always return:
1. Active projects summary
2. Consolidated task list
3. Blockers and missing info
4. Archive candidates for review
