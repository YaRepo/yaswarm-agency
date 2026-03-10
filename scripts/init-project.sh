#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE="${YASWARM_WORKSPACE:-$ROOT/projects/yaswarm-desk-workspace}"
CONFIG="$WORKSPACE/agency/config/project-repo-defaults.json"

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/init-project.sh <project_name> [--public|--private]"
  exit 1
fi

PROJECT_NAME="$1"
shift || true
VISIBILITY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --public)
      VISIBILITY="public"
      shift
      ;;
    --private)
      VISIBILITY="private"
      shift
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$CONFIG" ]]; then
  echo "Missing config: $CONFIG"
  echo "Run 'yaswarm setup' first."
  exit 1
fi

OWNER="$(python3 - <<PY
import json
with open('$CONFIG','r',encoding='utf-8') as f:
 d=json.load(f)
print(d.get('github_owner',''))
PY
)"
DEFAULT_VIS="$(python3 - <<PY
import json
with open('$CONFIG','r',encoding='utf-8') as f:
 d=json.load(f)
print(d.get('default_visibility','private'))
PY
)"
TEMPLATE_REPO="$(python3 - <<PY
import json
with open('$CONFIG','r',encoding='utf-8') as f:
 d=json.load(f)
print(d.get('template_repo',''))
PY
)"

if [[ -z "$OWNER" ]]; then
  echo "github_owner missing in $CONFIG"
  exit 1
fi

if [[ -z "$VISIBILITY" ]]; then
  VISIBILITY="$DEFAULT_VIS"
fi

mkdir -p "$WORKSPACE/projects"
TARGET_DIR="$WORKSPACE/projects/$PROJECT_NAME"
if [[ -e "$TARGET_DIR" ]]; then
  echo "Project directory already exists: $TARGET_DIR"
  exit 1
fi

if [[ -n "$TEMPLATE_REPO" ]]; then
  gh repo create "$OWNER/$PROJECT_NAME" --"$VISIBILITY" --template "$TEMPLATE_REPO" --clone "$TARGET_DIR"
else
  gh repo create "$OWNER/$PROJECT_NAME" --"$VISIBILITY" --clone "$TARGET_DIR"
fi

echo "Initialized project repo: $OWNER/$PROJECT_NAME ($VISIBILITY)"
echo "Local path: $TARGET_DIR"
