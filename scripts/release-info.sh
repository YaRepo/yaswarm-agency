#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VER_FILE="$ROOT/VERSION"
CHANGELOG="$ROOT/CHANGELOG.md"

if [[ -f "$VER_FILE" ]]; then
  version="$(cat "$VER_FILE")"
else
  version="0.0.0-unknown"
fi

echo "YaSwarm Agency Release Info"
echo "version: $version"
if [[ -f "$CHANGELOG" ]]; then
  echo "changelog: $CHANGELOG"
  echo "latest entries:"
  sed -n '1,40p' "$CHANGELOG"
fi
