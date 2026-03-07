---
name: location-creator
description: "Create detailed location profiles for your universes. Use when adding settings, places, or environments to your fictional world."
---

# Location Creator

Create detailed location profiles for the Writing Desk vault.

## Instructions

When the user wants to create a new location:

1. **Gather Location Information** - Ask for:
 - Location name
 - Universe it belongs to
 - Location type (city, building, region, planet, etc.)
 - Brief description or atmosphere

2. **Create Location File** at:
 ```
 00 Universes/🌌 [Universe Name]/Locations/[Location Name].md
 ```

3. **Generate Location Profile**:

```markdown
---
tags: [location]
type: location
universe: [[🌌 [Universe Name]]]
location_type: [city/building/region/planet/etc.]
climate:
population:
significance: [major/minor/background]
first_appears:
---

# 📍 [Location Name]

> **[Universe Name]** • `[location_type]` • `[significance]`

> *"[Evocative tagline or local saying]"*

---

## 🌄 Overview

[2-3 paragraph vivid description of this place]

### First Impression
[What do visitors first notice? Sights, sounds, smells?]

---

## 📊 Quick Facts

| Attribute | Details |
|-----------|---------|
| **Type** | `[location_type]` |
| **Climate** | [climate/environment] |
| **Population** | [population or "uninhabited"] |
| **Government** | [how it's ruled/organized] |
| **Economy** | [primary industries] |
| **Notable For** | [what it's known for] |

---

## 🗺️ Geography

### Physical Description
[Terrain, layout, natural features]

### Key Areas
| Area | Description | Significance |
|------|-------------|--------------|
| [District/Zone 1] | | |
| [District/Zone 2] | | |
| [District/Zone 3] | | |

### Nearby Locations
- [[Location 1]] - [direction/distance]
- [[Location 2]] - [direction/distance]

---

## 🏛️ Notable Landmarks

### [Landmark 1]
[Description and significance]

### [Landmark 2]
[Description and significance]

---

## 👥 Inhabitants

### Demographics
[Who lives here? Species, cultures, social classes]

### Key Figures
| Character | Role | Notes |
|-----------|------|-------|
| [[Character]] | [position] | |

### Culture & Customs
[Local traditions, beliefs, social norms]

---

## 📜 History

### Founding
[How and when was this place established?]

### Key Events
| Period | Event | Impact |
|--------|-------|--------|
| | | |

### Current State
[What's happening here now?]

---

## 🎭 Atmosphere & Mood

### Sensory Details
- **Sights:**
- **Sounds:**
- **Smells:**
- **Textures:**

### Emotional Tone
[What feeling does this place evoke? Safety, danger, mystery, decay?]

### Time of Day Variations
- **Dawn:**
- **Midday:**
- **Dusk:**
- **Night:**

---

## 🔧 Story Function

### Scenes Set Here
```dataview
LIST
FROM #chapter OR #scene
WHERE contains(location, this.file.link)
```

### Narrative Purpose
[Why does this location matter to your story?]

### Potential Conflicts
- [Conflict/tension 1]
- [Conflict/tension 2]

---

## 🎨 Visual References

[Images, maps, mood boards]

---

## 📝 Notes

[Free-form notes]

---

*Location ID: [TIMESTAMP]*
```

4. **Update Universe** - Add location to Universe Bible's geography section

5. **Suggest Connections**:
 - Link characters who live/work here
 - Connect to works featuring this location
 - Identify neighboring locations

## Location Types

| Type | Examples |
|------|----------|
| **Region** | Kingdom, continent, territory |
| **City** | Metropolis, town, village |
| **Building** | Castle, tavern, spaceship |
| **Natural** | Forest, mountain, ocean |
| **Abstract** | Dreamscape, digital realm |

## Example Usage

User: "Create the Undercity for Aether Chronicles"

Response: Create detailed location with:
- Industrial underground setting
- Atmosphere matching universe tone
- Connections to existing characters
- Potential story conflicts

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
