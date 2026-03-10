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

echo "== YaSwarm Agency Release Check =="

require_file "README.md"
require_file "LICENSE"
require_file ".env.example"
require_file "VERSION"
require_file "RELEASES.md"
require_file "docker-compose.yml"
require_file "install.sh"
require_file "cli/yaswarm"
require_file "scripts/install.sh"
require_file "scripts/setup.sh"
require_file "scripts/up.sh"
require_file "scripts/down.sh"
require_file "scripts/init-project.sh"
require_file "scripts/upgrade.sh"
require_file "scripts/release-info.sh"
require_file "catalog/templates/mcp-config.default.json"
require_file "catalog/templates/project-repo-defaults.json"
require_file "catalog/templates/data-services.json"
require_file "skills/required/manifest.json"
require_file "apps/agency-ui/Dockerfile"

require_executable "install.sh"
require_executable "cli/yaswarm"
require_executable "scripts/install.sh"
require_executable "scripts/setup.sh"
require_executable "scripts/up.sh"
require_executable "scripts/down.sh"
require_executable "scripts/init-project.sh"
require_executable "scripts/upgrade.sh"
require_executable "scripts/release-info.sh"

syntax_check "install.sh"
syntax_check "cli/yaswarm"
syntax_check "scripts/install.sh"
syntax_check "scripts/setup.sh"
syntax_check "scripts/up.sh"
syntax_check "scripts/down.sh"
syntax_check "scripts/init-project.sh"
syntax_check "scripts/upgrade.sh"
syntax_check "scripts/release-info.sh"
syntax_check "scripts/release-check.sh"

if rg -n "YaSwarm Agency" README.md >/dev/null; then
  pass "README branding validated"
else
  fail_check "README missing YaSwarm Agency branding"
fi

if rg -n "Dedicated GitHub Account/Org|Dedicated GitHub Owner/Org Policy" README.md docs/installation/github-owner-policy.md >/dev/null; then
  pass "dedicated GitHub owner policy documented"
else
  fail_check "missing dedicated GitHub owner policy docs"
fi

if rg -n "^\.env$" .gitignore >/dev/null; then
  pass ".env is gitignored"
else
  fail_check ".env is not gitignored"
fi

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  fail_check ".env is tracked in git"
else
  pass ".env is not tracked"
fi

mapfile -t CORE_FILES < <(git ls-files README.md RELEASES.md VERSION cli scripts swarm mcp catalog docker-compose.yml install.sh 2>/dev/null | rg -v '\.example(\.|$)|env\.example$|catalog/templates/')
if ((${#CORE_FILES[@]} > 0)); then
  if rg -n --pcre2 "(?i)(api[_-]?key|token|secret)[\"']?\s*[:=]\s*[\"'][A-Za-z0-9_\-]{16,}[\"']" "${CORE_FILES[@]}" >/tmp/yaswarm_release_secret_hits.txt; then
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
