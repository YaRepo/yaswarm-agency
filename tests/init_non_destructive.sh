#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

WS="$TMPDIR/workspace"
mkdir -p "$WS/agency/config"
cat > "$WS/agency/config/agency-config.json" <<'JSON'
{
  "ceo": {"departments": ["research"]},
  "departments": {"research": {"bot_id": "x"}}
}
JSON

set +e
"$ROOT/scripts/init-workspace.sh" --workspace "$WS" >/tmp/yaswarm_test_out.txt 2>&1
rc=$?
set -e

if [[ "$rc" -eq 0 ]]; then
  echo "FAIL: expected non-zero exit for configured workspace"
  cat /tmp/yaswarm_test_out.txt
  exit 1
fi

echo "PASS: non-destructive guard blocked configured workspace (rc=$rc)"
