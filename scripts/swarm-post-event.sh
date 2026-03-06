#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVENT="${1:-unknown}"
TASK_ID="${2:-}"

# Always refresh dashboard view
python3 "$ROOT/scripts/dashboard-bridge.py" >/dev/null || true

# Optional auto-sync policies
# SWARM_AUTO_SYNC=1 -> sync all repos after swarm events
if [[ "${SWARM_AUTO_SYNC:-0}" == "1" ]]; then
  "$ROOT/scripts/repo-catalog.sh" sync-all >/dev/null 2>&1 || true
fi

# SWARM_AUTO_SYNC_DAEMON=1 -> ensure daemon running
if [[ "${SWARM_AUTO_SYNC_DAEMON:-0}" == "1" ]]; then
  "$ROOT/scripts/auto-sync.sh" start "${YASWARM_SYNC_INTERVAL_SEC:-180}" >/dev/null 2>&1 || true
fi

echo "swarm post-event handled: event=$EVENT task=$TASK_ID"
