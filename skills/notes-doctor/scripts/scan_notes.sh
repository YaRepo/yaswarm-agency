#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$HOME/Documents}"

if [ ! -d "$ROOT" ]; then
  echo "error: notes root not found: $ROOT" >&2
  exit 1
fi

find "$ROOT" -type f \( -name '*.md' -o -name '*.txt' -o -name '*.rtf' \) -print | while read -r f; do
  size=$(wc -c < "$f" | tr -d ' ')
  lines=$(wc -l < "$f" | tr -d ' ')
  echo "$f|$size|$lines"
done
