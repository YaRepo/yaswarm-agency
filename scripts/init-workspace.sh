#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATES="$ROOT/catalog/templates"
WORKSPACE_PATH="$ROOT/projects/yaswarm-desk-workspace"
FORCE_CLEAN=0

usage() {
  cat << HELP
Usage: scripts/init-workspace.sh [--workspace <path>] [--force-clean]

Creates a clean YaSwarm workspace baseline.
Will refuse to touch non-empty/configured workspace unless --force-clean is provided.
HELP
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --workspace)
      WORKSPACE_PATH="${2:-}"
      shift 2
      ;;
    --force-clean)
      FORCE_CLEAN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$WORKSPACE_PATH" ]]; then
  echo "workspace path is required" >&2
  exit 1
fi

AGENCY_ROOT="$WORKSPACE_PATH/agency"
CONFIG_ROOT="$AGENCY_ROOT/config"

is_non_empty_dir() {
  local d="$1"
  [[ -d "$d" ]] && find "$d" -mindepth 1 -print -quit | grep -q .
}

is_configured_workspace() {
  local agency_root="$1"
  local config="$agency_root/config/agency-config.json"
  if [[ -f "$config" ]]; then
    python3 - "$config" << 'PY'
import json,sys
p=sys.argv[1]
with open(p,'r',encoding='utf-8') as f:
    d=json.load(f)
if d.get('departments'):
    raise SystemExit(0)
raise SystemExit(1)
PY
    if [[ $? -eq 0 ]]; then
      return 0
    fi
  fi

  local env_file="$agency_root/.env"
  if [[ -f "$env_file" ]] && rg -n '^YASWARM_.*_BOT_TOKEN=.+' "$env_file" >/dev/null 2>&1; then
    return 0
  fi

  return 1
}

if is_non_empty_dir "$WORKSPACE_PATH"; then
  if [[ "$FORCE_CLEAN" -ne 1 ]]; then
    echo "Workspace is not empty: $WORKSPACE_PATH" >&2
    echo "Refusing to modify existing setup without --force-clean" >&2
    exit 2
  fi
  find "$WORKSPACE_PATH" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
fi

if is_configured_workspace "$AGENCY_ROOT"; then
  if [[ "$FORCE_CLEAN" -ne 1 ]]; then
    echo "Configured workspace detected at: $AGENCY_ROOT" >&2
    echo "Refusing to overwrite existing user setup without --force-clean" >&2
    exit 3
  fi
fi

mkdir -p \
  "$CONFIG_ROOT" \
  "$AGENCY_ROOT/agents/departments" \
  "$AGENCY_ROOT/desk/inbox" \
  "$AGENCY_ROOT/desk/wip" \
  "$AGENCY_ROOT/desk/review" \
  "$AGENCY_ROOT/desk/done" \
  "$AGENCY_ROOT/desk/rejected" \
  "$AGENCY_ROOT/desk/tickets" \
  "$AGENCY_ROOT/logs" \
  "$AGENCY_ROOT/memory" \
  "$AGENCY_ROOT/skill-system/registry" \
  "$AGENCY_ROOT/skills"

NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

render_template() {
  local src="$1" out="$2"
  sed \
    -e "s|__NOW__|$NOW|g" \
    -e "s|__AGENCY_ROOT__|$AGENCY_ROOT|g" \
    -e "s|__AGENCY_CONFIG__|$CONFIG_ROOT/agency-config.json|g" \
    "$src" > "$out"
}

render_template "$TEMPLATES/agency-config.clean.json" "$CONFIG_ROOT/agency-config.json"
render_template "$TEMPLATES/department-sub-agents.clean.json" "$CONFIG_ROOT/department-sub-agents.json"
render_template "$TEMPLATES/agent-registry.clean.json" "$CONFIG_ROOT/agent-registry.json"
render_template "$TEMPLATES/model-providers.clean.json" "$CONFIG_ROOT/model-providers.json"
render_template "$TEMPLATES/model-catalog.clean.json" "$CONFIG_ROOT/model-catalog.json"
render_template "$TEMPLATES/model-assignments.clean.json" "$CONFIG_ROOT/model-assignments.json"
render_template "$TEMPLATES/pi-mono.clean.json" "$CONFIG_ROOT/pi-mono.json"

cat > "$CONFIG_ROOT/env.example" << 'ENV'
# YaSwarm environment template (clean baseline)
YASWARM_TOKEN=
YASWARM_CEO_BOT_TOKEN=
Z_AI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
ENV

cat > "$CONFIG_ROOT/runtime.example.json" << 'RUNTIME'
{
  "version": "1.0.0",
  "chat_mode": "server-relay",
  "vector_enabled": true,
  "department_model_override_enabled": true
}
RUNTIME

cat > "$AGENCY_ROOT/.env" << 'ENV'
# Fill tokens via UI or CLI after init.
YASWARM_TOKEN=
YASWARM_CEO_BOT_TOKEN=
ENV

echo "Initialized clean workspace at: $WORKSPACE_PATH"
echo "Next: run 'yaswarm register' after first department is created via UI wizard."
