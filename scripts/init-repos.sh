#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CATALOG="$ROOT/catalog/repo-catalog.json"
PROJECTS_DIR="$ROOT/projects"
GITHUB_OWNER="${GITHUB_OWNER:-}"
VISIBILITY="private"
DRY_RUN=0

usage() {
  cat << HELP
Usage: scripts/init-repos.sh --github-owner <owner> [--private|--public] [--dry-run]

Ensures core YaSwarm repos exist and registers them in catalog/repo-catalog.json.
Non-destructive: does not alter existing local repo remotes/content.
HELP
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --github-owner)
      GITHUB_OWNER="${2:-}"
      shift 2
      ;;
    --private)
      VISIBILITY="private"
      shift
      ;;
    --public)
      VISIBILITY="public"
      shift
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

if [[ -z "$GITHUB_OWNER" ]]; then
  echo "--github-owner is required" >&2
  exit 1
fi

if [[ "$DRY_RUN" -ne 1 ]]; then
  gh auth status >/dev/null
fi

mkdir -p "$PROJECTS_DIR" "$ROOT/catalog"
if [[ ! -f "$CATALOG" ]]; then
  cat > "$CATALOG" << JSON
{
  "version": "1.0.0",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "projects": []
}
JSON
fi

upsert_catalog() {
  local name="$1" url="$2" mode="$3" local_path="$4"
  python3 - "$CATALOG" "$name" "$url" "$mode" "$local_path" << 'PY'
import json,sys,datetime
catalog,name,url,mode,local_path=sys.argv[1:]
now=datetime.datetime.now(datetime.UTC).replace(microsecond=0).isoformat().replace('+00:00','Z')
with open(catalog,'r',encoding='utf-8') as f:
    d=json.load(f)
projects=d.setdefault('projects',[])
entry=None
for p in projects:
    if p.get('name')==name:
        entry=p
        break
payload={
    'name':name,
    'repo_url':url,
    'mode':mode,
    'local_path':local_path,
    'updated_at':now,
}
if entry is None:
    payload['created_at']=now
    projects.append(payload)
else:
    entry.update(payload)
d['updated_at']=now
with open(catalog,'w',encoding='utf-8') as f:
    json.dump(d,f,indent=2)
PY
}

ensure_repo() {
  local repo="$1"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] ensure repo: $GITHUB_OWNER/$repo"
    return 0
  fi
  if ! gh repo view "$GITHUB_OWNER/$repo" >/dev/null 2>&1; then
    gh repo create "$GITHUB_OWNER/$repo" "--$VISIBILITY" --description "YaSwarm commercial bootstrap: $repo" >/dev/null
    echo "created: $GITHUB_OWNER/$repo"
  fi
}

register_repo() {
  local name="$1" repo="$2" local_path="$3"
  local url="https://github.com/$GITHUB_OWNER/$repo"
  local mode="existing"

  ensure_repo "$repo"

  mkdir -p "$local_path"
  if [[ ! -d "$local_path/.git" ]]; then
    mode="new"
  fi

  upsert_catalog "$name" "$url" "$mode" "$local_path"
  echo "registered: $name -> $url"
}

AGENCY_LOCAL="$ROOT"
if [[ "$(basename "$ROOT")" != "yaswarm-agency" ]]; then
  AGENCY_LOCAL="$PROJECTS_DIR/yaswarm-agency"
fi

register_repo "yaswarm-agency" "yaswarm-agency" "$AGENCY_LOCAL"
register_repo "yaswarm-project-template" "yaswarm-project-template" "$PROJECTS_DIR/yaswarm-project-template"

echo "Repo init complete"
