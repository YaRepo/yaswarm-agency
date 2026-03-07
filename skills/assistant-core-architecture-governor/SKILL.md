---
name: assistant-core-architecture-governor
description: "Govern and upgrade the assistant core architecture using YaSwarm-style patterns: identity files (SOUL.md, USER.md), markdown-first memory with SQLite indexing, heartbeat loops, and adapter boundaries. Use when the user asks to harden assistant reliability, continuity, memory quality, and integration design."
---

# Assistant Core Architecture Governor

## Overview
Use this skill to keep your assistant stack coherent, auditable, and resilient by enforcing core architecture standards across identity, memory, scheduling, and integrations.

## Workflow
1. Identity layer audit.
- Check required identity/context files: `SOUL.md`, `USER.md`, `AGENTS.md`.
- Validate that assistant behavior constraints and user preferences are explicit.

2. Memory architecture audit.
- Enforce markdown-first source of truth: `MEMORY.md` + `memory/*.md` daily logs.
- Validate SQLite memory index presence and path policy.
- Ensure memory can be rebuilt from markdown source.

3. Heartbeat and automation audit.
- Check `HEARTBEAT.md` and cadence policy.
- Confirm recurring maintenance loops and actionable checklist quality.

4. Adapter boundary audit.
- Validate adapter manifests/configs and transport type boundaries.
- Ensure failure handling, retries, and restart policy are documented.

5. Upgrade plan and verification.
- Produce prioritized patch list by severity.
- Apply safe upgrades when requested.
- Re-run validation and report delta.

## Safety Rules
- Never delete architecture files automatically.
- Preserve historical memory logs.
- Apply minimal, reversible changes first.
- Mark inferred checks as inferred when metadata is missing.

## Resources
- Core architecture checklist: `references/core-checklist.md`
- Memory model policy: `references/memory-model.md`
- Heartbeat policy: `references/heartbeat-policy.md`
- Adapter model policy: `references/adapter-model.md`
- Validator script: `scripts/validate_assistant_core.py`
- Daily memory append automation: `scripts/append_daily_memory.py`

## Output Contract
1. Architecture compliance score
2. Missing/weak components by severity
3. Concrete patch recommendations
4. Re-validation status after upgrades
