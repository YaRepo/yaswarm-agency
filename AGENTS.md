# AGENTS.md

## Project Identity

This repository is the **public product monorepo source** for YaSwarm.

- Local folder name: `yaswarm-public-monorepo`
- GitHub repo: `YaRepo/yaswarm-agency`
- Purpose: clean, public, production-ready distribution of YaSwarm for external users
- It must contain **no personal/founder-specific/private runtime data**

## Critical Distinction

This repo is **not** the live/private operator system currently being used to run or develop YaSwarm internally.

Do **not** confuse this repo with:
- `yaswarm-agency-ui` (active UI/runtime repo)
- `yaswarm-desk-workspace` (active operator workspace)
- private/internal YaSwarm repos, configs, sessions, or personal data stores

## Agent Rules

When working in this repo, all agents (including CEO/subagents) must treat it as:
- a **customer-facing public monorepo**,
- a **clean baseline/template/product source**,
- and a **separate project** being built using YaSwarm.

Agents should:
- keep docs/install flows public-user oriented,
- avoid references to private machine-specific paths unless clearly templated/example-only,
- avoid leaking personal tokens, local session data, private logs, or founder-specific memory,
- prefer generic defaults and documented setup flows,
- preserve production-ready clarity.

## Naming Guidance

Internally, refer to this project as:
- `yaswarm-public-monorepo`
- or “the public monorepo source”

Avoid referring to the local checkout simply as `yaswarm-agency` when that could be confused with the live system.

## Documentation Intent

If features are ported from private/internal YaSwarm work into this repo, they must be rewritten for:
- public users,
- clean setup,
- reproducible install/upgrade flows,
- and safe defaults.
