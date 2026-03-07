---
name: arabic-english-dialect-translator
description: Translate between Modern Standard Arabic and Egyptian Arabic to English (US or UK) and vice versa, with explicit control of dialect, tone, formality, and localization choices. Use when the user asks for accurate bilingual translation, rewriting, or localization across Arabic and English variants.
---

# Arabic English Dialect Translator

## Overview
Use this skill for high-accuracy translation between:
- Modern Standard Arabic (MSA)
- Egyptian Arabic (colloquial)
- English US (`en-US`)
- English UK (`en-GB`)

## Workflow
1. Confirm translation direction.
- `ar -> en` or `en -> ar`

2. Confirm source and target variants.
- Arabic source/target: `msa` or `egy`
- English target/source: `en-US` or `en-GB`

3. Preserve intent and context.
- Keep meaning, tone, and register.
- For idioms/slang, provide natural equivalent, not literal only.

4. Provide output modes when helpful.
- Direct translation only
- Translation + literal gloss
- Translation + cultural/context notes

5. Run quality checks.
- Numbers, dates, names, and brand terms preserved.
- Grammar and punctuation aligned with target standard.
- Locale spelling aligned (`color/colour`, `organize/organise`, etc.).

## Safety Rules
- If text is ambiguous, return best translation and mark ambiguity.
- Preserve proper nouns unless user asks to transliterate.
- Never invent missing facts; only translate provided content.

## Resources
- Dialect notes: `references/dialect-notes.md`
- Locale mapping: `references/uk-us-style-map.md`
- Locale converter: `scripts/locale_spelling_swap.py`
- Translation QA helper: `scripts/translation_qa.py`

## Output Contract
1. Final translation
2. Variant used (msa/egy + en-US/en-GB)
3. Ambiguities or alternatives (if any)
4. Optional literal gloss when requested
