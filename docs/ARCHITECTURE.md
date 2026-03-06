# Architecture

## Layers
1. CLI Layer (`cli/yaswarm`): command routing
2. MCP Layer (`mcp/`, `scripts/mcp-health.sh`): config + health checks + inspector entry
3. Catalog Layer (`catalog/`): skill and repo catalogs
4. Project Layer (`projects/`): user workspace projects

## Design Goal
Keep runtime simple and composable; add features through explicit scripts and JSON catalogs.
