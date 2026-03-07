#!/usr/bin/env bash
set -euo pipefail

TARGET_HOME="${1:-$HOME}"

echo "=== SAFE CLEANUP CANDIDATES (NO DELETE) ==="
echo "home: $TARGET_HOME"
echo

echo "--- CACHES (TOP 25) ---"
du -sh "$TARGET_HOME/Library/Caches"/* 2>/dev/null | sort -h | tail -n 25 || true
echo

echo "--- LOGS (TOP 25) ---"
du -sh "$TARGET_HOME/Library/Logs"/* 2>/dev/null | sort -h | tail -n 25 || true
echo

echo "--- DOWNLOADS: FILES > 500MB ---"
find "$TARGET_HOME/Downloads" -type f -size +500M -print 2>/dev/null || true
echo

echo "--- TEMP-LIKE FILES IN DOWNLOADS (older than 14 days) ---"
find "$TARGET_HOME/Downloads" -type f \( -name '*.dmg' -o -name '*.zip' -o -name '*.pkg' \) -mtime +14 -print 2>/dev/null || true
echo

echo "No files were modified. Review before deleting anything."
