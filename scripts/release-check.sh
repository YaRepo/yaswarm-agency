#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
warn=0

pass() { echo "[PASS] $*"; }
fail_check() { echo "[FAIL] $*"; fail=$((fail+1)); }
warn_check() { echo "[WARN] $*"; warn=$((warn+1)); }

require_file() {
  local p="$1"
  [[ -f "$p" ]] && pass "file exists: $p" || fail_check "missing file: $p"
}

require_executable() {
  local p="$1"
  if [[ -x "$p" ]]; then
    pass "executable: $p"
  else
    fail_check "not executable: $p"
  fi
}

syntax_check() {
  local p="$1"
  if bash -n "$p"; then
    pass "bash syntax: $p"
  else
    fail_check "bash syntax error: $p"
  fi
}

echo "== YaSwarm Release Check =="

require_file "README.md"
require_file "LICENSE"
require_file ".env.example"
require_file "cli/yaswarm"
require_file "scripts/init.sh"
require_file "scripts/reconfigure.sh"
require_file "scripts/migrate-configs.sh"
require_file "scripts/doctor.sh"
require_file "scripts/pi-mono.sh"
require_file "scripts/chat-cli.py"
require_file "scripts/telegram-bridge-worker.py"

require_executable "cli/yaswarm"
require_executable "scripts/init.sh"
require_executable "scripts/reconfigure.sh"
require_executable "scripts/migrate-configs.sh"
require_executable "scripts/doctor.sh"
require_executable "scripts/pi-mono.sh"
require_executable "scripts/chat-cli.py"
require_executable "scripts/telegram-bridge-worker.py"

syntax_check "cli/yaswarm"
syntax_check "scripts/init.sh"
syntax_check "scripts/reconfigure.sh"
syntax_check "scripts/migrate-configs.sh"
syntax_check "scripts/doctor.sh"
syntax_check "scripts/pi-mono.sh"
if python3 -m py_compile scripts/chat-cli.py scripts/telegram-bridge-worker.py >/dev/null 2>&1; then
  pass "python syntax: chat/telegram bridge scripts"
else
  fail_check "python syntax error: chat/telegram bridge scripts"
fi

if rg -n "## Commercial Packaging Checklist" README.md >/dev/null; then
  pass "README includes Commercial Packaging Checklist"
else
  fail_check "README missing Commercial Packaging Checklist section"
fi

if rg -n "^\\.env$" .gitignore >/dev/null; then
  pass ".env is gitignored"
else
  fail_check ".env is not gitignored"
fi

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  fail_check ".env is tracked in git"
else
  pass ".env is not tracked"
fi

# High-signal secret scan on core paths only, excluding examples/templates likely to contain placeholders.
mapfile -t CORE_FILES < <(git ls-files README.md cli scripts swarm mcp catalog 2>/dev/null | rg -v '\.example(\.|$)|env\.example$|catalog/templates/|skills/')
if ((${#CORE_FILES[@]} > 0)); then
  if rg -n --pcre2 "(?i)(api[_-]?key|token|secret)[\"']?\\s*[:=]\\s*[\"'][A-Za-z0-9_\\-]{16,}[\"']" "${CORE_FILES[@]}" >/tmp/yaswarm_release_secret_hits.txt; then
    fail_check "possible hardcoded secrets found in core files"
    sed -n '1,20p' /tmp/yaswarm_release_secret_hits.txt
  else
    pass "no obvious hardcoded secrets detected in core files"
  fi
fi

if [[ -s "LICENSE" ]]; then
  pass "LICENSE present and non-empty"
else
  fail_check "LICENSE missing or empty"
fi

echo
echo "summary: fail=$fail warn=$warn"
if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
exit 0
