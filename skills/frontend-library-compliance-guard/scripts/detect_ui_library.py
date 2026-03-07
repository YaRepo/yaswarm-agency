#!/usr/bin/env python3
import argparse
import json
from pathlib import Path


def load_package_json(root: Path):
    pkg = root / "package.json"
    if not pkg.exists():
        return {}
    try:
        return json.loads(pkg.read_text(encoding="utf-8"))
    except Exception:
        return {}


def detect_libraries(root: Path):
    pkg = load_package_json(root)
    deps = {}
    deps.update(pkg.get("dependencies", {}) or {})
    deps.update(pkg.get("devDependencies", {}) or {})
    names = set(deps.keys())

    has_components_json = (root / "components.json").exists()

    checks = [
        ("shadcn-ui", has_components_json),
        ("radix-ui", any(n.startswith("@radix-ui/") for n in names)),
        ("mui", "@mui/material" in names),
        ("antd", "antd" in names),
        ("chakra-ui", "@chakra-ui/react" in names),
        ("headless-ui", "@headlessui/react" in names),
        ("mantine", any(n.startswith("@mantine/") for n in names)),
        ("bootstrap", "bootstrap" in names or "react-bootstrap" in names),
        ("semantic-ui", "semantic-ui-react" in names),
        ("prime-react", "primereact" in names),
        ("nextui", "@nextui-org/react" in names),
        ("react-aria-components", "react-aria-components" in names),
    ]

    found = [label for label, ok in checks if ok]

    recommendation = (
        "No major UI component library detected; custom primitives are allowed."
    )
    if found:
        recommendation = (
            "Use detected library primitives first; avoid custom recreation of existing components."
        )

    return {
        "project_root": str(root),
        "library_detected": bool(found),
        "found_libraries": found,
        "recommendation": recommendation,
        "package_json_present": (root / "package.json").exists(),
        "components_json_present": has_components_json,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Detect active UI libraries in a frontend project"
    )
    parser.add_argument("project_root", nargs="?", default=".")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    root = Path(args.project_root).expanduser().resolve()
    result = detect_libraries(root)

    if args.json:
        print(json.dumps(result, indent=2))
        return

    print(f"Project: {result['project_root']}")
    print(f"Library detected: {result['library_detected']}")
    print(
        "Found libraries: "
        + (", ".join(result["found_libraries"]) if result["found_libraries"] else "none")
    )
    print(f"Recommendation: {result['recommendation']}")


if __name__ == "__main__":
    main()
