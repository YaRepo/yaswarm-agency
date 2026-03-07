#!/usr/bin/env python3
"""Launch Zettlr with optional documented command-line flags."""

import argparse
import subprocess


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--workspace", default="", help="Optional workspace path to open")
    p.add_argument("--launch-minimized", action="store_true")
    p.add_argument("--clear-cache", action="store_true")
    p.add_argument("--data-dir", default="", help="Optional custom Zettlr data directory")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    cmd = ["/Applications/Zettlr.app/Contents/MacOS/Zettlr"]
    if args.launch_minimized:
        cmd.append("--launch-minimized")
    if args.clear_cache:
        cmd.append("--clear-cache")
    if args.data_dir:
        cmd.append(f"--data-dir={args.data_dir}")
    if args.workspace:
        cmd.append(args.workspace)

    if args.dry_run:
        print("DRY RUN:", " ".join(cmd))
        return 0

    subprocess.run(cmd, check=True)
    print("Launched Zettlr")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
