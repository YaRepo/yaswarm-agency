# LangSmith Fetch Quickstart

Use this file for fast incident triage before loading the full playbook.

## Fast Commands
1. Recent activity
```bash
langsmith-fetch traces --last-n-minutes 5 --limit 5 --format pretty
```
2. Deep trace by ID
```bash
langsmith-fetch trace <trace-id> --format json
```
3. Error scan
```bash
langsmith-fetch traces --last-n-minutes 30 --limit 50 --format json > recent-traces.json
grep -i "error\\|failed\\|exception" recent-traces.json
```

## Escalate to Full Playbook When
- Root-cause analysis needs full workflow templates.
- Session export/package artifacts are requested.
- You need structured recommendation output for teams.

Deep references:
- `../SKILL.md`
- `/Users/yascene/YaMind-Writer-Desk/Skills/Dev-Skills/langsmith-fetch/SKILL.md`
