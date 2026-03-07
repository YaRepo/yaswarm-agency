---
name: mac-doctor
description: Diagnose, optimize, and maintain macOS devices end-to-end with focus on older Intel Macs, including thermals, fan behavior, storage pressure, duplicate-file strategy, app launch failures, install/debug workflows, and building Mac optimization tools. Use when the user asks about Mac behavior, slowness, overheating, battery drain, cleanup, fan tuning, device health checks, performance debugging, or creating software to improve Mac performance.
---

# MAC-Doctor

Use this skill to run repeatable diagnostics, produce targeted fixes, and keep a continuous baseline for the same Mac over time.

## Workflow

1. Define objective and risk level.
- Confirm whether task is diagnosis only, safe optimization, or invasive change.
- Prefer reversible changes first.

2. Collect baseline snapshot before changing anything.
- Run `scripts/collect_health_snapshot.sh`.
- Save output path and reference it in the response.

3. Triage by bottleneck domain.
- Thermals and fan behavior
- CPU and memory pressure
- Disk pressure and large-file churn
- Startup/login overhead
- Battery health and power draw
- App launch/signing/architecture mismatch

4. Apply minimal safe fix set.
- Make one fix group at a time and re-check metrics.
- Avoid destructive cleanup by default.
- For file cleanup, list candidates first; delete only with explicit user approval.

5. Re-measure and summarize with numbers.
- Compare before/after for temperature, fan RPM, free disk, memory pressure, and boot/login agents.
- Keep recommendations prioritized by impact and risk.

## Required Command Set

Run these via script when possible:
- `scripts/collect_health_snapshot.sh`
- `scripts/list_cleanup_candidates.sh`

Use ad-hoc commands only when needed for deeper debugging.

## Thermal and Fan Guidance

- On Intel MacBook Pro 2015, prioritize sustained stability over burst benchmarks.
- Treat sustained high CPU temps with low fan response as control-policy issue.
- If using third-party fan control or helper apps, ensure fail-safe behavior reverts to system auto on crash.

## Storage and Duplicate Guidance

- Never auto-delete from protected/system-sensitive locations.
- Prefer user-space targets: `~/Library/Caches`, `~/Library/Logs`, user Downloads leftovers.
- For duplicates, require hash confirmation and human review before deletion.

## App Build/Debug Guidance

When user asks to build optimization software:
1. Start with read-only telemetry dashboard.
2. Add recommendation engine.
3. Add privileged operations only after logging + rollback are in place.
4. Validate on target hardware architecture (Intel vs Apple Silicon) before shipping.

## Safety Rules

- Default to reversible changes first and document rollback steps.
- Never delete user files automatically; always present candidates for approval.
- Avoid privileged/system modifications unless clearly justified and user-approved.

## Output Contract

Always return:
1. Baseline findings (with key numeric values)
2. Root-cause hypotheses ranked by confidence
3. Safe actions applied (or proposed)
4. Post-check results and next best step
