#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$ROOT/catalog/auto-sync.pid"
LOG_FILE="$ROOT/catalog/auto-sync.log"
INTERVAL_DEFAULT="${YASWARM_SYNC_INTERVAL_SEC:-180}"

is_running() {
  [[ -f "$PID_FILE" ]] || return 1
  local pid
  pid="$(cat "$PID_FILE")"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

run_once() {
  "$ROOT/scripts/repo-catalog.sh" sync-all
  python3 "$ROOT/scripts/dashboard-bridge.py" >/dev/null
}

daemon_loop() {
  local interval="$1"
  while true; do
    {
      echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] auto-sync tick"
      run_once
    } >> "$LOG_FILE" 2>&1 || true
    sleep "$interval"
  done
}

start_daemon() {
  local interval="${1:-$INTERVAL_DEFAULT}"
  if is_running; then
    echo "auto-sync already running (pid $(cat "$PID_FILE"))"
    return 0
  fi
  nohup bash -c "$(declare -f run_once); $(declare -f daemon_loop); ROOT='$ROOT'; LOG_FILE='$LOG_FILE'; daemon_loop '$interval'" >/dev/null 2>&1 &
  echo $! > "$PID_FILE"
  echo "auto-sync started (pid $!, interval ${interval}s)"
}

stop_daemon() {
  if ! is_running; then
    echo "auto-sync not running"
    rm -f "$PID_FILE"
    return 0
  fi
  local pid
  pid="$(cat "$PID_FILE")"
  kill "$pid" 2>/dev/null || true
  rm -f "$PID_FILE"
  echo "auto-sync stopped"
}

status_daemon() {
  if is_running; then
    echo "auto-sync: running (pid $(cat "$PID_FILE"))"
  else
    echo "auto-sync: stopped"
  fi
  [[ -f "$LOG_FILE" ]] && echo "log: $LOG_FILE"
}

usage() {
  cat << HELP
auto-sync commands:
  start [interval_sec]
  stop
  status
  run-once
  run-forever [interval_sec]
HELP
}

sub="${1:-}"
case "$sub" in
  start) shift; start_daemon "${1:-$INTERVAL_DEFAULT}" ;;
  stop) stop_daemon ;;
  status) status_daemon ;;
  run-once) run_once ; echo "auto-sync run-once complete" ;;
  run-forever) shift; daemon_loop "${1:-$INTERVAL_DEFAULT}" ;;
  *) usage; exit 1 ;;
esac
