# Architecture

## Layers
1. CLI Layer (`cli/yaswarm`)
   - Command router for onboarding, repo, sync, swarm, mcp, dashboard.

2. Catalog Layer (`catalog/*.json`)
   - Persistent state for onboarding, agency topology, repo catalog, swarm state, telegram map, sync state/logs.

3. Repo Catalog Layer (`scripts/repo-catalog.sh`)
   - Creates new GitHub repos via `gh`.
   - Links existing repos and initializes local project worktrees.
   - Safe sync rules: no-op on clean trees, branch normalization, push with upstream.

4. Auto-sync Policy Engine (`scripts/auto-sync.sh`)
   - Background daemon loop for periodic `sync-all` + dashboard refresh.
   - PID/log tracking in catalog.

5. Swarm Runtime (`swarm/runtime.py`)
   - Department/head/subagent topology from onboarding template.
   - Task dispatching to subagents.
   - Task lifecycle and status tracking.
   - Post-event hook (`scripts/swarm-post-event.sh`) for dashboard refresh and optional sync.

6. MCP Layer (`mcp/`, `scripts/mcp-health.sh`)
   - Config surface for MCP servers.
   - Inspector launch path via CLI.
   - Health checks for process and ports.

7. Dashboard Bridge (`scripts/dashboard-bridge.py`)
   - Produces a machine-readable summary JSON for web UIs.

## Flow
- Install -> `yaswarm onboard` -> agency topology generated.
- `yaswarm repo create-new|link-existing` -> project catalog updated.
- `yaswarm swarm init/dispatch/complete` -> state progresses + post-event hooks run.
- `yaswarm sync start` -> periodic sync and dashboard regeneration.
- `yaswarm dashboard refresh` -> dashboard snapshot regenerated on demand.

## Extension Points
- Replace static agency templates with dynamic templates.
- Add policy engine rules per department/project.
- Add live websocket feed for dashboard.
- Add Telegram thread IDs into `telegram-thread-map.json`.
