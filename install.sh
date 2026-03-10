#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

chmod +x "$ROOT/cli/yaswarm" "$ROOT"/scripts/*.sh
"$ROOT/cli/yaswarm" install
"$ROOT/cli/yaswarm" setup "$@"

echo "YaSwarm Agency bootstrap finished."
