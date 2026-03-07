#!/usr/bin/env python3
"""List today's reminders and calendar events (read-only)."""

import argparse
import subprocess


def run(script: str) -> str:
    p = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
    if p.returncode != 0:
        return f"[error] {p.stderr.strip()}"
    return p.stdout.strip()


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--calendar", default="", help="Optional specific calendar name")
    args = p.parse_args()

    rem_script = '''tell application "Reminders"
set outText to ""
repeat with rl in lists
    repeat with r in reminders of rl
        if completed of r is false then
            set outText to outText & (name of r as string) & " | list=" & (name of rl as string) & linefeed
        end if
    end repeat
end repeat
return outText
end tell'''

    cal_name_line = (
        f'set targetCalendar to calendar "{args.calendar}"'
        if args.calendar
        else "set targetCalendar to first calendar"
    )

    cal_script = f'''tell application "Calendar"
set outText to ""
{cal_name_line}
repeat with e in (every event of targetCalendar whose start date is greater than current date)
    set outText to outText & (summary of e as string) & " | " & (start date of e as string) & linefeed
end repeat
return outText
end tell'''

    print("## Open Reminders")
    print(run(rem_script) or "(none)")
    print("\n## Upcoming Events")
    print(run(cal_script) or "(none)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
