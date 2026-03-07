#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OWNER="${GITHUB_OWNER:-}"
VISIBILITY="private"
WORKSPACE=""
FORCE_CLEAN=0
DRY_RUN=0
SKIP_REPOS=0

usage() {
  cat << HELP
Usage:
  yaswarm init --github-owner <owner> [--private|--public] [--new-workspace <path>] [--force-clean] [--dry-run] [--skip-repos]

Commercial-safe bootstrap. Non-destructive unless --force-clean is set for workspace init.
HELP
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --github-owner)
      OWNER="${2:-}"
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
    --new-workspace)
      WORKSPACE="${2:-}"
      shift 2
      ;;
    --force-clean)
      FORCE_CLEAN=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --skip-repos)
      SKIP_REPOS=1
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

if [[ -z "$WORKSPACE" ]]; then
  WORKSPACE="$ROOT/projects/yaswarm-desk-workspace"
fi

if [[ "$SKIP_REPOS" -ne 1 ]]; then
  if [[ -z "$OWNER" ]]; then
    echo "--github-owner is required unless --skip-repos is used" >&2
    exit 1
  fi
  REPO_ARGS=(--github-owner "$OWNER" "--$VISIBILITY")
  [[ "$DRY_RUN" -eq 1 ]] && REPO_ARGS+=(--dry-run)
  "$ROOT/scripts/init-repos.sh" "${REPO_ARGS[@]}"
fi

WS_ARGS=(--workspace "$WORKSPACE")
[[ "$FORCE_CLEAN" -eq 1 ]] && WS_ARGS+=(--force-clean)
"$ROOT/scripts/init-workspace.sh" "${WS_ARGS[@]}"

echo
echo "YaSwarm init complete"
echo "Workspace: $WORKSPACE"
echo "Next steps:"
echo "  1) Start dashboard UI"
echo "  2) Use Add Department wizard"
echo "  3) Configure pi-mono CLI: yaswarm pi setup --command pi-mono --llm <id> --vlm <id> --tts <id>"
echo "  4) Run: yaswarm register"
