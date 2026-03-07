---
name: bilingual-note-normalizer
description: Normalize mixed Arabic-English notes into consistent titles, summaries, tags, and action items while preserving original text. Use when notes include mixed language, transliteration, or inconsistent wording that hurts retrieval.
---

# Bilingual Note Normalizer

## Overview
Use this skill to standardize bilingual notes for cleaner search, dedupe, and downstream routing.

## Workflow
1. Detect language mix and transliteration.
2. Preserve original text block.
3. Generate normalized title in preferred language and optional translated title.
4. Produce concise bilingual summary.
5. Emit tags and key entities.

## Safety Rules
- Never overwrite original text by default.
- Mark translations as inferred when ambiguous.
- Keep names, brands, and technical terms unchanged unless user asks.

## Resources
- Style policy: `references/style-policy.md`
- Normalizer helper: `scripts/normalize_bilingual_note.py`

## Output Contract
1. Original text
2. Normalized title(s)
3. Bilingual summary
4. Tags/entities and ambiguities
