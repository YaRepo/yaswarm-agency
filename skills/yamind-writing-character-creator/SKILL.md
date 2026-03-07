---
name: character-creator
description: "Create a new character profile linked to a universe. Use when adding protagonists, antagonists, or supporting characters."
---

# Character Creator

Create a detailed character profile for the Writing Desk vault.

## Instructions

When the user wants to create a new character:

1. **Gather Core Information** - Ask for:
 - Character name
 - Universe they belong to (must exist in `00 Universes/`)
 - Role: protagonist, antagonist, or supporting
 - Species (human, alien, fantasy race, etc.)
 - Brief concept or hook

2. **Locate the Universe** - Find the universe folder in `00 Universes/🌌 [Universe Name]/`

3. **Create Character File** at:
 ```
 00 Universes/🌌 [Universe Name]/Characters/[Character Name].md
 ```

4. **Generate Character Profile** with this structure:

```markdown
---
tags: [character]
type: character
universe: [[🌌 [Universe Name]]]
role: [protagonist/antagonist/supporting]
species: [species]
age: [age]
status: alive
relationships: []
first_appears:
---

# 👤 [Character Name]

> **[Universe Name]** • `[role]` • `[species]`

> *"[Character's catchphrase or defining quote]"*

---

## 🎭 Overview

[Vivid 2-3 sentence character description]

### First Impression
[How do others first perceive this character?]

---

## 👤 Profile

| Attribute | Details |
|-----------|---------|
| **Full Name** | [Full name] |
| **Nickname(s)** | [Nicknames] |
| **Age** | `[age]` |
| **Species** | `[species]` |
| **Occupation** | [Job/role in society] |
| **Role** | `[role]` |
| **Status** | `alive` |

### Appearance
[Physical description, distinctive features, clothing style]

### Voice & Speech
[How they speak, accent, catchphrases, verbal tics]

---

## 🧠 Personality

### Core Traits
| Trait | Description |
|-------|-------------|
| [Trait 1] | [Description] |
| [Trait 2] | [Description] |
| [Trait 3] | [Description] |

### Strengths
- [Strength 1]
- [Strength 2]
- [Strength 3]

### Weaknesses
- [Weakness 1]
- [Weakness 2]
- [Weakness 3]

### Fears & Desires
- **Greatest Fear:** [Fear]
- **Deepest Desire:** [Desire]

### Quirks & Habits
- [Quirk 1]
- [Quirk 2]

---

## 🎯 Goals & Motivations

### External Goal
[What they want to achieve]

### Internal Need
[What they actually need to learn/grow]

---

## 👥 Relationships

### Key Relationships
| Character | Relationship Type | Dynamic |
|-----------|------------------|---------|
| | | |

---

## 📖 Story Arc

### Backstory
[Formative events, history before the story begins]

### Character Arc
[How they change throughout the story]

---

## 💬 Character Voice

### Sample Dialogue
[Write dialogue in their voice]

### Key Phrases
- [Phrase 1]
- [Phrase 2]

---

## 📝 Notes

[Free-form notes]

---

*Character ID: [TIMESTAMP]*
```

5. **Link to Universe** - Ensure the `universe` field correctly links to the Universe Bible

6. **Suggest Next Steps**:
 - Define relationships with existing characters
 - Create a work featuring this character
 - Flesh out backstory details

## Role Guidelines

- **Protagonist**: The main POV character(s), drives the plot forward
- **Antagonist**: Opposes the protagonist, creates conflict
- **Supporting**: Allies, mentors, love interests, comic relief

## Example Usage

User: "Create a character named Kira for the Aether Chronicles"

Response: Create `00 Universes/🌌 Example Universe/Characters/Kira.md` with:
- Linked to Example Universe
- Filled profile based on user's description
- Suggested relationship connections

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
