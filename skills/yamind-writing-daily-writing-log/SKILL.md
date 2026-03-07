---
name: daily-writing-log
description: "Log writing sessions with word counts and notes. Use when starting or ending a writing session, or reviewing daily progress."
---

# Daily Writing Log

Track daily writing sessions in the Writing Desk vault.

## Instructions

### Starting a Session

When the user starts writing:

1. **Check for Today's Journal** in `02 Journal/Daily/[YYYY-MM-DD].md`
 - If exists, open it for updating
 - If not, create it

2. **Create/Update Journal Entry**:

```markdown
---
tags: [journal, daily]
type: journal-entry
date: [TODAY]
mood:
energy:
total_words: 0
sessions: 0
---

# 📔 Journal - [YYYY-MM-DD]

> **Sessions:** `0` • **Total Words:** `0`

---

## 📖 Writing Session Log

### Session 1
| Metric | Value |
|--------|-------|
| **Time** | [START TIME] |
| **Project** | [[📝 Work Title]] |
| **Starting Words** | [current count] |
| **Ending Words** | |
| **Words Written** | |
| **Duration** | |
| **Notes** | |

---

## 🎯 Today's Goals

- [ ] [Goal 1]
- [ ] [Goal 2]
- [ ] [Goal 3]

---

## 💡 Ideas & Inspiration

[Capture ideas that came up during writing]

---

## 📝 Session Notes

[What went well? What was challenging?]

---

*Entry: [TIMESTAMP]*
```

### Ending a Session

When the user finishes writing:

1. **Update the Session Entry**:
 - Record ending word count
 - Calculate words written
 - Calculate duration
 - Add session notes

2. **Update Work File**:
 - Update `wordcount` in the work's frontmatter
 - Add entry to Writing Sessions Log table if present

3. **Generate Summary**:
```
✅ Session Complete!
- Project: [Work Title]
- Words Written: [X] words
- Duration: [X] minutes
- New Total: [X] / [Target] words ([X]%)
```

### Quick Log Mode

For rapid logging without full journal:

User: "Log 500 words on The Last Cartographer"

Response:
1. Update work's wordcount field (+500)
2. Add quick entry to today's journal
3. Confirm: "Logged 500 words. New total: X words (X%)"

## Session Tracking

### Multiple Sessions Per Day

```markdown
### Session 1: Morning
| **Project** | [[Work A]] |
| **Words** | 750 |
| **Time** | 45 min |

### Session 2: Evening
| **Project** | [[Work B]] |
| **Words** | 1,200 |
| **Time** | 60 min |

### Daily Total: 1,950 words
```

## Progress Calculations

| Metric | Formula |
|--------|---------|
| Words/Hour | words_written / (duration_minutes / 60) |
| Daily Average | total_words / days_writing |
| Days to Goal | (target - current) / daily_average |

## Example Usage

User: "Starting a writing session on my novel"

Response:
1. Create/open today's journal
2. Start Session entry with timestamp
3. Note current word count from work file
4. Wish them good writing!

User: "Done writing, wrote about 800 words"

Response:
1. Update session with ending time and word count
2. Update work's wordcount field
3. Show progress summary
4. Ask about session quality/notes

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
