# YaSwarm Agency

`yaswarm-agency` is the public unified monorepo for running the YaSwarm system end-to-end:
- Core CLI/runtime
- Telegram bridge
- Agency UI
- Local Hive memory + local RAG/vector baseline
- Clean setup flow for user-owned project repos

No personal API keys, private infrastructure paths, or founder-specific data are included.

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/YaRepo/yaswarm-agency/main/install.sh | bash
```

Local/manual flow:

```bash
git clone https://github.com/YaRepo/yaswarm-agency
cd yaswarm-agency
./install.sh
```

## Important: Dedicated GitHub Account/Org

Use a dedicated GitHub owner/org for YaSwarm project repos (recommended), for example:
- `yourname-yaswarm`
- `your-org-yaswarm`

Setup will warn if you use a mixed personal owner, but allows it.

## Core Commands

```bash
yaswarm install
yaswarm setup
yaswarm up
yaswarm down
yaswarm doctor
yaswarm release-info
yaswarm init-project <project-name> [--private|--public]
yaswarm upgrade --dry-run
```

## What `yaswarm setup` configures

- Workspace scaffold (`projects/yaswarm-desk-workspace` by default)
- Agency desk lifecycle folders
- Baseline config files (`agency-config`, model files, MCP config)
- Required baseline skills (clean subset)
- Secrets file at `agency/config/secrets.env` (gitignored)
- Local install-state metadata for upgrades

## Default MCP Policy (Safe Minimal)

Enabled by default:
- `context7`
- `memory`
- `filesystem`

Shipped disabled template:
- `tremcp-ssh` (must be explicitly enabled/configured by user)

## Required Baseline Skills

- `assistant-core-architecture-governor`
- `telegram-debugging`
- `yamind-memory-sql`
- `yamind-dev-mcp-builder`
- `yaswarm-skill-creator`

## Stack Services

`yaswarm up` launches Docker Compose profiles (`full` by default):
- `yaswarm-core`
- `yaswarm-bridge`
- `yaswarm-ui`
- `yaswarm-rag` (Chroma)

## Release + Upgrades

- Version file: `VERSION`
- Changelog: `CHANGELOG.md`
- Upgrade entrypoint: `yaswarm upgrade`

Upgrades are additive and should preserve user workspace data.

## Security Baseline

- Never commit secrets to git
- Keep real keys in `agency/config/secrets.env`
- Use private visibility for project repos by default

## License

See `LICENSE`.
