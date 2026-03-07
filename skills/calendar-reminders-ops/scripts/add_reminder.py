#!/usr/bin/env python3
"""Create a reminder in macOS Reminders using AppleScript.

Default mode is dry-run. Use --apply to execute.
"""

import argparse
import subprocess
from datetime import datetime


def esc(s: str) -> str:
    return s.replace('"', '\\"')


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--title", required=True)
    p.add_argument("--list", default="Reminders", help="Reminder list name")
    p.add_argument("--notes", default="")
    p.add_argument("--due", default="", help="Due datetime in YYYY-MM-DD HH:MM (local)")
    p.add_argument("--priority", default="", choices=["", "low", "medium", "high"])
    p.add_argument("--apply", action="store_true")
    args = p.parse_args()

    due_line = ""
    if args.due:
        dt = datetime.strptime(args.due, "%Y-%m-%d %H:%M")
        due_line = f"set due date of newReminder to date \"{dt.strftime('%m/%d/%Y %H:%M')}\"\n"

    pr_line = ""
    if args.priority:
        mapping = {"low": 9, "medium": 5, "high": 1}
        pr_line = f"set priority of newReminder to {mapping[args.priority]}\n"

    script = f'''tell application "Reminders"
if not (exists list "{esc(args.list)}") then
    make new list with properties {{name:"{esc(args.list)}"}}
end if
set targetList to list "{esc(args.list)}"
set newReminder to make new reminder at end of reminders of targetList with properties {{name:"{esc(args.title)}", body:"{esc(args.notes)}"}}
{due_line}{pr_line}end tell'''

    if not args.apply:
        print("DRY RUN: reminder not created")
        print(script)
        return 0

    subprocess.run(["osascript", "-e", script], check=True)
    print("Reminder created")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
