---
name: langsmith-fetch
description: "Debug LangChain and LangGraph agents using LangSmith traces. Use when investigating failures, tool-call behavior, memory operations, latency, or token usage."
metadata:
  category: development
  source:
    repository: https://github.com/ComposioHQ/awesome-claude-skills
    path: langsmith-fetch
---

# LangSmith Fetch

## Purpose
Diagnose agent behavior quickly from real execution traces, then escalate to deep root-cause analysis when needed.

## Progressive Loading
- Fast path: `references/quickstart-runtime.md`
- Full operational playbook: `references/full-playbook.md`
- Original upstream reference: `/Users/yascene/YaMind-Writer-Desk/Skills/Dev-Skills/langsmith-fetch/SKILL.md`

## Use This Skill When
- Use when a user says the agent failed, acted strangely, or "did nothing."
- Use when you need to inspect recent runs, errors, tools, memory calls, or latency.
- Use when debugging requires concrete trace evidence before code/config changes.
- Use when exporting traces for handoff or incident reports.

## Prerequisites
1. `langsmith-fetch` installed.
2. Environment variables set:
- `LANGSMITH_API_KEY`
- `LANGSMITH_PROJECT`

## Workflow
1. Quick triage (last 5 minutes).
```bash
langsmith-fetch traces --last-n-minutes 5 --limit 5 --format pretty
```
2. Deep dive one trace.
```bash
langsmith-fetch trace <trace-id> --format json
```
3. Error clustering window.
```bash
langsmith-fetch traces --last-n-minutes 30 --limit 50 --format json > recent-traces.json
grep -i "error\|failed\|exception" recent-traces.json
```
4. Export session bundle for handoff.
```bash
SESSION_DIR="langsmith-debug/session-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$SESSION_DIR"
langsmith-fetch traces "$SESSION_DIR/traces" --last-n-minutes 30 --limit 50 --include-metadata
langsmith-fetch threads "$SESSION_DIR/threads" --limit 20
```

## Analysis Checklist
- What was the user goal?
- Which step failed first?
- Which tool call produced the failure or invalid output?
- Is failure transient (timeout/rate limit) or deterministic (schema/logic/config)?
- What is the smallest safe fix to test first?

## Safety Rules
- Do not claim root cause without trace evidence.
- Separate observed facts from inference.
- Redact secrets/tokens from shared outputs.
- Prefer reversible mitigations before hard config changes.

## Resources
- Quick triage overlay: `references/quickstart-runtime.md`
- Full playbook backup: `references/full-playbook.md`

## Output Contract
1. Incident summary with timeline window used.
2. Evidence table: failing traces, tools, errors, durations, token impact.
3. Root-cause hypothesis list ranked by confidence.
4. Concrete next actions (immediate mitigation + follow-up fix).
