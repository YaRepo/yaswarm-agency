#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OWNER="${GITHUB_OWNER:-}"
WORKSPACE="$ROOT/projects/yaswarm-desk-workspace"
VISIBILITY="private"
DRY_RUN=0
SKIP_PULL=0
CREATE_MISSING=1

usage() {
  cat << HELP
Usage: scripts/reconfigure.sh --github-owner <owner> [--workspace <path>] [--private|--public] [--dry-run] [--skip-pull] [--no-create-missing]

Existing-user machine reconfiguration:
- verify/register repos
- clone missing local repos
- pull updates (optional)
- run non-destructive config migrations
- preserve user data
HELP
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --github-owner)
      OWNER="${2:-}"
      shift 2
      ;;
    --workspace)
      WORKSPACE="${2:-}"
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
    --skip-pull)
      SKIP_PULL=1
      shift
      ;;
    --no-create-missing)
      CREATE_MISSING=0
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

if [[ -z "$OWNER" ]]; then
  echo "--github-owner is required" >&2
  exit 1
fi

REPO_ARGS=(--github-owner "$OWNER" "--$VISIBILITY")
[[ "$DRY_RUN" -eq 1 ]] && REPO_ARGS+=(--dry-run)
if [[ "$CREATE_MISSING" -eq 0 ]]; then
  REPO_ARGS+=(--dry-run)
fi
"$ROOT/scripts/init-repos.sh" "${REPO_ARGS[@]}"

CATALOG="$ROOT/catalog/repo-catalog.json"

clone_if_missing() {
  local name="$1" url="$2" local_path="$3"
  if [[ -d "$local_path/.git" ]]; then
    echo "linked: $name ($local_path)"
    return 0
  fi
  mkdir -p "$(dirname "$local_path")"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] clone $url -> $local_path"
    return 0
  fi
  git clone "$url" "$local_path" >/dev/null 2>&1 || {
    echo "warn: clone failed for $name from $url"
    return 0
  }
  echo "cloned: $name"
}

pull_if_possible() {
  local local_path="$1"
  [[ "$SKIP_PULL" -eq 1 ]] && return 0
  [[ -d "$local_path/.git" ]] || return 0
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] pull: $local_path"
    return 0
  fi
  git -C "$local_path" fetch --all --prune >/dev/null 2>&1 || true
  local branch
  branch="$(git -C "$local_path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
  git -C "$local_path" pull --ff-only origin "$branch" >/dev/null 2>&1 || true
  echo "updated: $local_path"
}

python3 - "$CATALOG" << 'PY' > /tmp/yaswarm_repos.tsv
import json,sys
with open(sys.argv[1],'r',encoding='utf-8') as f:
    d=json.load(f)
for p in d.get('projects',[]):
    print(f"{p.get('name','')}\t{p.get('repo_url','')}\t{p.get('local_path','')}")
PY

while IFS=$'\t' read -r name url local_path; do
  [[ -z "$name" ]] && continue
  clone_if_missing "$name" "$url" "$local_path"
  pull_if_possible "$local_path"
done < /tmp/yaswarm_repos.tsv

MIG_ARGS=(--workspace "$WORKSPACE")
[[ "$DRY_RUN" -eq 1 ]] && MIG_ARGS+=(--dry-run)
"$ROOT/scripts/migrate-configs.sh" "${MIG_ARGS[@]}"

if [[ "$DRY_RUN" -eq 0 ]]; then
  "$ROOT/scripts/doctor.sh" "$WORKSPACE" || true
fi

echo "Reconfigure complete"
