---
name: legal-admin-tracker
description: Track legal and administrative obligations including IDs, permits, contracts, renewals, and due dates with reminder-ready outputs. Use when the user asks to organize paperwork, deadlines, compliance checklists, or contract follow-ups.
---

# Legal Admin Tracker

## Overview
Use this skill to centralize deadlines, documents, and follow-ups for legal/admin operations.

## Workflow
1. Capture obligations and documents.
2. Normalize dates and responsible party.
3. Build deadline queue with urgency levels.
4. Generate follow-up actions and checklist status.

## Safety Rules
- Mark unknown due dates as unknown; never guess legal deadlines.
- Do not provide legal advice; provide process tracking only.
- Keep originals immutable in preview workflows.

## Resources
- Checklist template: `references/checklist-template.md`
- Tracker script: `scripts/deadline_queue.py`

## Output Contract
1. Deadline queue
2. Missing documents list
3. Follow-up actions
4. Risks and unresolved items
