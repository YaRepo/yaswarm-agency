# AppleScript Model

Supported apps:
- Reminders
- Calendar

Execution path:
- Python wrapper builds AppleScript
- Default `--dry-run` prints script/intent
- `--apply` executes via `osascript`

Permissions:
- macOS may prompt for Calendar/Reminders access.
- Grant once for terminal process used by the assistant.
