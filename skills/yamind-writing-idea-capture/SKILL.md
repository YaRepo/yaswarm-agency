---
name: idea-capture
description: "Quickly capture story ideas to the Idea Vault. Use when you have a story concept, premise, or creative spark to save."
---

# Idea Capture

Quickly capture story ideas to the Writing Desk Idea Vault.

## Instructions

When the user has an idea to capture:

1. **Get the Essentials** - Ask for (or extract from their message):
 - Idea title or working name
 - The core concept (what's the idea?)
 - Genre/type (if known)
 - Initial excitement level (seed, sprout, sapling)

2. **Create Idea File** at:
 ```
 03 Research/💡 Ideas/[Idea Title].md
 ```

3. **Generate Quick Idea Entry**:

```markdown
---
tags: [idea, vault]
type: idea-vault
status: seed
created: [TODAY'S DATE]
---

# 💡 [Idea Title]

> **Type:** `[idea_type]` • **Status:** `seed` • **Created:** [date]

> *"[Hook or tagline]"*

---

## 🎯 Concept

### The Idea
[Capture the core idea in 2-4 paragraphs - what the user described]

### Why This Story?
[Why is this idea exciting? What makes it worth telling?]

---

## 📊 Metadata

| Attribute | Value |
|-----------|-------|
| **Type** | `[novel/short story/series/etc.]` |
| **Genre** | `[genre]` |
| **Format** | [format] |
| **Status** | `seed` |
| **Potential** | `[high/medium/low]` |

### Idea Stages
- [x] Seed (initial spark)
- [ ] Sprout (developing)
- [ ] Sapling (outline exists)
- [ ] Tree (actively writing)

---

## 🎨 Core Elements

### Premise
[One sentence: Who wants what, and what's stopping them?]

### Hook
[What grabs the reader?]

### Theme
[What's the deeper meaning or question?]

---

## 👥 Characters (Initial Thoughts)

### Protagonist
[Who might the main character be?]

### Antagonist
[Who or what creates conflict?]

---

## 🗺️ Setting

### Where?
[Initial setting ideas]

### When?
[Time period]

---

## 📖 Potential Plot

### Beginning
[How might it start?]

### Middle
[What's the core conflict?]

### End
[How might it resolve?]

---

## 🚀 Next Steps

- [ ] Flesh out concept
- [ ] Create character sketches
- [ ] Develop outline
- [ ] Decide if this becomes a project

---

## 💭 Questions to Explore

1. [Question about the idea]
2. [Question about the idea]
3. [Question about the idea]

---

*Idea ID: [TIMESTAMP]*
```

4. **Confirm Capture** - Tell the user where it's saved and suggest:
 - Developing it further when ready
 - Connecting to existing universes if applicable
 - Moving to active project when it's ready

## Quick Capture Mode

For rapid idea capture, accept minimal input:

User: "Idea: What if ghosts could only be seen in mirrors?"

Response: Create a seed idea with:
- Title: "Mirror Ghosts" (or similar)
- Core concept captured
- Genre: Horror/Supernatural (inferred)
- Status: seed
- Prompt questions to develop later

## Idea Status Definitions

| Status | Description | Action |
|--------|-------------|--------|
| `seed` | Initial spark, raw concept | Let it rest or brainstorm |
| `sprout` | Developing, more details | Explore characters/plot |
| `sapling` | Has outline or structure | Ready to become a project |
| `tree` | Active project | Move to Works folder |

## Example Usage

User: "I have an idea about a librarian who discovers books are portals to the worlds they describe"

Response:
1. Create `03 Research/💡 Ideas/Portal Library.md`
2. Capture concept, suggest fantasy genre
3. Note potential themes (escapism, power of stories)
4. Add questions: "Are all books portals? Can she get trapped?"

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
