---
name: work-creator
description: "Create a new writing project (novel, short story, article). Use when starting a new book, story, or other written work."
---

# Work Creator

Create a new writing project in the Writing Desk vault.

## Instructions

When the user wants to start a new work:

1. **Gather Project Information** - Ask for:
 - Title
 - Work type: novel, novella, short story, article, essay, etc.
 - Genre
 - Universe (if fiction, link to existing universe; can be standalone)
 - Target word count
 - Logline (one-sentence summary)

2. **Determine Location**:
 - **Fiction with universe**: `00 Universes/🌌 [Universe]/Works/[Title].md`
 - **Fiction standalone**: `00 Universes/[Title]/[Title].md` (create new universe)
 - **Non-fiction**: `01 Non-Fiction/[Category]/[Title].md`

3. **Create Work File** with this structure:

```markdown
---
tags: [work]
type: work
universe: [[🌌 [Universe Name]]]
work_type: [novel/novella/short story/article]
genre: [genre]
status: planning
wordcount: 0
target_words: [target]
datestarted: [TODAY]
due:
publish_status: draft
---

# 📝 [Title]

> **`[work_type]`** • **`[genre]`** • **Universe:** `[universe]`

> *[Logline]*

---

## 🎯 Overview

### Logline
[One sentence summary]

### Premise
[One paragraph summary expanding on the logline]

### Target Audience
[Who is this for?]

---

## 📊 Project Status

| Metric | Value |
|--------|-------|
| **Status** | `planning` |
| **Word Count** | `0` / `[target]` |
| **Started** | `[date]` |
| **Deadline** | |
| **Publish Status** | `draft` |

---

## 📖 Synopsis

### Short Summary (1-2 paragraphs)
[Brief plot summary]

### Detailed Synopsis
[Full plot breakdown]

---

## 👥 Characters

### Character Roster
| Character | Role | Arc |
|-----------|------|-----|
| | | |

---

## 🗺️ Setting

### Key Locations
[Where does this story take place?]

### Time Period
[When does this story occur?]

---

## 📚 Structure

### Chapter List
| Chapter | Title | Status | Words |
|---------|-------|--------|-------|
| 01 | | planning | 0 |
| 02 | | planning | 0 |
| 03 | | planning | 0 |

---

## 🎨 Themes & Motifs

### Major Themes
1. [Theme 1]
2. [Theme 2]
3. [Theme 3]

---

## 🎯 Plot Beats

### Act I: Setup
[Opening, inciting incident, first plot point]

### Act II: Confrontation
[Rising action, midpoint, complications]

### Act III: Resolution
[Climax, resolution, ending]

---

## 🔧 Project Management

### Current Tasks
- [ ] Complete outline
- [ ] Create main characters
- [ ] Write first chapter

---

## 📅 Timeline

### Milestones
| Milestone | Target | Actual |
|-----------|--------|--------|
| Outline Complete | | |
| First Draft | | |
| Revision | | |
| Final Edit | | |

---

## 📝 Notes

[Free-form notes]

---

*Work ID: [TIMESTAMP]*
```

4. **Update Universe** (if applicable):
 - Add work link to the Universe Bible's `works` frontmatter field

5. **Suggest Next Steps**:
 - Create or link characters
 - Develop chapter outline
 - Set writing schedule/milestones

## Word Count Guidelines

| Work Type | Typical Range |
|-----------|---------------|
| Flash Fiction | 500-1,000 |
| Short Story | 1,000-7,500 |
| Novelette | 7,500-17,500 |
| Novella | 17,500-40,000 |
| Novel | 50,000-100,000 |
| Epic Novel | 100,000+ |

## Example Usage

User: "Start a new novel called 'The Last Cartographer' in the Aether Chronicles"

Response: Create work file with:
- Linked to Example Universe
- Status: planning
- Chapter template ready
- Suggest creating protagonist if none exists

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
