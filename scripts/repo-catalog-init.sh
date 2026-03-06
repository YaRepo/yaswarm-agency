#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "$ROOT/catalog"
if [[ ! -f "$ROOT/catalog/repo-catalog.json" ]]; then
  cat > "$ROOT/catalog/repo-catalog.json" << JSON
{
  "version": "1.0.0",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "projects": []
}
JSON
  echo "Created repo catalog at $ROOT/catalog/repo-catalog.json"
else
  echo "Repo catalog already exists"
fi
