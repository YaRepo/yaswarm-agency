#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATES="$ROOT/catalog/templates"
WORKSPACE_PATH="$ROOT/projects/yaswarm-desk-workspace"
DRY_RUN=0

usage() {
  cat << HELP
Usage: scripts/migrate-configs.sh [--workspace <path>] [--dry-run]

Non-destructive additive migrations for existing YaSwarm workspace.
HELP
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --workspace)
      WORKSPACE_PATH="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
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

AGENCY_ROOT="$WORKSPACE_PATH/agency"
CONFIG_ROOT="$AGENCY_ROOT/config"
mkdir -p "$CONFIG_ROOT"

backup_if_exists() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  local b="${f}.bak.$(date -u +%Y%m%dT%H%M%SZ)"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] backup $f -> $b"
  else
    cp -a "$f" "$b"
    echo "backup: $b"
  fi
}

ensure_file_from_template() {
  local target="$1" template="$2"
  if [[ ! -f "$target" ]]; then
    backup_if_exists "$target"
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] create $target from $template"
    else
      local now
      now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      sed -e "s|__NOW__|$now|g" \
          -e "s|__AGENCY_ROOT__|$AGENCY_ROOT|g" \
          -e "s|__AGENCY_CONFIG__|$CONFIG_ROOT/agency-config.json|g" \
          "$template" > "$target"
      echo "created: $target"
    fi
  fi
}

ensure_file_from_template "$CONFIG_ROOT/agency-config.json" "$TEMPLATES/agency-config.clean.json"
ensure_file_from_template "$CONFIG_ROOT/department-sub-agents.json" "$TEMPLATES/department-sub-agents.clean.json"
ensure_file_from_template "$CONFIG_ROOT/agent-registry.json" "$TEMPLATES/agent-registry.clean.json"
ensure_file_from_template "$CONFIG_ROOT/model-providers.json" "$TEMPLATES/model-providers.clean.json"
ensure_file_from_template "$CONFIG_ROOT/model-catalog.json" "$TEMPLATES/model-catalog.clean.json"
ensure_file_from_template "$CONFIG_ROOT/model-assignments.json" "$TEMPLATES/model-assignments.clean.json"
ensure_file_from_template "$CONFIG_ROOT/pi-mono.json" "$TEMPLATES/pi-mono.clean.json"

patch_json_additive() {
  local f="$1" kind="$2"
  [[ -f "$f" ]] || return 0
  backup_if_exists "$f"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] migrate additive: $f ($kind)"
    return 0
  fi

  python3 - "$f" "$kind" "$AGENCY_ROOT" << 'PY'
import json,sys,datetime
p,kind,agency_root=sys.argv[1:]
with open(p,'r',encoding='utf-8') as f:
    d=json.load(f)
changed=False

def ensure(path, default):
    global changed
    cur=d
    for key in path[:-1]:
      if key not in cur or not isinstance(cur[key], dict):
        cur[key]={}
        changed=True
      cur=cur[key]
    leaf=path[-1]
    if leaf not in cur:
      cur[leaf]=default
      changed=True

if kind=='agency-config':
    ensure(['version'], '1.0.0')
    ensure(['ceo'], {})
    if not isinstance(d.get('ceo'), dict):
      d['ceo']={}; changed=True
    if 'departments' not in d['ceo'] or not isinstance(d['ceo'].get('departments'), list):
      d['ceo']['departments']=[]; changed=True
    if 'departments' not in d or not isinstance(d.get('departments'), dict):
      d['departments']={}; changed=True
elif kind=='dept-sub-agents':
    if 'description' not in d:
      d['description']='YaSwarm department sub-agent definitions.'; changed=True
    if 'departments' not in d or not isinstance(d.get('departments'), dict):
      d['departments']={}; changed=True
elif kind=='agent-registry':
    if 'version' not in d:
      d['version']='1.0.0'; changed=True
    if 'source' not in d:
      d['source']=f"{agency_root}/config/agency-config.json"; changed=True
    if 'agents' not in d or not isinstance(d.get('agents'), dict):
      d['agents']={}; changed=True
    if 'main' not in d['agents']:
      d['agents']['main']={"id":"main","workspace":agency_root,"managed_by":"yaswarm","status":"ready"}; changed=True
elif kind=='model-providers':
    if 'version' not in d:
      d['version']='1.0.0'; changed=True
    if 'providers' not in d or not isinstance(d.get('providers'), list):
      d['providers']=[]; changed=True
elif kind=='model-catalog':
    if 'version' not in d:
      d['version']='1.0.0'; changed=True
    if 'providers' not in d or not isinstance(d.get('providers'), dict):
      d['providers']={}; changed=True
elif kind=='model-assignments':
    if 'version' not in d:
      d['version']='1.0.0'; changed=True
    if 'main' not in d or not isinstance(d.get('main'), dict):
      d['main']={"provider":None,"llm":None,"vlm":None,"tts":None}; changed=True
    else:
      for k in ('provider','llm','vlm','tts'):
        if k not in d['main']:
          d['main'][k]=None; changed=True
    if 'departments' not in d or not isinstance(d.get('departments'), dict):
      d['departments']={}; changed=True
elif kind=='pi-mono':
    if 'version' not in d:
      d['version']='1.0.0'; changed=True
    b=d.get('backend')
    if not isinstance(b, dict):
      b={}; d['backend']=b; changed=True
    if b.get('type') != 'cli':
      b['type']='cli'; changed=True
    if not b.get('command'):
      b['command']='pi-mono'; changed=True
    if 'enabled' not in b:
      b['enabled']=True; changed=True
    m=d.get('main_models')
    if not isinstance(m, dict):
      m={}; d['main_models']=m; changed=True
    for k in ('llm','vlm','tts'):
      if k not in m:
        m[k]=''; changed=True

if changed:
    d['updated_at']=datetime.datetime.now(datetime.UTC).replace(microsecond=0).isoformat().replace('+00:00','Z')
    with open(p,'w',encoding='utf-8') as f:
      json.dump(d,f,indent=2)
      f.write('\n')
    print(f"migrated: {p}")
else:
    print(f"unchanged: {p}")
PY
}

patch_json_additive "$CONFIG_ROOT/agency-config.json" "agency-config"
patch_json_additive "$CONFIG_ROOT/department-sub-agents.json" "dept-sub-agents"
patch_json_additive "$CONFIG_ROOT/agent-registry.json" "agent-registry"
patch_json_additive "$CONFIG_ROOT/model-providers.json" "model-providers"
patch_json_additive "$CONFIG_ROOT/model-catalog.json" "model-catalog"
patch_json_additive "$CONFIG_ROOT/model-assignments.json" "model-assignments"
patch_json_additive "$CONFIG_ROOT/pi-mono.json" "pi-mono"

echo "Migration complete for workspace: $WORKSPACE_PATH"
