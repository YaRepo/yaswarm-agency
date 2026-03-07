---
name: scene-writer
description: "Write or outline a scene/chapter with proper structure. Use when drafting scenes, developing chapters, or working on prose."
---

# Scene Writer

Help write and structure scenes for the Writing Desk vault.

## Instructions

When the user wants to write a scene:

1. **Gather Scene Context** - Ask for or determine:
 - Which work this scene belongs to
 - Chapter number and scene number
 - POV character (from universe's Characters/)
 - Location
 - Scene purpose (what happens, why it matters)

2. **Read Existing Context**:
 - Read the work's synopsis and plot beats
 - Read the POV character's profile for voice/personality
 - Check previous scenes for continuity

3. **Create Scene File** at:
 ```
 [Work Location]/Chapters/Chapter [X] - Scene [Y].md
 ```

 Or within the work file if using inline chapters.

4. **Structure the Scene** using this template:

```markdown
---
tags: [chapter]
type: chapter
work: [[📝 [Work Title]]]
chapter_number: [X]
scene_number: [Y]
POV_character: [[Character Name]]
location: [Location]
status: draft
wordcount: 0
datewritten: [TODAY]
---

# Chapter [X]: [Chapter Title]

> **POV:** `[[Character Name]]` • **Location:** `[Location]` • **Status:** `draft`

---

## 🎯 Scene Purpose

### What happens?
[Brief summary of events]

### Why does this scene exist?
[Its function in the story - advance plot, reveal character, build tension, etc.]

### What changes?
[What's different at the end - character state, plot status, relationships]

---

## 🎬 Scene Structure

### Entry
[How the scene opens - character's initial state, setting establishment]

### Conflict
[The tension or problem driving this scene]

### Turning Point
[How things change or escalate]

### Exit
[How it ends - hook for next scene]

---

## 🎨 Scene Elements

### Sensory Details
- **Sight:**
- **Sound:**
- **Smell:**
- **Touch:**
- **Taste:**

### Emotional Beat
[What emotion should the reader feel?]

### Key Dialogue
[Important lines that must be said]

---

## ✍️ Draft

[SCENE CONTENT GOES HERE]

---

## 📝 Post-Write Notes

### Word Count: 0

---

*Session: [DATE]*
```

5. **Writing Assistance** - When drafting prose:
 - Match the POV character's voice and speech patterns
 - Use sensory details appropriate to the setting
 - Maintain consistent tone with the work's genre
 - Show character emotion through action and dialogue
 - End with a hook or question to pull readers forward

## Scene Purpose Types

| Purpose | Description |
|---------|-------------|
| **Action** | Something physical happens, plot advances |
| **Revelation** | Information is revealed to character or reader |
| **Character** | Deep dive into character's psyche or growth |
| **Relationship** | Develops connection between characters |
| **Atmosphere** | Establishes mood, setting, or tension |
| **Transition** | Bridges between major plot points |

## POV Guidelines

- **First Person**: "I walked through the market..."
- **Third Limited**: "She walked through the market, noting the unusual silence..."
- **Third Omniscient**: "The market was silent. Sarah noticed it; the vendors did not."

## Example Usage

User: "Write the opening scene for The Last Cartographer"

Response:
1. Check the work file for premise and tone
2. Identify POV character from characters roster
3. Create Chapter 01 - Scene 01.md
4. Draft opening with strong hook, sensory details, character voice
5. Update work file's chapter list

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
