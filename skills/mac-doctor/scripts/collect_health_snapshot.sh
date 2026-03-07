#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-/tmp/mac-doctor-snapshots}"
TS="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$OUT_DIR/health-$TS.txt"

mkdir -p "$OUT_DIR"

{
  echo "=== MAC-DOCTOR HEALTH SNAPSHOT ==="
  echo "timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo

  echo "--- SYSTEM ---"
  sw_vers || true
  echo "arch: $(uname -m)"
  echo "kernel: $(uname -r)"
  echo

  echo "--- UPTIME/LOAD ---"
  uptime || true
  echo

  echo "--- CPU + POWER ---"
  pmset -g batt || true
  pmset -g therm 2>/dev/null || true
  echo

  echo "--- MEMORY ---"
  vm_stat || true
  memory_pressure || true
  echo

  echo "--- DISK ---"
  df -h / || true
  diskutil info / 2>/dev/null || true
  echo

  echo "--- TOP PROCESSES (CPU) ---"
  ps -Ao pid,ppid,%cpu,%mem,rss,comm 2>/dev/null | sort -k3 -nr | head -n 15 || echo "ps unavailable"
  echo

  echo "--- TOP PROCESSES (MEM) ---"
  ps -Ao pid,ppid,%cpu,%mem,rss,comm 2>/dev/null | sort -k4 -nr | head -n 15 || echo "ps unavailable"
  echo

  echo "--- LOGIN ITEMS / LAUNCH AGENTS ---"
  ls -1 "$HOME/Library/LaunchAgents" 2>/dev/null || true
  ls -1 /Library/LaunchAgents 2>/dev/null || true
  echo

  echo "--- STORAGE HOTSPOTS (HOME TOP LEVEL) ---"
  du -sh "$HOME"/* 2>/dev/null | sort -h | tail -n 25 || true
  echo

  echo "--- CODEX APP / ARCH CHECK ---"
  if [ -d /Applications/Codex.app ]; then
    file /Applications/Codex.app/Contents/MacOS/Codex 2>/dev/null || true
    defaults read /Applications/Codex.app/Contents/Info.plist CFBundleShortVersionString 2>/dev/null || true
  else
    echo "Codex.app not found in /Applications"
  fi
  echo

  echo "=== END SNAPSHOT ==="
} > "$OUT_FILE"

echo "$OUT_FILE"
