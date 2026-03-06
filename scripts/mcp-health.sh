#!/usr/bin/env bash
set -euo pipefail
CFG="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/mcp/mcp-config.json"
UI_PORT="${MCP_INSPECTOR_CLIENT_PORT:-6274}"
PX_PORT="${MCP_INSPECTOR_SERVER_PORT:-6277}"

echo "[YaMind Swarm] MCP Health"
echo "timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
[[ -f "$CFG" ]] && echo "config: present" || echo "config: missing"
PIDS=$(pgrep -f "@modelcontextprotocol/inspector" || true)
[[ -n "$PIDS" ]] && echo "inspector_process: running ($PIDS)" || echo "inspector_process: not_running"
if command -v ss >/dev/null 2>&1; then
  ss -lnt | grep -q ":$UI_PORT " && echo "ui_port_$UI_PORT: open" || echo "ui_port_$UI_PORT: closed"
  ss -lnt | grep -q ":$PX_PORT " && echo "proxy_port_$PX_PORT: open" || echo "proxy_port_$PX_PORT: closed"
else
  echo "port_check: skipped (ss unavailable)"
fi
