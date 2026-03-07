---
name: skill-upgrade-governor
description: Audit, enhance, and upgrade existing skills by detecting structural gaps, weak trigger descriptions, missing resources, stale scripts, and quality regressions. Use when the user asks to improve current skills, run health checks, or continuously maintain skill quality across the system.
---

# Skill Upgrade Governor

## Overview
Use this skill to continuously improve your skill library by finding weaknesses and proposing targeted upgrades with minimal disruption.

## Workflow
1. Inventory and baseline.
- Scan all skills under `~/.codex/skills`.
- Record required files, resource folders, scripts, and metadata quality.

2. Quality audit.
- Validate frontmatter (`name`, `description`) and trigger clarity.
- Detect placeholders and unfinished markers, missing `agents/openai.yaml`, and weak output contracts.
- Flag missing safety rules or weak workflow structure.

3. Risk and priority scoring.
- Classify issues as critical/high/medium/low.
- Prioritize issues that reduce invocation quality or produce unsafe edits.

4. Upgrade planning.
- Propose exact file-level patches and rationale.
- Keep upgrades backward-compatible where possible.

5. Verification loop.
- Re-run audit after edits.
- Produce delta report showing improved score and remaining gaps.

## Safety Rules
- Never auto-delete existing skills.
- Default to patch proposals; apply edits only when requested.
- Keep change logs explicit: file, issue, fix, impact.

## Resources
- Quality rubric: `references/quality-rubric.md`
- Upgrade playbook: `references/upgrade-playbook.md`
- Auditor script: `scripts/audit_skills.py`

## Output Contract
1. Skill health scoreboard
2. Prioritized weakness list
3. Patch plan by file
4. Post-upgrade verification status
