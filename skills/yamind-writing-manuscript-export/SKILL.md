---
name: manuscript-export
description: "Compile chapters into a single manuscript document. Use when preparing for beta readers, submission, or creating a readable draft."
---

# Manuscript Export

Compile Writing Desk chapters into a single manuscript document.

## Instructions

When the user wants to export a manuscript:

1. **Identify the Work**:
 - Which work to export?
 - What chapters/scenes to include?
 - Export format preferences?

2. **Gather Content**:
 - Read work file for structure
 - Collect all chapter/scene files
 - Order by chapter/scene number

3. **Compile Manuscript** with proper formatting

4. **Output** to specified location

---

## Export Formats

### Standard Manuscript Format
Industry-standard for submissions:
```markdown
[Author Name]
[Address]
[Email]
[Word Count]

# [TITLE]

by [Author Name]

---

## Chapter One

[Chapter content with proper paragraph spacing]

[Scene break indicated by ###]

[Continued content]

---

## Chapter Two

[Content continues...]
```

### Beta Reader Format
Easy to read and comment on:
```markdown
# [Title] - Beta Reader Draft

**Version:** [Date]
**Word Count:** [X]
**Note to Readers:** [Any guidance for betas]

---

## Chapter 1: [Title]

[Content]

---

### Reader Questions for Chapter 1
- Does the opening hook you?
- Is the protagonist's motivation clear?
- Any confusing parts?

---

## Chapter 2: [Title]

[Content]

---
```

### E-Reader Format
Clean for personal reading:
```markdown
# [Title]

---

## Chapter 1

[Content - no metadata, just story]

---

## Chapter 2

[Content]

---
```

---

## Manuscript Template

```markdown
---
title: [Work Title]
author: [Author Name]
version: [Draft Number/Date]
wordcount: [Total]
exported: [Export Date]
---

# [TITLE]

by [Author Name]

---

## Front Matter (Optional)

### Dedication
[Dedication text]

### Epigraph
> "[Quote]"
> — [Attribution]

---

## Chapter One: [Chapter Title]

[Full chapter content]

[Scene breaks marked with centered ###]

###

[Continued content]

---

## Chapter Two: [Chapter Title]

[Content]

---

[Continue for all chapters]

---

## Back Matter (Optional)

### Acknowledgments
[Thank yous]

### About the Author
[Bio]

---

**THE END**

---

*Exported from Writing Desk on [Date]*
*Total Word Count: [X]*
```

---

## Export Process

### Step 1: Scan for Chapters
```
Look in:
- [Work]/Chapters/
- Files tagged #chapter where work = [[Work]]
- Inline chapters in work file
```

### Step 2: Order Content
```
Sort by:
- chapter_number field
- scene_number field
- Filename if no metadata
```

### Step 3: Clean Content
```
Remove:
- YAML frontmatter
- Dataview queries
- Template placeholders
- Internal links (convert to plain text)
- Metadata tables
```

### Step 4: Format
```
Apply:
- Chapter headings
- Scene break markers
- Paragraph spacing
- Consistent styling
```

### Step 5: Export
```
Save to:
- 03 Research/Exports/[Title] - [Version].md
- Or user-specified location
```

---

## Export Options

| Option | Description |
|--------|-------------|
| `--with-metadata` | Include word counts per chapter |
| `--beta` | Add reader question sections |
| `--submission` | Standard manuscript format |
| `--chapters X-Y` | Export only specific chapters |
| `--no-notes` | Strip author notes |

---

## Post-Export Checklist

After exporting, verify:

- [ ] All chapters included and in order
- [ ] Scene breaks properly marked
- [ ] No broken links or template text
- [ ] Word count is accurate
- [ ] Chapter titles match
- [ ] No duplicate content

---

## Example Usage

User: "Export my novel for beta readers"

Response:
1. Identify work file
2. Scan for all chapters
3. Compile in reading order
4. Add beta reader questions after each chapter
5. Include version number and date
6. Save to Exports folder
7. Report: "Exported 15 chapters, 52,000 words"

User: "Create a manuscript of chapters 1-5"

Response:
1. Export only specified chapters
2. Standard manuscript format
3. Include front matter template
4. Note partial export in filename

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
