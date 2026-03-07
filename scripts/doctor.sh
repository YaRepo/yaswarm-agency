#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE="${1:-$ROOT/projects/yaswarm-desk-workspace}"
AGENCY_ROOT="$WORKSPACE/agency"
CONFIG_ROOT="$AGENCY_ROOT/config"
CATALOG="$ROOT/catalog/repo-catalog.json"

pass=0
fail=0

check_file() {
  local f="$1"
  if [[ -f "$f" ]]; then
    echo "[PASS] file: $f"
    pass=$((pass+1))
  else
    echo "[FAIL] file: $f"
    fail=$((fail+1))
  fi
}

check_dir() {
  local d="$1"
  if [[ -d "$d" ]]; then
    echo "[PASS] dir:  $d"
    pass=$((pass+1))
  else
    echo "[FAIL] dir:  $d"
    fail=$((fail+1))
  fi
}

echo "YaSwarm Doctor"
echo "workspace: $WORKSPACE"

check_file "$CATALOG"
check_dir "$WORKSPACE"
check_dir "$AGENCY_ROOT"
check_file "$CONFIG_ROOT/agency-config.json"
check_file "$CONFIG_ROOT/department-sub-agents.json"
check_file "$CONFIG_ROOT/agent-registry.json"
check_file "$CONFIG_ROOT/model-providers.json"
check_file "$CONFIG_ROOT/model-catalog.json"
check_file "$CONFIG_ROOT/model-assignments.json"
check_file "$CONFIG_ROOT/pi-mono.json"

if "$ROOT/scripts/pi-mono.sh" verify-runtime --workspace "$WORKSPACE" --quiet; then
  echo "[PASS] model provider runtime: ready (pi-mono or fallback)"
  pass=$((pass+1))
else
  echo "[FAIL] model provider runtime: not configured (run: yaswarm pi setup ... or configure fallback)"
  fail=$((fail+1))
fi

echo
echo "summary: pass=$pass fail=$fail"
if [[ "$fail" -gt 0 ]]; then
  echo "doctor status: FAIL"
  exit 1
fi

echo "doctor status: OK"
