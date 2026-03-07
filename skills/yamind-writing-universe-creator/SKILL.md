---
name: universe-creator
description: "Create a new fictional universe with complete folder structure and Universe Bible. Use when starting a new world for creative writing."
---

# Universe Creator

Create a new fictional universe in the Writing Desk vault.

## Instructions

When the user wants to create a new universe:

1. **Gather Information** - Ask for:
 - Universe name
 - Genre (e.g., Science Fantasy, Urban Fantasy, Historical Fiction)
 - Core themes (2-3 recurring ideas)
 - Brief premise or hook

2. **Create Folder Structure** in `00 Universes/`:
 ```
 00 Universes/🌌 [Universe Name]/
 ├── 🌌 [Universe Name].md (Universe Bible)
 ├── Characters/
 ├── Locations/
 └── Works/
 ```

3. **Generate Universe Bible** using this template structure:

```markdown
---
tags: [universe]
type: universe
created: [TODAY'S DATE]
genre: [GENRE]
works: []
---

# 🌌 [Universe Name]

> **Genre:** `[genre]` | **Created:** [date]

---

## 📖 Universe Bible

### Overview
[2-3 paragraph description of the universe's essence]

### Core Themes
1. [Theme 1]
2. [Theme 2]
3. [Theme 3]

### World Rules
[Magic systems, technology levels, social structures, key laws of this world]

---

## 🗺️ Geography

### Key Locations
| Location | Description | Links |
|----------|-------------|-------|
| | | |

---

## 👥 Characters

### Protagonists
\`\`\`dataview
LIST
WHERE contains(universe, this.file.link) AND role = "protagonist"
FROM "00 Universes"
\`\`\`

### Antagonists
\`\`\`dataview
LIST
WHERE contains(universe, this.file.link) AND role = "antagonist"
FROM "00 Universes"
\`\`\`

### All Characters
\`\`\`dataview
TABLE without ID
 link(file.link, name) AS "Character",
 role AS "Role",
 species AS "Species"
WHERE contains(universe, this.file.link)
FROM "00 Universes"
\`\`\`

---

## 📚 Works in this Universe

\`\`\`dataview
TABLE without ID
 link(file.link, title) AS "Work",
 status AS "Status",
 type AS "Type"
WHERE contains(universe, this.file.link)
FROM "01 Non-Fiction" OR FROM "00 Universes"
\`\`\`

---

## 🔗 Shared Assets

### Recurring Items/Artifacts
-
-
-

### Organizations/Groups
-
-
-

### Lore/History
[Important events, prophecies, legends]

---

## 🎨 Inspiration

### Visual References
[Mood boards, art references]

### Audio
- Playlist:
- Theme songs:

---

## 📝 Notes

[Free-form notes about the universe]

---

*Universe ID: [TIMESTAMP]*
```

4. **Confirm Creation** - Show the user what was created and suggest next steps:
 - Create protagonist character
 - Define key locations
 - Start first work in the universe

## Example Usage

User: "Create a universe for a steampunk mystery series"

Response: Create `00 Universes/🌌 Cogsworth Chronicles/` with:
- Universe Bible with steampunk genre, mystery themes
- Empty Characters/, Locations/, Works/ folders
- Suggest creating a detective protagonist

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
