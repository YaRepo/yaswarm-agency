---
name: arabic
description: "Arabic language mastery for MSA and major dialects. Use when translating, localizing, rewriting, or analyzing Arabic-English text with dialect and tone precision."
---

# Arabic Language Mastery (YaSlang)

## Purpose
Provide high-precision Arabic/English conversion with dialect awareness, tone control, and ambiguity handling.

## Progressive Loading
- Fast path: `references/quickstart-runtime.md`
- Full language playbook: `references/full-playbook.md`
- Original upstream reference: `/Users/yascene/YaMind-Writer-Desk/Skills/Writing-Skills/Yaslang/SKILL.md`

## Use This Skill When
- Use when handling Modern Standard Arabic or dialect text.
- Use when the user needs Arabic <-> English conversion (`US` or `UK`).
- Use when dialect detection affects meaning (Egyptian/Levantine/Gulf/Maghrebi/etc.).
- Use when preserving cultural subtext and register matters.

## Inputs
- Source text
- Direction (`ar->en`, `en->ar`, dialect->dialect)
- Target locale (`US` or `UK` for English)
- Register (formal, neutral, conversational, street)
- Domain context (literary, legal, technical, social)

## Workflow
1. Lock direction and locale.
2. Detect dialect cues (or ask user if ambiguous).
3. Translate meaning-first, then tune tone.
4. Preserve names, technical terms, and canon terms consistently.
5. Return primary output + alternate rendering for ambiguous segments.
6. Add short QA notes for terminology and uncertainty flags.

## Fast Dialect Cues
- Egyptian: `eh`, `mish`, hard `g` for `ج`
- Levantine: `shu`, `biddi`, `ma...sh`
- Gulf: `shlon`, `abi/abgha`
- Maghrebi: strong French/Berber influence, compressed vowels
- Iraqi: `shinu` with Iraqi lexical patterns

## Escalation to Deep References
Load `references/full-playbook.md` when you need:
- Full morphology/root-pattern guidance
- Detailed dialect family comparisons
- Extended disambiguation and diacritization logic

Optional structured resources:
- `references/roots.json`
- `references/cultural.json`

## Safety Rules
- Do not fabricate facts while translating informational content.
- Flag uncertainty instead of silently guessing.
- Preserve intent and voice unless user requests transformation.
- Keep sensitive cultural/religious phrasing neutral unless instructed otherwise.

## Output Contract
1. Language setup (direction, dialect assumption, locale, register).
2. Primary translation/localization output.
3. Alternate rendering for ambiguous text.
4. QA notes: key term choices, idiom treatment, and uncertainty flags.
