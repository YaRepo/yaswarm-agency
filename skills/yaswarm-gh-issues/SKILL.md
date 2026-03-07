---
name: yaswarm-gh-issues
description: Focused GitHub issue and PR triage using gh CLI with reproducible filters and summaries. Use for backlog triage, assignee/label routing, and unresolved review comment follow-up.
metadata:
  source:
    repository: https://github.com/yaswarm/yaswarm
    path: skills/gh-issues
    license: MIT
---

# YaSwarm GH Issues (Adapted)

Specialized issue/PR triage via `gh`.

## Use This Skill When
- User asks to triage backlog, prioritize issues, or filter by labels/assignees.
- User asks what is blocking merges (reviews/checks/comments).

## Workflow
1. Resolve target repository.
2. Pull current issue/PR state with JSON output.
3. Summarize by priority, owner, and blocker.
4. Apply user-approved updates (labels, comments, close/reopen).

## Commands
```bash
gh issue list --repo owner/repo --state open --json number,title,labels,assignees,updatedAt
gh issue view 42 --repo owner/repo --json title,body,labels,assignees,comments
gh pr list --repo owner/repo --state open --json number,title,mergeStateStatus,reviewDecision,statusCheckRollup
gh pr view 55 --repo owner/repo --comments
```

## Safety Rules
- Do not close/relabel/comment unless user asked.
- Preserve original issue/PR text when summarizing.
- Flag uncertainty when missing permissions.

## Output Contract
1. Triage summary (`now/next/blockers`).
2. Explicit list of proposed actions.
3. Executed actions (if requested).
