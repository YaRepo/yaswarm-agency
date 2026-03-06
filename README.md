# YaMind Swarm (Clean Core)

Clean distributable base for YaMind Swarm with no personal data baked in.

## Implemented
- CLI: `yaswarm`
- Onboarding flow: `yaswarm onboard`
- Repo catalog automation:
  - `yaswarm repo init`
  - `yaswarm repo create-new <project_name> [private|public]`
  - `yaswarm repo link-existing <project_name> <repo_url>`
  - `yaswarm repo sync <project_name>`
  - `yaswarm repo sync-all`
  - `yaswarm repo list`
- Auto-sync policy engine:
  - `yaswarm sync start [interval_sec]`
  - `yaswarm sync stop`
  - `yaswarm sync status`
  - `yaswarm sync run-once`
- Swarm runtime:
  - `yaswarm swarm init`
  - `yaswarm swarm status`
  - `yaswarm swarm dispatch <department> <title>`
  - `yaswarm swarm complete <task_id>`
- MCP management:
  - `yaswarm mcp list`
  - `yaswarm mcp inspect [server-command...]`
  - `yaswarm mcp health`
- Dashboard bridge:
  - `yaswarm dashboard refresh`
  - writes `projects/dashboard-agency/data/overview.json`
- Dockerized runtime (`Dockerfile`, `docker-compose.yml`)

## First Run
```bash
cp .env.example .env
chmod +x cli/yaswarm scripts/*.sh
./cli/yaswarm onboard
./cli/yaswarm repo init
./cli/yaswarm swarm init
./cli/yaswarm dashboard refresh
```

## Auto-sync Policy
- Sync daemon interval from `YASWARM_SYNC_INTERVAL_SEC` (default 180 sec).
- Swarm event hooks can trigger sync:
  - `SWARM_AUTO_SYNC=1` => sync-all on swarm dispatch/complete/init
  - `SWARM_AUTO_SYNC_DAEMON=1` => ensure daemon is running

## MCP Inspector UI
```bash
./cli/yaswarm mcp inspect
# http://localhost:6274
```

## Docker
```bash
docker compose up -d --build
```

## Data Files
- `catalog/onboarding.json`
- `catalog/agency-structure.json`
- `catalog/repo-catalog.json`
- `catalog/swarm-state.json`
- `catalog/telegram-thread-map.json`
- `catalog/auto-sync.pid`
- `catalog/auto-sync.log`
- `projects/dashboard-agency/data/overview.json`

## Notes
- This repo is clean by default (no user skills/MCPs/sessions included).
- User project repos are created/linked through the repo-catalog commands.
