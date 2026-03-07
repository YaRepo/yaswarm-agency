---
name: relationship-mapper
description: "Document and visualize character relationships. Use when mapping connections between characters, tracking relationship dynamics, or planning character interactions."
---

# Relationship Mapper

Document character relationships in the Writing Desk vault.

## Instructions

When the user wants to map relationships:

1. **Identify Scope**:
 - Single character's relationships?
 - All relationships in a universe?
 - Relationships within a specific work?

2. **Gather Relationship Data**:
 - Characters involved
 - Relationship type
 - Dynamic (positive, negative, complex)
 - How it changes through the story

3. **Update Character Files** - Add to `relationships` field and Key Relationships table

4. **Create Relationship Map** (optional) - Visual diagram or structured document

---

## Relationship Types

| Type | Examples |
|------|----------|
| **Family** | Parent, sibling, child, cousin, spouse |
| **Romantic** | Love interest, ex, unrequited, rival |
| **Professional** | Boss, colleague, mentor, student |
| **Social** | Friend, enemy, rival, ally |
| **Complex** | Frenemy, complicated history, secret |

## Relationship Dynamics

| Dynamic | Description | Story Potential |
|---------|-------------|-----------------|
| **Allied** | Working together | Teamwork, trust building |
| **Opposed** | In conflict | Tension, confrontation |
| **Neutral** | No strong feelings | Room for development |
| **Complex** | Mixed feelings | Rich character moments |
| **Evolving** | Changing over story | Character arc fuel |

---

## Relationship Entry Format

Add to each character's file:

```markdown
## 👥 Relationships

### Key Relationships
| Character | Type | Dynamic | Notes |
|-----------|------|---------|-------|
| [[Character A]] | mentor | allied → complicated | Betrayal in Act 2 |
| [[Character B]] | rival | opposed | Grudging respect develops |
| [[Character C]] | sibling | complex | Protective but resentful |

### Relationship Details

#### [[Character A]] - Mentor
- **History:** [How they met, shared past]
- **Current State:** [Where things stand now]
- **Tension:** [Source of conflict between them]
- **Evolution:** [How it changes through the story]
```

---

## Relationship Map Document

Create `00 Universes/🌌 [Universe]/Relationship Map.md`:

```markdown
---
tags: [relationships, map]
type: relationship-map
universe: [[🌌 Universe Name]]
---

# 🔗 Relationship Map: [Universe Name]

## Core Relationships

### [Protagonist] Connections
```
 [Mentor]
 ↓ guides
 [Rival] ← [PROTAGONIST] → [Love Interest]
 ↑ opposes ↓ protects
 [Ally] [Family]
```

### Relationship Matrix

| | Char A | Char B | Char C | Char D |
|--|--------|--------|--------|--------|
| **Char A** | — | ally | enemy | neutral |
| **Char B** | ally | — | rival | friend |
| **Char C** | enemy | rival | — | servant |
| **Char D** | neutral | friend | master | — |

## Relationship Arcs

### [Character A] ↔ [Character B]
- **Start:** Strangers
- **Midpoint:** Reluctant allies
- **End:** True friends

### [Protagonist] ↔ [Antagonist]
- **Start:** Unknown to each other
- **Midpoint:** Direct conflict
- **End:** Understanding (or destruction)

## Key Relationship Scenes

| Scene | Characters | Relationship Moment |
|-------|------------|---------------------|
| Ch 3 | A & B | First meeting, instant dislike |
| Ch 7 | A & B | Forced to work together |
| Ch 15 | A & B | Trust established |

## Unresolved Tensions

- [ ] [Character A] hasn't forgiven [Character B] for [event]
- [ ] [Character C]'s secret about [Character D]
- [ ] Love triangle between [A], [B], [C]
```

---

## Dataview Queries for Relationships

### Find all relationships for a character:
```dataview
TABLE WITHOUT ID
 file.link AS "Character",
 relationships AS "Connected To"
FROM "00 Universes"
WHERE contains(relationships, [[Character Name]])
```

### Relationship network:
```dataview
LIST relationships
FROM "00 Universes/🌌 [Universe]/Characters"
WHERE relationships
```

---

## Example Usage

User: "Map the relationships in Aether Chronicles"

Response:
1. Read all character files in the universe
2. Extract existing relationship data
3. Create comprehensive relationship map
4. Identify gaps or undeveloped connections
5. Suggest relationship arcs to develop

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
