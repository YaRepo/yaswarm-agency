#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE="${YASWARM_WORKSPACE:-$ROOT/projects/yaswarm-desk-workspace}"
REMOVE_VOLUMES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --workspace)
      WORKSPACE="${2:-}"
      shift 2
      ;;
    --remove-volumes)
      REMOVE_VOLUMES=1
      shift
      ;;
    -h|--help)
      echo "Usage: scripts/down.sh [--workspace <path>] [--remove-volumes]"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

export YASWARM_WORKSPACE="$WORKSPACE"
if [[ "$REMOVE_VOLUMES" -eq 1 ]]; then
  docker compose down --remove-orphans -v
else
  docker compose down --remove-orphans
fi

echo "Stack stopped"
