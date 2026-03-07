#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

WS="$TMPDIR/new-workspace"
"$ROOT/scripts/init-workspace.sh" --workspace "$WS"

for f in \
  "$WS/agency/config/agency-config.json" \
  "$WS/agency/config/department-sub-agents.json" \
  "$WS/agency/config/agent-registry.json" \
  "$WS/agency/config/model-providers.json" \
  "$WS/agency/config/model-catalog.json" \
  "$WS/agency/config/model-assignments.json"; do
  [[ -f "$f" ]] || { echo "FAIL: missing $f"; exit 1; }
done

python3 - "$WS/agency/config/agency-config.json" <<'PY'
import json,sys
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    d=json.load(f)
assert isinstance(d.get('departments'), dict)
assert len(d['departments']) == 0
print('PASS: clean departments baseline')
PY
