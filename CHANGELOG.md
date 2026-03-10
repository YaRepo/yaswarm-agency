# Changelog

All notable changes to `yaswarm-agency` are documented in this file.

## 2026-03-10

### Added
- Public unified monorepo baseline for **YaSwarm Agency**.
- New first-run and lifecycle commands:
  - `yaswarm install`
  - `yaswarm setup`
  - `yaswarm up`
  - `yaswarm down`
  - `yaswarm init-project`
  - `yaswarm release-info`
- One-shot bootstrap entrypoint: `install.sh`.
- Public install templates:
  - `catalog/templates/mcp-config.default.json`
  - `catalog/templates/project-repo-defaults.json`
  - `catalog/templates/data-services.json`
- Release marker file: `VERSION` (`1.0.0-alpha.1`).
- Installation docs and dedicated GitHub owner policy docs.
- Embedded Agency UI source at `apps/agency-ui`.
- Full-stack compose services:
  - `yaswarm-core`
  - `yaswarm-bridge`
  - `yaswarm-ui`
  - `yaswarm-rag` (Chroma)

### Changed
- CLI `upgrade` now routes through `scripts/upgrade.sh`.
- `init-workspace.sh` now creates full desk lifecycle dirs including:
  - `desk/rejected`
  - `desk/tickets`
- `doctor.sh` now validates desk lifecycle and new setup configs:
  - `mcp-config.json`
  - `project-repo-defaults.json`
  - `data-services.json`
- MCP defaults switched to safe minimal policy:
  - enabled: `context7`, `memory`, `filesystem`
  - `tremcp-ssh` shipped disabled by default.
- `.env.example` expanded for public install requirements and key placeholders.
- Agency UI Docker defaults updated to workspace-local paths and local RAG endpoint.

## 2026-03-07

### Added
- Commercial-focused README rewrite with:
  - system purpose and architecture,
  - pain points solved,
  - first-time and returning-user usage paths,
  - commercial packaging checklist.
- Release gate tooling:
  - `scripts/release-check.sh`,
  - GitHub Actions workflow `.github/workflows/release-check.yml`.
- Proprietary commercial `LICENSE` file.
- Init/reconfigure/upgrade/doctor command set and supporting scripts for non-destructive bootstrap/migration.
- Runtime config templates for clean workspace initialization, including model and provider configs.
- Interactive terminal chat:
  - new command `yaswarm chat`,
  - supports guided configuration commands in-chat (`/missing`, `/set`, `/doctor`, `/register`, `/swarm-init`, `/dispatch`).
- Telegram bridge worker:
  - new commands `yaswarm telegram bridge-once` and `yaswarm telegram bridge-loop [interval_sec]`,
  - polls bot updates and routes topic messages through YaSwarm chat orchestration.
- Agency API CLI bridge:
  - new `yaswarm agency ...` namespace for backend-governed operations (department backend/model updates, governor, permissions, approvals, terminal exec).
  - new `yaswarm agency status` command for one-shot health/auth/catalog source checks.
  - new MCP/skills commands: `skills-list`, `skills-routing`, `skill-get`, `mcp-servers`, `mcp-tools`, `mcp-registry`, `mcp-config`, `mcp-env-list`, `mcp-env-set`.
- Chat CLI integration commands:
  - `/skills`, `/skill <name>`, `/skills-routing`,
  - `/mcp-servers`, `/mcp-tools`, `/mcp-env`, `/mcp-set <KEY> <VALUE>`.

### Changed
- Model backend strategy updated to:
  - `pi-mono` as CLI backend (not API endpoint),
  - runtime acceptance of either `pi-mono` backend or direct provider fallback.
- CLI expanded with:
  - `yaswarm reconfigure`,
  - `yaswarm upgrade`,
  - `yaswarm doctor`,
  - `yaswarm pi status|verify|verify-runtime|setup`.
- Runtime guards now enforce model-provider readiness before `register` and `swarm init`.
- Agency UI chat backend (`/api/chat/send`) now delegates to shared `scripts/chat-cli.py` logic for consistent behavior across terminal and UI.
- Unified catalog path resolution:
  - CLI `yaswarm skill list` now prefers the shared skills catalog registry repo.
  - CLI `yaswarm mcp list` now supports shared MCP catalog fallback.
  - Agency UI backend skills/mcp routes now resolve from shared catalog repositories with workspace/local fallbacks.

### Fixed
- Docker runtime dependency gap:
  - added `python3` and `ripgrep` to `Dockerfile` so CLI/runtime scripts execute correctly in container.
- README/GitHub visibility gap addressed by committing and pushing all pending core updates.

### Validated End-to-End
- Local checks:
  - `./scripts/release-check.sh` passes with `fail=0 warn=0`.
  - `./tests/init_non_destructive.sh` passes.
  - `./tests/init_fresh_workspace.sh` passes.
- Docker checks:
  - `docker compose up -d --build` succeeds.
  - `yaswarm upgrade` succeeds for workspace config alignment.
  - `yaswarm pi setup --command bash` and `yaswarm pi verify-runtime` succeed.
  - `yaswarm doctor` passes.
  - `yaswarm register` returns success.
  - `yaswarm swarm status` returns success with department state summary.
