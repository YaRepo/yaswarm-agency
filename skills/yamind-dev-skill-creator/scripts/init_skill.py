#!/usr/bin/env python3
"""Initialize a best-practice skill skeleton.

Usage:
  init_skill.py <skill-name> --path <directory> [--scope global|project|series] [--context NAME ...]
"""

from __future__ import annotations

import argparse
from pathlib import Path


def title_case(skill_name: str) -> str:
    return " ".join(part.capitalize() for part in skill_name.split("-") if part)


def render_frontmatter(skill_name: str, description: str, scope: str, contexts: list[str]) -> str:
    ctx_lines = "\n".join(f"  - {c}" for c in contexts)
    return (
        "---\n"
        f"name: {skill_name}\n"
        f"description: \"{description}\"\n"
        f"scope: {scope}\n"
        "contexts:\n"
        f"{ctx_lines}\n"
        "---\n"
    )


def render_skill_md(skill_name: str, skill_title: str, description: str, scope: str, contexts: list[str]) -> str:
    context_label = ", ".join(contexts)
    frontmatter = render_frontmatter(skill_name, description, scope, contexts)
    body = f"""
# {skill_title}

## Overview
{description}

## Use This Skill When
- Use when this specialization clearly matches the user task.
- Use when repeatable workflow steps are needed instead of ad-hoc execution.
- Use when scope `{scope}` and context(s) `{context_label}` apply.

## Inputs
- User goal
- Constraints (scope, quality bar, deadlines, tooling)
- Required deliverables

## Workflow
1. Confirm objective and constraints.
2. Gather only the context needed to execute.
3. Produce the requested artifact with minimal-risk changes.
4. Validate outputs against requirements.
5. Report results and exact next actions.

## Safety Rules
- Prefer reversible, minimal changes first.
- Do not overwrite user-authored work without explicit confirmation.
- State assumptions and blockers clearly.
- Keep secrets and sensitive data out of outputs.

## Resources
- Add deep references under `references/` as this skill evolves.
- Add deterministic automation under `scripts/` when repeatable execution is needed.
- Add templates/assets under `assets/` for reusable output scaffolds.

## Output Contract
1. Execution summary with what was done and why.
2. Deliverables produced (files/decisions/patches).
3. Validation results and residual risks.
4. Exact next actions.
""".lstrip("\n")
    return frontmatter + "\n" + body


def render_agent_yaml(skill_title: str, skill_name: str, description: str) -> str:
    short = description.strip()
    if len(short) > 90:
        short = short[:87].rstrip() + "..."
    return (
        f"display_name: {skill_title}\n"
        f"short_description: {short}\n"
        f"default_prompt: Use ${skill_name} to run this workflow with strict output-contract compliance.\n"
    )


def write(path: Path, text: str, executable: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    if executable:
        path.chmod(path.stat().st_mode | 0o755)


def init_skill(skill_name: str, base_path: Path, scope: str, contexts: list[str], description: str) -> Path:
    skill_dir = base_path / skill_name
    if skill_dir.exists():
        raise FileExistsError(f"Skill directory already exists: {skill_dir}")

    if scope != "global" and not contexts:
        raise ValueError("For project/series scope, provide at least one --context value.")

    if scope == "global" and not contexts:
        contexts = ["*"]

    skill_title = title_case(skill_name)
    write(skill_dir / "SKILL.md", render_skill_md(skill_name, skill_title, description, scope, contexts))

    # Agent config
    write(skill_dir / "agents" / "openai.yaml", render_agent_yaml(skill_title, skill_name, description))

    # Best-practice starter resource layout
    write(
        skill_dir / "scripts" / "README.md",
        "# Scripts\n\nAdd deterministic helpers here when manual repetition appears.\n",
    )
    write(
        skill_dir / "references" / "README.md",
        "# References\n\nAdd long-form domain docs and decision references here.\n",
    )
    write(
        skill_dir / "assets" / "README.md",
        "# Assets\n\nAdd templates or static files used in generated outputs.\n",
    )

    # Optional helper script scaffold
    helper = """#!/usr/bin/env python3
from __future__ import annotations

def main() -> int:
    print(\"Replace this helper with deterministic workflow logic.\")
    return 0

if __name__ == \"__main__\":
    raise SystemExit(main())
"""
    write(skill_dir / "scripts" / "helper.py", helper, executable=True)

    return skill_dir


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Initialize a best-practice skill skeleton")
    ap.add_argument("skill_name")
    ap.add_argument("--path", required=True, help="Destination root where <skill_name>/ will be created")
    ap.add_argument("--scope", choices=["global", "project", "series"], default="global")
    ap.add_argument("--context", action="append", default=[], help="Context name. Repeatable.")
    ap.add_argument(
        "--description",
        default="Reusable workflow skill. Use when this specialization matches the task and repeatable execution is needed.",
        help="Frontmatter description",
    )
    return ap.parse_args()


def main() -> int:
    args = parse_args()
    skill_name = args.skill_name.strip().lower()
    if not skill_name or any(c not in "abcdefghijklmnopqrstuvwxyz0123456789-" for c in skill_name):
        print("Error: skill_name must be hyphen-case (lowercase letters, digits, hyphens).")
        return 1

    try:
        skill_dir = init_skill(
            skill_name=skill_name,
            base_path=Path(args.path).resolve(),
            scope=args.scope,
            contexts=[c.strip() for c in args.context if c.strip()],
            description=args.description.strip(),
        )
    except Exception as exc:
        print(f"Error: {exc}")
        return 1

    print(f"Created skill: {skill_dir}")
    print("Created files:")
    print("- SKILL.md")
    print("- agents/openai.yaml")
    print("- scripts/README.md")
    print("- scripts/helper.py")
    print("- references/README.md")
    print("- assets/README.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
