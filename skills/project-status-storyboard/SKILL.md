---
name: project-status-storyboard
description: Convert scattered project notes into a single storyboard view with now/next/blockers, milestones, risks, and owner/action mapping. Use when the user needs status visibility across multiple ongoing projects.
---

# Project Status Storyboard

## Overview
Use this skill to build a compact control board for active projects from fragmented notes.

## Workflow
1. Collect project signals from notes.
2. Group updates by project.
3. Produce now/next/blockers rows.
4. Flag stale projects and missing owners/dates.
5. Publish storyboard markdown.

## Safety Rules
- Preserve uncertain mappings as "unconfirmed".
- Do not close items without explicit evidence.

## Resources
- Board format: `references/storyboard-format.md`
- Builder script: `scripts/build_storyboard.py`

## Output Contract
1. Active projects board
2. Blockers
3. Stale items
4. Suggested owner/date fills
