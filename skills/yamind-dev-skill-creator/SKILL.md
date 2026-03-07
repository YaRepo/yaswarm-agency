---
name: skill-creator
description: "Create or upgrade reusable Codex skills for any project by scaffolding, validating, and packaging skill folders with clear trigger rules and safety sections."
license: Complete terms in LICENSE.txt
metadata:
  category: development
  source:
    repository: https://github.com/ComposioHQ/awesome-claude-skills
    path: skill-creator
---

# Skill Creator

Build and maintain high-quality skills that can be reused across different projects.

## About Skills
Skills are modular capability packs that convert general agent behavior into repeatable specialized behavior.

What skills provide:
1. Specialized workflows for repeat tasks.
2. Tool integrations and deterministic scripts.
3. Domain expertise and project-specific rules.
4. Bundled resources (`scripts/`, `references/`, `assets/`) with progressive disclosure.

Skill anatomy:
- Required: `SKILL.md` with valid frontmatter (`name`, `description`).
- Optional: `scripts/` for deterministic execution, `references/` for deep docs, `assets/` for output resources.
- Design rule: keep core operating instructions in `SKILL.md`, move deep details to `references/`.

## Use This Skill When
- Use when a user asks to create a new skill from scratch.
- Use when an existing skill needs structural upgrade, cleanup, or packaging.
- Use when a workflow should be converted into a reusable skill with scripts, references, and assets.
- Use when a team needs a validated `SKILL.md` and predictable skill folder layout.

## Inputs
- Skill name and objective
- Target user intents and trigger phrases
- Destination path
- Optional scripts, references, and assets

## Workflow
1. Define scope and triggers.
- Capture concrete user requests that should invoke the skill.
- Decide whether the skill is global, project-specific, or series-specific.

2. Scaffold the skill directory.
- Run:
```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```
- Remove generated examples that are not needed.

3. Author `SKILL.md`.
- Keep instructions imperative and operational.
- Ensure these sections exist:
  - `Use This Skill When`
  - `Workflow`
  - `Safety Rules`
  - `Output Contract`
- Keep frontmatter concise and valid (`name`, `description`).

4. Add reusable resources.
- Put deterministic automation in `scripts/`.
- Put supporting docs in `references/`.
- Put templates and non-context assets in `assets/`.

5. Validate and package.
- Quick validation:
```bash
scripts/quick_validate.py <path/to/skill-folder> --min-score 95
```
- Smoke test:
```bash
scripts/smoke_test_skill.py <path/to/skill-folder> --min-score 90
```
- Package for distribution:
```bash
scripts/package_skill.py <path/to/skill-folder> --min-score 95 --smoke-min-score 90
```

6. Final quality gate.
- Confirm trigger phrasing is explicit.
- Confirm safety rules are present.
- Confirm scripts intended to run are executable.

## Skill Creation Process
1. Understand usage with concrete examples.
- Gather 3 to 5 real user prompts that should trigger the skill.
- Ask for expected outputs and boundaries before implementation.

2. Plan reusable contents.
- Identify which repeated actions belong in `scripts/`.
- Identify which reference docs should move to `references/`.
- Identify templates/boilerplate to store in `assets/`.

3. Initialize safely.
- Prefer scaffolding with `scripts/init_skill.py` for new skills.
- For existing skills, branch from current structure and avoid destructive rewrites.

4. Implement operational instructions.
- Write imperative, procedural instructions.
- Include explicit trigger conditions and fallback behavior.
- Add concrete command examples where runtime reliability matters.

5. Validate and package.
- Run `scripts/quick_validate.py` before packaging.
- Run `scripts/package_skill.py` only after validation passes.

6. Iterate from real usage signals.
- Capture failure modes from actual tasks.
- Patch `SKILL.md`/resources with minimal diffs.
- Re-run validation after every substantive change.

## Safety Rules
- Never overwrite an existing skill directory without explicit confirmation.
- Never auto-delete user-authored skill files.
- Prefer additive edits and clear migration notes.
- Keep project-specific logic out of global skills unless explicitly requested.
- Validate before packaging or publishing.

## Resources
- Scaffolder: `scripts/init_skill.py`
- Validator: `scripts/quick_validate.py`
- Smoke tests: `scripts/smoke_test_skill.py`
- Packager: `scripts/package_skill.py`
- License: `LICENSE.txt`
- Deep reference: `/Users/yascene/YaMind-Writer-Desk/Skills/Dev-Skills/skill-creator/SKILL.md`

Load the deep reference when advanced packaging examples, longer prompting patterns, or full original guidance is required.

## Output Contract
1. A complete skill directory with valid `SKILL.md` frontmatter.
2. Required operational sections present and clear.
3. Scripts/references/assets organized for reuse.
4. Validation and packaging status with next actions.
