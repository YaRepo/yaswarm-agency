#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
if [[ -z "$MODE" ]]; then
  echo "Usage: bots-manage.sh <list|reconcile>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENCY_ROOT="${YASWARM_AGENCY_ROOT:-${AGENCY_ROOT:-$ROOT/projects/yaswarm-desk-workspace/agency}}"
CONFIG_PATH="$AGENCY_ROOT/config/agency-config.json"
REGISTRY_PATH="$AGENCY_ROOT/config/agent-registry.json"

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "agency-config.json not found: $CONFIG_PATH" >&2
  exit 1
fi

python3 - "$MODE" "$AGENCY_ROOT" "$CONFIG_PATH" "$REGISTRY_PATH" <<'PY'
import json
import sys
from datetime import datetime, UTC
from pathlib import Path

mode = sys.argv[1]
agency_root = Path(sys.argv[2])
config_path = Path(sys.argv[3])
registry_path = Path(sys.argv[4])

cfg = json.loads(config_path.read_text(encoding="utf-8"))
departments = sorted((cfg.get("departments") or {}).keys())


def now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_registry() -> dict:
    if registry_path.exists():
        try:
            return json.loads(registry_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "version": "1.0.0",
        "updated_at": now_iso(),
        "source": str(config_path),
        "agents": {},
    }


def save_registry(reg: dict) -> None:
    registry_path.parent.mkdir(parents=True, exist_ok=True)
    registry_path.write_text(json.dumps(reg, indent=2) + "\n", encoding="utf-8")


if mode == "list":
    reg = load_registry()
    registered = sorted((reg.get("agents") or {}).keys())
    print(json.dumps({
        "configured_departments": departments,
        "configured_count": len(departments),
        "registered_agents": registered,
        "registered_count": len(registered),
    }, indent=2))
    raise SystemExit(0)

if mode != "reconcile":
    raise SystemExit(f"Unsupported mode: {mode}")

reg = load_registry()
agents = reg.setdefault("agents", {})

created_workspaces = []
for dep in departments:
    workspace = agency_root / "agents" / "departments" / dep
    if not workspace.exists():
        workspace.mkdir(parents=True, exist_ok=True)
        created_workspaces.append(dep)
    agents[dep] = {
        "id": dep,
        "workspace": str(workspace),
        "managed_by": "yaswarm",
        "status": "ready",
    }

# Keep a stable main orchestrator entry.
agents.setdefault("main", {
    "id": "main",
    "workspace": str(agency_root),
    "managed_by": "yaswarm",
    "status": "ready",
})

# Drop stale managed entries that are no longer configured.
allowed = set(departments) | {"main"}
stale = [k for k in list(agents.keys()) if k not in allowed]
for k in stale:
    agents.pop(k, None)

reg["updated_at"] = now_iso()
reg["source"] = str(config_path)
save_registry(reg)

synced = []
for dep in departments:
    status = "created" if dep in created_workspaces else "exists"
    synced.append({"department": dep, "status": status, "agentId": dep})

print(json.dumps({
    "synced": synced,
    "totalAgents": len(agents),
    "registry": str(registry_path),
}, indent=2))
PY
