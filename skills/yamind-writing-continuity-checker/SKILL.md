---
name: continuity-checker
description: "Scan for consistency issues in your universe and works. Use when checking for plot holes, contradictions, or timeline problems."
---

# Continuity Checker

Scan for consistency issues in Writing Desk content.

## Instructions

When the user wants to check continuity:

1. **Define Scope**:
 - Entire universe?
 - Specific work?
 - Character consistency?
 - Timeline accuracy?

2. **Scan Relevant Files**:
 - Universe Bible
 - Character profiles
 - Work files and chapters
 - Location descriptions
 - Timeline documents

3. **Check for Issues** (see categories below)

4. **Generate Report** with findings and suggestions

---

## Continuity Categories

### 🧑 Character Consistency

Check for:
- [ ] Name spelling variations
- [ ] Age contradictions (birth year vs. stated age)
- [ ] Appearance changes (eye color, height, etc.)
- [ ] Personality shifts without story justification
- [ ] Skills/abilities appearing without establishment
- [ ] Knowledge they shouldn't have

### 📍 Location Consistency

Check for:
- [ ] Geography contradictions (north vs. south, distances)
- [ ] Description changes (building details, climate)
- [ ] Population/size inconsistencies
- [ ] Travel time issues (too fast/slow between locations)

### ⏰ Timeline Consistency

Check for:
- [ ] Impossible simultaneity (character in two places)
- [ ] Age/date mismatches
- [ ] Season/weather contradictions
- [ ] Historical event timing
- [ ] "Last week" references that don't add up

### 📖 Plot Consistency

Check for:
- [ ] Unresolved plot threads
- [ ] Contradictory information
- [ ] Characters forgetting what they learned
- [ ] Objects appearing/disappearing
- [ ] Rules of magic/technology violated

### 🌍 World Rules

Check for:
- [ ] Magic system inconsistencies
- [ ] Technology anachronisms
- [ ] Social/political contradictions
- [ ] Economic impossibilities

---

## Continuity Report Template

```markdown
# 🔍 Continuity Report: [Scope]

**Checked:** [Date]
**Files Scanned:** [Number]

---

## Summary

| Category | Issues Found | Severity |
|----------|--------------|----------|
| Character | [X] | 🔴/🟡/🟢 |
| Location | [X] | 🔴/🟡/🟢 |
| Timeline | [X] | 🔴/🟡/🟢 |
| Plot | [X] | 🔴/🟡/🟢 |
| World Rules | [X] | 🔴/🟡/🟢 |

**Total Issues:** [X]

---

## 🔴 Critical Issues

### Issue 1: [Character] age contradiction
- **Found in:** [[File A]], [[File B]]
- **Problem:** Born in Year 47, but stated as 25 in Year 65 (should be 18)
- **Suggested Fix:** Update age to 18 or birth year to Year 40

### Issue 2: [Timeline] impossible travel
- **Found in:** Chapter 5
- **Problem:** Character travels from City A to City B in 2 hours, previously established as 3-day journey
- **Suggested Fix:** Adjust time or add explanation (fast travel method?)

---

## 🟡 Minor Issues

### Issue 3: [Character] eye color change
- **Found in:** [[Character File]] vs Chapter 8
- **Problem:** "Blue eyes" in profile, "grey eyes" in chapter
- **Suggested Fix:** Standardize to one color

---

## 🟢 Nitpicks

### Issue 4: Spelling variation
- **Found in:** Multiple files
- **Problem:** "Grey" vs "Gray" used interchangeably
- **Suggested Fix:** Choose one spelling and find/replace

---

## Unresolved Plot Threads

- [ ] [Character] promised to return the artifact - never resolved
- [ ] [Subplot] about the missing courier - dropped after Ch 7
- [ ] [Mystery] of who sent the letter - not revealed

---

## Recommendations

1. **High Priority:** Fix critical timeline issue before continuing
2. **Medium Priority:** Update character ages across all files
3. **Low Priority:** Standardize spelling conventions

---

## Files Scanned

- [[📖 Universe Bible]]
- [[Character 1]], [[Character 2]], [[Character 3]]
- [[📝 Work Title]] (Chapters 1-15)
- [[Timeline]]
```

---

## Scanning Approach

### For Character Consistency:
1. Extract all character mentions from chapters
2. Compare to character profile fields
3. Flag mismatches

### For Timeline:
1. Build event sequence from chapters
2. Calculate implied time passages
3. Check against explicit dates/times

### For World Rules:
1. List established rules from Universe Bible
2. Scan for rule applications in story
3. Flag violations

---

## Example Usage

User: "Check continuity for my Aether Chronicles novel"

Response:
1. Read Universe Bible for established rules
2. Read all character profiles
3. Scan chapters for references
4. Cross-reference and identify discrepancies
5. Generate prioritized report
6. Offer to fix simple issues (spelling, age math)

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
