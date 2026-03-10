#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE="${YASWARM_WORKSPACE:-$ROOT/projects/yaswarm-desk-workspace}"
OWNER="${YASWARM_GITHUB_OWNER:-${GITHUB_OWNER:-}}"
NON_INTERACTIVE=0

usage() {
  cat <<HELP
Usage: scripts/setup.sh [--workspace <path>] [--owner <github_owner>] [--non-interactive]

Guided first-run setup for YaSwarm Agency.
HELP
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --workspace)
      WORKSPACE="${2:-}"
      shift 2
      ;;
    --owner)
      OWNER="${2:-}"
      shift 2
      ;;
    --non-interactive)
      NON_INTERACTIVE=1
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

if [[ "$NON_INTERACTIVE" -eq 0 ]]; then
  echo "Recommendation: use a dedicated GitHub owner/org for YaSwarm (for example: yourname-yaswarm)."
  read -r -p "GitHub owner/org for project repos [${OWNER:-}]: " owner_input || true
  if [[ -n "${owner_input:-}" ]]; then OWNER="$owner_input"; fi

  read -r -p "Workspace path [$WORKSPACE]: " ws_input || true
  if [[ -n "${ws_input:-}" ]]; then WORKSPACE="$ws_input"; fi
fi

if [[ -z "$OWNER" ]]; then
  echo "GitHub owner is required. Use --owner or set YASWARM_GITHUB_OWNER."
  exit 1
fi

mkdir -p "$WORKSPACE"
mkdir -p "$ROOT/catalog"
if [[ ! -f "$ROOT/catalog/repo-catalog.json" ]]; then
  "$ROOT/scripts/repo-catalog-init.sh" >/dev/null 2>&1 || true
fi

# Initialize clean workspace and baseline configs.
"$ROOT/scripts/init-workspace.sh" --workspace "$WORKSPACE"
"$ROOT/scripts/migrate-configs.sh" --workspace "$WORKSPACE"

AGENCY_ROOT="$WORKSPACE/agency"
CONFIG_ROOT="$AGENCY_ROOT/config"
mkdir -p "$CONFIG_ROOT"

if [[ ! -f "$ROOT/.env" ]]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
fi

upsert_env() {
  local file="$1" key="$2" value="$3"
  touch "$file"
  if rg -n "^${key}=" "$file" >/dev/null 2>&1; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

upsert_env "$ROOT/.env" "YASWARM_GITHUB_OWNER" "$OWNER"
upsert_env "$ROOT/.env" "YASWARM_WORKSPACE" "$WORKSPACE"
upsert_env "$ROOT/.env" "GITHUB_OWNER" "$OWNER"

SECRETS_FILE="$CONFIG_ROOT/secrets.env"
touch "$SECRETS_FILE"
chmod 600 "$SECRETS_FILE"

ensure_secret_key() {
  local key="$1"
  if ! rg -n "^${key}=" "$SECRETS_FILE" >/dev/null 2>&1; then
    echo "${key}=" >> "$SECRETS_FILE"
  fi
}

ensure_secret_key "ZAI_API_KEY"
ensure_secret_key "OPENAI_API_KEY"
ensure_secret_key "ANTHROPIC_API_KEY"
ensure_secret_key "YASWARM_CEO_BOT_TOKEN"
ensure_secret_key "YASWARM_TELEGRAM_RELAY_BOT_TOKEN"

if [[ "$NON_INTERACTIVE" -eq 0 ]]; then
  echo "Enter API keys if available (press Enter to skip)."
  for k in ZAI_API_KEY OPENAI_API_KEY ANTHROPIC_API_KEY YASWARM_CEO_BOT_TOKEN YASWARM_TELEGRAM_RELAY_BOT_TOKEN; do
    read -r -p "$k: " val || true
    if [[ -n "${val:-}" ]]; then
      if rg -n "^${k}=" "$SECRETS_FILE" >/dev/null 2>&1; then
        sed -i "s|^${k}=.*|${k}=${val}|" "$SECRETS_FILE"
      else
        echo "${k}=${val}" >> "$SECRETS_FILE"
      fi
    fi
  done
fi

cp "$ROOT/catalog/templates/mcp-config.default.json" "$CONFIG_ROOT/mcp-config.json"
cp "$ROOT/catalog/templates/project-repo-defaults.json" "$CONFIG_ROOT/project-repo-defaults.json"
cp "$ROOT/catalog/templates/data-services.json" "$CONFIG_ROOT/data-services.json"

python3 - "$CONFIG_ROOT/mcp-config.json" "$WORKSPACE" <<'PY'
import json,sys
p,workspace=sys.argv[1:]
with open(p,'r',encoding='utf-8') as f:
    d=json.load(f)
fs = d.get("servers", {}).get("filesystem", {})
args = fs.get("args", [])
if len(args) >= 3:
    args[2] = workspace
trem = d.get("servers", {}).get("tremcp-ssh", {})
targs = trem.get("args", [])
if targs:
    targs[0] = f"{workspace}/tremcp-ssh/tremcp_ssh/server.py"
with open(p,'w',encoding='utf-8') as f:
    json.dump(d,f,indent=2)
    f.write('\n')
PY

python3 - "$CONFIG_ROOT/project-repo-defaults.json" "$OWNER" <<'PY'
import json,sys
p,owner=sys.argv[1:]
with open(p,'r',encoding='utf-8') as f:
    d=json.load(f)
d['github_owner']=owner
with open(p,'w',encoding='utf-8') as f:
    json.dump(d,f,indent=2)
    f.write('\n')
PY

mkdir -p "$AGENCY_ROOT/skills"
for s in \
  assistant-core-architecture-governor \
  telegram-debugging \
  yamind-memory-sql \
  yamind-dev-mcp-builder \
  yaswarm-skill-creator; do
  if [[ -d "$ROOT/skills/$s" ]]; then
    rm -rf "$AGENCY_ROOT/skills/$s"
    cp -a "$ROOT/skills/$s" "$AGENCY_ROOT/skills/$s"
  fi
done

mkdir -p "$ROOT/catalog"
cat > "$ROOT/catalog/install-state.json" <<JSON
{
  "version": "1.0.0",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "workspace": "$WORKSPACE",
  "github_owner": "$OWNER",
  "services": {
    "ui": true,
    "bridge": true,
    "hive_memory": true,
    "rag_vector": true
  }
}
JSON

"$ROOT/scripts/doctor.sh" "$WORKSPACE" || true

echo
echo "Setup complete."
echo "Workspace: $WORKSPACE"
echo "GitHub owner: $OWNER"
echo "Secrets file: $SECRETS_FILE"
echo "Next: yaswarm up"
