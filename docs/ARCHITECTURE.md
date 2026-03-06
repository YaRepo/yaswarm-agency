# Architecture

## Layers
1. CLI Layer (`cli/yaswarm`)
   - Command router for onboarding, repo, swarm, mcp, dashboard.

2. Catalog Layer (`catalog/*.json`)
   - Persistent state for onboarding, agency topology, repo catalog, swarm state, telegram map.

3. Repo Catalog Layer (`scripts/repo-catalog.sh`)
   - Creates new GitHub repos via `gh`.
   - Links existing repos and initializes local project worktrees.
   - Sync command commits/pushes project updates.

4. Swarm Runtime (`swarm/runtime.py`)
   - Department/head/subagent topology from onboarding template.
   - Task dispatching to subagents.
   - Task lifecycle and status tracking.

5. MCP Layer (`mcp/`, `scripts/mcp-health.sh`)
   - Config surface for MCP servers.
   - Inspector launch path via CLI.
   - Health checks for process and ports.

6. Dashboard Bridge (`scripts/dashboard-bridge.py`)
   - Produces a machine-readable summary JSON for web UIs.

## Flow
- Install -> `yaswarm onboard` -> agency topology generated.
- `yaswarm repo create-new|link-existing` -> project catalog updated.
- `yaswarm swarm init/dispatch/complete` -> state progresses.
- `yaswarm dashboard refresh` -> dashboard snapshot regenerated.

## Extension Points
- Replace static agency templates with dynamic templates.
- Add policy engine for auto-sync triggers.
- Add live websocket feed for dashboard.
- Add Telegram thread IDs into `telegram-thread-map.json`.
