#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CATALOG="$ROOT/catalog/repo-catalog.json"
PROJECTS_DIR="$ROOT/projects"
mkdir -p "$PROJECTS_DIR" "$ROOT/catalog"

ensure_catalog() {
  if [[ ! -f "$CATALOG" ]]; then
    cat > "$CATALOG" << JSON
{
  "version": "1.0.0",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "projects": []
}
JSON
  fi
}

py_update_catalog() {
  python3 - "$CATALOG" "$@" << 'PY'
import json,sys,datetime,os
catalog_path=sys.argv[1]
action=sys.argv[2]
args=sys.argv[3:]
now=datetime.datetime.now(datetime.UTC).replace(microsecond=0).isoformat().replace("+00:00","Z")
with open(catalog_path,'r',encoding='utf-8') as f:
    d=json.load(f)
d.setdefault('projects',[])

if action=='upsert':
    name,repo_url,mode,local_path=args
    found=None
    for p in d['projects']:
        if p.get('name')==name:
            found=p
            break
    payload={
        'name':name,
        'repo_url':repo_url,
        'mode':mode,
        'local_path':local_path,
        'updated_at':now,
    }
    if found:
        found.update(payload)
    else:
        payload['created_at']=now
        d['projects'].append(payload)
elif action=='list':
    for p in d['projects']:
        print(f"{p.get('name','')}\t{p.get('mode','')}\t{p.get('repo_url','')}\t{p.get('local_path','')}")
    sys.exit(0)
elif action=='get':
    name=args[0]
    for p in d['projects']:
        if p.get('name')==name:
            print(json.dumps(p))
            sys.exit(0)
    sys.exit(1)


d['updated_at']=now
with open(catalog_path,'w',encoding='utf-8') as f:
    json.dump(d,f,indent=2)
PY
}

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//'
}

create_new() {
  local project_name="$1"
  local visibility="${2:-private}"
  local owner="${GITHUB_OWNER:-}"

  if [[ -z "$owner" ]]; then
    owner="$(gh api user --jq '.login')"
  fi

  local slug
  slug="$(slugify "$project_name")"
  local repo="$owner/$slug"
  local local_path="$PROJECTS_DIR/$slug"

  mkdir -p "$local_path"

  if ! gh repo view "$repo" >/dev/null 2>&1; then
    gh repo create "$repo" "--$visibility" --description "YaMind Swarm project: $project_name"
  fi

  if [[ ! -d "$local_path/.git" ]]; then
    git -C "$local_path" init
    git -C "$local_path" checkout -b main || true
    git -C "$local_path" remote remove origin >/dev/null 2>&1 || true
    git -C "$local_path" remote add origin "https://github.com/$repo.git"
    cat > "$local_path/README.md" << MARKDOWN
# $project_name

Managed by YaMind Swarm.
MARKDOWN
    git -C "$local_path" add .
    git -C "$local_path" commit -m "Initialize project via YaMind Swarm" || true
    git -C "$local_path" push -u origin main || true
  fi

  py_update_catalog upsert "$project_name" "https://github.com/$repo" "new" "$local_path"
  echo "Created and linked project: $project_name -> https://github.com/$repo"
}

link_existing() {
  local project_name="$1"
  local repo_url="$2"
  local slug
  slug="$(slugify "$project_name")"
  local local_path="$PROJECTS_DIR/$slug"

  mkdir -p "$local_path"
  if [[ ! -d "$local_path/.git" ]]; then
    git -C "$local_path" init
    git -C "$local_path" checkout -b main || true
    git -C "$local_path" remote add origin "$repo_url"
  else
    git -C "$local_path" remote remove origin >/dev/null 2>&1 || true
    git -C "$local_path" remote add origin "$repo_url"
  fi

  py_update_catalog upsert "$project_name" "$repo_url" "existing" "$local_path"
  echo "Linked existing repo: $project_name -> $repo_url"
}

sync_project() {
  local project_name="$1"
  local info
  info="$(py_update_catalog get "$project_name" || true)"
  if [[ -z "$info" ]]; then
    echo "Project not found in catalog: $project_name" >&2
    exit 1
  fi
  local local_path
  local_path="$(python3 - << PY
import json,sys
print(json.loads('''$info''')['local_path'])
PY
)"

  if [[ ! -d "$local_path/.git" ]]; then
    echo "Not a git repo: $local_path" >&2
    exit 1
  fi

  git -C "$local_path" add .
  git -C "$local_path" commit -m "YaMind Swarm sync $(date -u +%Y-%m-%dT%H:%M:%SZ)" || true
  git -C "$local_path" push || true
  echo "Synced: $project_name"
}

list_projects() {
  py_update_catalog list
}

usage() {
  cat << HELP
repo-catalog commands:
  create-new <project_name> [private|public]
  link-existing <project_name> <repo_url>
  sync <project_name>
  list
HELP
}

ensure_catalog
sub="${1:-}"
case "$sub" in
  create-new) shift; create_new "$@" ;;
  link-existing) shift; link_existing "$@" ;;
  sync) shift; sync_project "$@" ;;
  list) list_projects ;;
  *) usage; exit 1 ;;
esac
