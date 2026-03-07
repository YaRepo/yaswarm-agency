# YaSwarm Core CLI

`yaswarm-core` is the clean, commercial-safe control layer for running an agentic agency system from terminal + UI.

It gives users a structured way to:
- bootstrap required repos/workspace,
- define departments and subagents,
- route model usage (pi-mono CLI backend or direct provider fallback),
- register bots/agents,
- and keep state synchronized over time.

No personal user data is included by default.

## What Problem It Solves

Most multi-agent setups fail on operations, not model quality. Teams usually hit:
- fragmented setup across repos, env files, and local folders,
- unclear ownership between CEO agent and department agents,
- painful reconfiguration when changing machine,
- no single health check for runtime readiness,
- weak sync between CLI state and dashboard state.

YaSwarm CLI solves this by making system initialization, registration, runtime checks, and sync explicit commands.

## Core Concepts

- `yaswarm` CLI: entry point for all lifecycle actions.
- Workspace-first design: user agency files live in one workspace directory.
- Department architecture: CEO -> departments -> subagents.
- Runtime model routing:
  - default: `pi-mono` CLI backend,
  - fallback: direct provider assignment via config.
- Non-destructive updates: migration + reconfigure paths preserve user data.

## Main Commands

### Bootstrap and Lifecycle
- `yaswarm init --github-owner <owner> [--new-workspace <path>] [--force-clean]`
- `yaswarm reconfigure --github-owner <owner> [--workspace <path>] [--dry-run]`
- `yaswarm upgrade [--workspace <path>] [--dry-run]`
- `yaswarm doctor [workspace_path]`

### Agency Runtime
- `yaswarm onboard`
- `yaswarm chat [--message "text"]`
- `yaswarm register`
- `yaswarm swarm init`
- `yaswarm swarm status`
- `yaswarm swarm dispatch <department> <title>`
- `yaswarm swarm complete <task_id>`
- `yaswarm telegram bridge-once`
- `yaswarm telegram bridge-loop [interval_sec]`

### Model Backend
- `yaswarm pi status`
- `yaswarm pi verify`
- `yaswarm pi verify-runtime`
  - `yaswarm pi setup [--command <binary>] [--llm <id>] [--vlm <id>] [--tts <id>]`

### Chat Surfaces
- Terminal chat:
  - `yaswarm chat`
  - Supports config/integration commands: `/missing`, `/set KEY value`, `/doctor`, `/register`, `/swarm-init`, `/dispatch`, `/skills`, `/skill <name>`, `/skills-routing`, `/mcp-servers`, `/mcp-tools`, `/mcp-env`, `/mcp-set KEY VALUE`.
- Agency UI chat:
  - UI `/chat` panel uses server relay `/api/chat/*`.
  - Backend now delegates to `scripts/chat-cli.py` for consistent behavior with terminal chat.
- Telegram bridge chat:
  - Configure bot tokens in `agency/.env` (or via UI Telegram panel),
  - ensure department thread IDs exist in `agency/config/agency-config.json`,
  - run bridge worker:
    - `yaswarm telegram bridge-once`
    - `yaswarm telegram bridge-loop 3`

`verify-runtime` passes when either:
1. pi-mono CLI backend is configured and binary exists on PATH, or
2. direct fallback provider is configured in:
   - `agency/config/model-providers.json`
   - `agency/config/model-assignments.json`

### Repo / Sync / MCP / Dashboard
- `yaswarm repo init`
- `yaswarm repo create-new <project_name> [private|public]`
- `yaswarm repo link-existing <project_name> <repo_url>`
- `yaswarm repo sync <project_name>`
- `yaswarm repo sync-all`
- `yaswarm repo list`
- `yaswarm sync start [interval_sec]`
- `yaswarm sync stop`
- `yaswarm sync status`
- `yaswarm sync run-once`
- `yaswarm mcp list`
- `yaswarm mcp inspect [server-command...]`
- `yaswarm mcp health`
- `yaswarm agency skills-list`
- `yaswarm agency skills-routing`
- `yaswarm agency skill-get <name>`
- `yaswarm agency mcp-servers`
- `yaswarm agency mcp-tools`
- `yaswarm agency mcp-registry`
- `yaswarm agency mcp-config`
- `yaswarm agency mcp-env-list`
- `yaswarm agency mcp-env-set <KEY> <VALUE>`
- `yaswarm dashboard refresh`

