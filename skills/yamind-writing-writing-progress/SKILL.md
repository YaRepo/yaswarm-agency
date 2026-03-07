---
name: writing-progress
description: "Track and report writing progress across all works. Use when checking word counts, project status, or planning writing sessions."
---

# Writing Progress Tracker

Track and report writing progress across the Writing Desk vault.

## Instructions

When the user wants to check progress:

1. **Scan All Works** - Find files with `type: work` in:
 - `00 Universes/*/Works/`
 - `01 Non-Fiction/`

2. **Extract Metrics** from each work's frontmatter:
 - `title`
 - `status` (planning, writing, revision, completed)
 - `wordcount`
 - `target_words`
 - `datestarted`
 - `due`

3. **Calculate Progress**:
 - Percentage = (wordcount / target_words) * 100
 - Days since started
 - Words per day average (if applicable)
 - Days until deadline (if set)

4. **Generate Report**:

```markdown
# 📊 Writing Progress Report

**Generated:** [DATE]

---

## 🔥 Active Projects

| Work | Status | Progress | Words | Target | Daily Avg |
|------|--------|----------|-------|--------|-----------|
| [Title] | `writing` | ██████░░░░ 60% | 30,000 | 50,000 | 500 |
| [Title] | `revision` | ████████░░ 80% | 8,000 | 10,000 | -- |

---

## 📋 By Status

### 🚀 Writing (Active)
- **[Work Title]** - 30,000 / 50,000 words (60%)
 - Started: [date] • Deadline: [date]
 - Daily average: 500 words

### 🔧 Revision
- **[Work Title]** - In revision (8,000 words)

### 📝 Planning
- **[Work Title]** - Outline in progress

### ✅ Completed
- **[Work Title]** - 75,000 words (completed [date])

---

## 📈 Statistics

| Metric | Value |
|--------|-------|
| Total Works | [X] |
| Active Projects | [X] |
| Total Words (All Time) | [X] |
| Words This Month | [X] |
| Completion Rate | [X]% |

---

## 🎯 Suggested Focus

Based on deadlines and progress:
1. **[Work Title]** - Behind schedule, needs [X] words/day to meet deadline
2. **[Work Title]** - On track, maintain current pace

---

## 📅 Upcoming Deadlines

| Work | Deadline | Days Left | Words Needed |
|------|----------|-----------|--------------|
| [Title] | [date] | [X] days | [X] words |
```

5. **Provide Recommendations**:
 - Which project needs attention
 - Suggested daily word count to meet goals
 - Stalled projects that might need revival

## Status Definitions

| Status | Description | Next Action |
|--------|-------------|-------------|
| `planning` | Outlining, research, character development | Complete outline |
| `writing` | First draft in progress | Continue drafting |
| `revision` | Editing and rewriting | Review and polish |
| `completed` | Finished project | Publish or archive |
| `paused` | Temporarily on hold | Resume when ready |

## Progress Bar Visualization

```
0% ░░░░░░░░░░
25% ██░░░░░░░░
50% █████░░░░░
75% ███████░░░
100% ██████████
```

## Example Usage

User: "How's my writing going?"

Response:
1. Scan all work files
2. Calculate progress for each
3. Generate summary report
4. Highlight urgent deadlines or stalled projects
5. Suggest next action (e.g., "Focus on Chapter 5 of The Last Cartographer - you're 2,000 words behind pace")

User: "Show me progress on Aether Chronicles works"

Response:
1. Filter to only works in Example Universe
2. Show universe-specific progress report

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
