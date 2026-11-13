#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HW_DIR="$(dirname "$SCRIPT_DIR")"
PID_DIR="$HW_DIR/.playwright-tmp"

for svc in backend frontend-web frontend-admin; do
  PID_FILE="$PID_DIR/${svc}.pid"
  if [ -f "$PID_FILE" ]; then
    PID="$(cat "$PID_FILE")"
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" 2>/dev/null || true
      echo "🛑 Stopped $svc (PID $PID)"
    fi
    rm -f "$PID_FILE"
  fi
done

# Fallback cleanup for any remaining vite/node processes from eshop-sut
pkill -f "eshop-sut/backend/server.js" 2>/dev/null || true
pkill -f "vite --port 5173" 2>/dev/null || true
pkill -f "vite --port 5174" 2>/dev/null || true
echo "✅ EShop SUT stopped."
