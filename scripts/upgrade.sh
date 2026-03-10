#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET=""
DRY_RUN=0
PASSTHROUGH=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --to)
      TARGET="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      PASSTHROUGH+=(--dry-run)
      shift
      ;;
    *)
      PASSTHROUGH+=("$1")
      shift
      ;;
  esac
done

if [[ -n "$TARGET" ]]; then
  echo "Requested target version: $TARGET"
fi

"$ROOT/scripts/migrate-configs.sh" "${PASSTHROUGH[@]}"

echo "Upgrade flow complete."
