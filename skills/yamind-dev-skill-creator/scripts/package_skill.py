#!/usr/bin/env python3
"""Package a skill directory into a distributable zip with strict gates."""

from __future__ import annotations

import argparse
import zipfile
from pathlib import Path

from quick_validate import validate_skill, validate_skill_detailed
from smoke_test_skill import run_smoke_test


def package_skill(skill_path: str | Path, output_dir: str | Path | None = None, min_score: int = 95, smoke_min_score: int = 90) -> Path | None:
    skill_path = Path(skill_path).resolve()

    if not skill_path.exists() or not skill_path.is_dir():
        print(f"Error: Skill folder not found: {skill_path}")
        return None

    if not (skill_path / "SKILL.md").exists():
        print(f"Error: SKILL.md not found in {skill_path}")
        return None

    print("Validating skill quality...")
    valid, message = validate_skill(skill_path, min_score=min_score)
    detailed = validate_skill_detailed(skill_path, min_score=min_score)
    print(message)
    if not valid:
        print("Validation issues:")
        for issue in detailed["issues"]:
            print(f"- [{issue['severity']}] {issue['message']}")
        return None

    print("Running smoke tests...")
    smoke = run_smoke_test(skill_path, min_score=smoke_min_score)
    smoke_status = "PASS" if smoke["pass"] else "FAIL"
    print(f"{smoke_status}: smoke score={smoke['score']}/100 (min {smoke['min_score']})")
    if not smoke["pass"]:
        for issue in smoke["issues"]:
            print(f"- [{issue['severity']}] {issue['message']}")
        return None

    skill_name = skill_path.name
    if output_dir:
        output_path = Path(output_dir).resolve()
        output_path.mkdir(parents=True, exist_ok=True)
    else:
        output_path = Path.cwd()

    zip_filename = output_path / f"{skill_name}.zip"

    try:
        with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zipf:
            for file_path in skill_path.rglob("*"):
                if not file_path.is_file():
                    continue
                arcname = file_path.relative_to(skill_path.parent)
                zipf.write(file_path, arcname)

        print(f"Packaged: {zip_filename}")
        return zip_filename
    except Exception as exc:
        print(f"Error creating zip file: {exc}")
        return None


def main() -> int:
    ap = argparse.ArgumentParser(description="Package a skill after strict validation and smoke tests")
    ap.add_argument("skill_path")
    ap.add_argument("output_dir", nargs="?")
    ap.add_argument("--min-score", type=int, default=95, help="Validator minimum score gate")
    ap.add_argument("--smoke-min-score", type=int, default=90, help="Smoke-test minimum score gate")
    args = ap.parse_args()

    result = package_skill(
        skill_path=args.skill_path,
        output_dir=args.output_dir,
        min_score=args.min_score,
        smoke_min_score=args.smoke_min_score,
    )
    return 0 if result else 1


if __name__ == "__main__":
    raise SystemExit(main())