Unified catalog behavior:
- Skills are read from `projects/yaswarm-skills-cataloge/catalog/skill-system/registry/skills-registry.json` when available.
- MCP catalog/config is read from `mcp/mcp-config.json` first, then `projects/yaswarm-mcps-cataloge/imports/agency/mcp-catalog.json`.
- UI, terminal chat, and CLI commands all use the same backend API routes for catalog reads/writes.

## Quick Start (New User)

```bash
cd /path/to/yaswarm-core
cp .env.example .env
chmod +x cli/yaswarm scripts/*.sh

./cli/yaswarm init --github-owner <YOUR_GITHUB_OWNER> --new-workspace <WORKSPACE_PATH> --force-clean
./cli/yaswarm onboard
./cli/yaswarm pi setup --command pi-mono
./cli/yaswarm register
./cli/yaswarm swarm init
./cli/yaswarm dashboard refresh
```

## Quick Start (Returning User / New Machine)

```bash
cd /path/to/yaswarm-core
chmod +x cli/yaswarm scripts/*.sh

./cli/yaswarm reconfigure --github-owner <YOUR_GITHUB_OWNER> --workspace <WORKSPACE_PATH> --dry-run --skip-pull
./cli/yaswarm reconfigure --github-owner <YOUR_GITHUB_OWNER> --workspace <WORKSPACE_PATH>
./cli/yaswarm doctor <WORKSPACE_PATH>
```

## Why This Matters For Commercial Use

- Predictable onboarding for first-time customers.
- Safe reconfiguration path for existing customers.
- Standardized repo/workspace topology.
- Runtime guardrails before production actions (`register`, `swarm init`).
- Extensible backend strategy (pi-mono default + provider fallback).

## Commercial Packaging Checklist

- Licensing:
  - confirm licenses for all bundled code, scripts, and dependencies,
  - include `LICENSE` and third-party notices before distribution.
- Secrets and configuration:
  - never ship real API keys/tokens in repo,
  - keep only examples/templates in source control,
  - document secure key injection paths (UI and `.env`).
- Upgrade safety:
  - keep migrations additive and non-destructive,
  - support `--dry-run` for reconfigure/upgrade flows,
  - backup config files before mutation.
- Reliability and operations:
  - define runtime health checks (`yaswarm doctor`, provider verify),
  - provide fallback path when default backend is unavailable,
  - document recovery steps for broken sync/registration.
- Observability:
  - decide what telemetry/logs are collected,
  - add opt-in/out controls for analytics,
  - avoid collecting sensitive prompt/user data by default.
- Security:
  - validate user-provided URLs/commands in UI and CLI inputs,
  - minimize execution privileges for automation scripts,
  - run dependency/security scans in CI.
- Commercial support readiness:
  - publish supported platforms and minimum versions,
  - define SLA/SLO boundaries (support hours, incident severity, response times),
  - provide a reproducible support bundle process (doctor output + config snapshot without secrets).

## Useful Paths

- `catalog/onboarding.json`
- `catalog/agency-structure.json`
- `catalog/repo-catalog.json`
- `catalog/swarm-state.json`
- `catalog/telegram-thread-map.json`
- `catalog/auto-sync.pid`
- `catalog/auto-sync.log`
- `projects/dashboard-agency/data/overview.json`

## Docker

```bash
docker compose up -d --build
```

## Notes

- Clean baseline by default: no user sessions/skills/MCP secrets shipped.
- Agency config can be aligned from structure with `scripts/sync-agency-config.sh`.
