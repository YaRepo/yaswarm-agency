---
name: calendar-reminders-ops
description: Plan and schedule tasks through macOS Reminders and Calendar using safe AppleScript workflows. Use when the user asks to add reminders, create events, review today/this-week agenda, or sync plans from notes into time-bound schedules.
---

# Calendar Reminders Ops

## Overview
Use this skill to turn plans into scheduled execution inside macOS Reminders and Calendar.

## Workflow
1. Capture intent.
- Identify whether item belongs in Reminders (task) or Calendar (time block/event).
- Confirm date/time, duration, and priority.

2. Create entries safely.
- Use scripts in dry-run mode first.
- Apply only after confirmation.

3. Review agenda.
- Pull today/this-week reminders and events.
- Highlight conflicts and overloaded days.

4. Weekly sync.
- Convert high-priority note tasks into reminders/events.
- Keep due dates explicit and realistic.

## Safety Rules
- Default to `--dry-run`; require explicit apply.
- Never delete events/reminders without explicit user request.
- Keep timezone-aware scheduling and explicit dates.

## Resources
- AppleScript model: `references/applescript-model.md`
- Scheduling rules: `references/scheduling-rules.md`
- Add reminder: `scripts/add_reminder.py`
- Add calendar event: `scripts/add_calendar_event.py`
- List agenda: `scripts/list_agenda.py`

## Output Contract
1. Proposed or created reminders/events
2. Dates/times/timezone used
3. Conflicts or ambiguities
4. Next scheduling recommendations
