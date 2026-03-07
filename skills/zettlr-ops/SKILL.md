---
name: zettlr-ops
description: Operate and enhance Zettlr workspaces for long-form writing, research notes, citations, and Zettelkasten linking. Use when the user asks to structure manuscripts, enforce markdown/frontmatter standards, manage references, or prepare export-ready files in a Zettlr project.
---

# Zettlr Ops

## Overview
Use this skill to turn raw writing folders into clean, high-velocity Zettlr workspaces for books, research, and note systems.

## What I Can Do Reliably
- Create and edit markdown files/folders that Zettlr reads.
- Standardize YAML frontmatter, headings, links, and section templates.
- Set up citation workflow (`references.json`/Bib data + citekey usage patterns).
- Build Zettelkasten-compatible note structures (IDs, tags, internal links).
- Run workspace audits for missing metadata, broken links, and inconsistent file naming.

## What Requires App/UI Permissions
- Clicking in Zettlr UI panes, dragging tabs, and changing preferences visually.
- Those remain user-driven unless explicit UI automation is set up.

## Workflow
1. Workspace intake.
- Identify the active workspace folder and writing goal (book, notes, paper).
- Detect whether citation database exists.

2. Structure pass.
- Enforce directory and filename conventions.
- Add/normalize frontmatter (`title`, `keywords`, optional author/date).

3. Content pass.
- Generate or refine outlines, chapters, and sections.
- Add internal links (`[[note-id]]`) and tags where useful.

4. Research/citation pass.
- Validate citekey patterns (`@CiteKey`, `[@CiteKey, p. 12]`).
- Verify references file presence and format.

5. Quality pass.
- Run workspace audit and return actionable fix list.

## Safety Rules
- Never delete notes by default.
- Default to additive edits and explicit patch summaries.
- Preserve original drafts when applying large rewrites.

## Resources
- Tutorial-derived feature notes: `references/zettlr-feature-map.md`
- Citation quick reference: `references/citation-patterns.md`
- Automation boundaries: `references/automation-boundaries.md`
- Workspace auditor: `scripts/audit_zettlr_workspace.py`
- Note scaffolder: `scripts/scaffold_zettlr_note.py`
- Zettlr launcher: `scripts/launch_zettlr.py`

- Book project bootstrap: `scripts/bootstrap_book_project.py`
- Chapter quality check: `scripts/chapter_quality_check.py`
- Citekey validator: `scripts/validate_citekeys.py`
- Wikilink repair: `scripts/repair_wikilinks.py`
## Output Contract
1. Files created/updated
2. Structural/citation issues found
3. Exact recommended next edits in Zettlr
4. Any constraints requiring manual UI actions
