# YaMind Swarm (Clean Core)

A clean, distributable base for YaMind Swarm (no personal data, no pre-installed user MCPs/skills).

## Includes
- Minimal CLI (`cli/yaswarm`)
- MCP management commands and health check
- Inspector-ready workflow (`yaswarm mcp inspect`)
- Repo catalog bootstrap (`yaswarm repo init`)
- Docker + docker-compose runtime

## Quick Start
```bash
cp .env.example .env
chmod +x cli/yaswarm scripts/*.sh
./cli/yaswarm help
```

## Docker
```bash
docker compose up -d --build
```

## MCP Inspector
```bash
./cli/yaswarm mcp inspect
# UI: http://localhost:6274
```

## Repo Catalog
```bash
./cli/yaswarm repo init
cat catalog/repo-catalog.json
```

## Notes
This repo is intentionally clean. User skills, MCP server entries, sessions, and project data are added post-installation.
