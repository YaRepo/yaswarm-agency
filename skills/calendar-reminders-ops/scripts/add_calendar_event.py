#!/usr/bin/env python3
"""Create a Calendar event in macOS Calendar using AppleScript.

Default mode is dry-run. Use --apply to execute.
"""

import argparse
import subprocess
from datetime import datetime, timedelta


def esc(s: str) -> str:
    return s.replace('"', '\\"')


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--title", required=True)
    p.add_argument("--calendar", default="Home", help="Calendar name")
    p.add_argument("--start", required=True, help="Start in YYYY-MM-DD HH:MM")
    p.add_argument("--minutes", type=int, default=60)
    p.add_argument("--location", default="")
    p.add_argument("--notes", default="")
    p.add_argument("--apply", action="store_true")
    args = p.parse_args()

    start = datetime.strptime(args.start, "%Y-%m-%d %H:%M")
    end = start + timedelta(minutes=args.minutes)

    script = f'''tell application "Calendar"
if not (exists calendar "{esc(args.calendar)}") then
    error "Calendar not found: {esc(args.calendar)}"
end if
set targetCalendar to calendar "{esc(args.calendar)}"
set startDate to date "{start.strftime('%m/%d/%Y %H:%M')}"
set endDate to date "{end.strftime('%m/%d/%Y %H:%M')}"
set newEvent to make new event at end of events of targetCalendar with properties {{summary:"{esc(args.title)}", start date:startDate, end date:endDate, location:"{esc(args.location)}", description:"{esc(args.notes)}"}}
end tell'''

    if not args.apply:
        print("DRY RUN: event not created")
        print(script)
        return 0

    subprocess.run(["osascript", "-e", script], check=True)
    print("Calendar event created")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
