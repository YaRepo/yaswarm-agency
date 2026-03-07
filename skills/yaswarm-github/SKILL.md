---
name: yaswarm-github
description: GitHub operations using gh CLI for PRs, issues, workflow runs, and API queries. Use when the user asks to inspect CI, manage PR/issue state, or fetch GitHub metadata quickly.
metadata:
  source:
    repository: https://github.com/yaswarm/yaswarm
    path: skills/github
    license: MIT
---

# YaSwarm GitHub (Adapted)

Use `gh` CLI for GitHub workflows.

## Use This Skill When
- Checking PR status/checks/reviews.
- Creating/updating/closing issues.
- Reading workflow run logs and re-running failures.
- Querying GitHub API for repository metadata.

## Workflow
1. Verify auth with `gh auth status` if operations fail.
2. Use `--repo owner/repo` when outside target repo directory.
3. Prefer `--json` plus `--jq` for structured output.
4. Keep outputs concise and action-focused.

## Commands
```bash
gh pr list --repo owner/repo
gh pr checks 123 --repo owner/repo
gh issue list --repo owner/repo --state open
gh run list --repo owner/repo --limit 10
gh run view <run-id> --repo owner/repo --log-failed
gh api repos/owner/repo --jq '{stars: .stargazers_count, forks: .forks_count}'
```

## Safety Rules
- Never merge or close PRs/issues without explicit user direction.
- Don’t assume repo context; specify `--repo` when unclear.
- If unauthenticated, report exact command needed (`gh auth login`).

## Output Contract
1. Requested GitHub data/state.
2. Clear next action if user asked for changes.
