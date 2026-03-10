#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

missing=()
required=(git gh docker python3 node npm jq)

for cmd in "${required[@]}"; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    missing+=("$cmd")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing dependencies: ${missing[*]}"
  echo "Install them first, then re-run 'yaswarm install'."
  echo "Linux hint: apt install -y git gh docker.io docker-compose-v2 python3 nodejs npm jq"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "'docker compose' plugin not available. Install Docker Compose v2 plugin."
  exit 1
fi

if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi

chmod +x "$ROOT/cli/yaswarm" "$ROOT"/scripts/*.sh

echo "Install check complete: dependencies and GitHub auth are ready."
echo "Next: yaswarm setup"
