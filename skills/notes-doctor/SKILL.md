---
name: notes-doctor
description: Organize, categorize, rewrite, deduplicate, and index personal notes on macOS for long-term memory and faster retrieval. Use when the user asks to clean up notes, re-organize note folders, merge duplicate notes, improve note quality, add structured summaries/action items, or maintain an indexed memory of their notes for future context-aware updates.
---

# Notes Doctor

Use this skill to safely reorganize local notes with preview-first workflows and repeatable scripts.

## Workflow

1. Scan note corpus.
- Run `scripts/scan_notes.sh <notes_root>`.
- Capture inventory before edits.

2. Classify and tag.
- Run `scripts/classify_notes.py --root <notes_root> --out <jsonl>`.
- Review category/tag suggestions before rewriting.

3. Rewrite for structure.
- Run `scripts/rewrite_note.py --file <note>` to normalize title, summary, and action items.
- Use `--in-place` only after previewing output.

4. Detect duplicates.
- Run `scripts/dedupe_notes.py --root <notes_root> --out <json>`.
- Never delete automatically; report candidate groups.

5. Build memory index.
- Run `scripts/build_notes_index.py --root <notes_root> --out <index.json>`.
- Rebuild after major note updates.

## Safety Rules

- Default to dry-run and preview outputs.
- Never delete notes automatically.
- Write backups before in-place rewrites.
- Keep paths and changes explicit in responses.

## References

- Category taxonomy: `references/taxonomy.md`
- Style conventions: `references/style-guide.md`

## Output Contract

Always provide:
1. What was scanned and changed
2. Which files were rewritten or flagged
3. Duplicate groups needing human decision
4. Location of exported index/report files
