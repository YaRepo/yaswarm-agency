#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE="${YASWARM_WORKSPACE:-$ROOT/projects/yaswarm-desk-workspace}"
profiles=(full)

while [[ $# -gt 0 ]]; do
  case "$1" in
    --workspace)
      WORKSPACE="${2:-}"
      shift 2
      ;;
    --profile)
      profiles+=("${2:-}")
      shift 2
      ;;
    -h|--help)
      echo "Usage: scripts/up.sh [--workspace <path>] [--profile <name>]..."
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

export YASWARM_WORKSPACE="$WORKSPACE"
args=()
for p in "${profiles[@]}"; do
  args+=(--profile "$p")
done

docker compose "${args[@]}" up -d --build

echo "Stack started with profiles: ${profiles[*]}"
