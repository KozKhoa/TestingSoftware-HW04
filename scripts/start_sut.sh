#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HW_DIR="$(dirname "$SCRIPT_DIR")"
SUT_DIR="$HW_DIR/eshop-sut"
PID_DIR="$HW_DIR/.playwright-tmp"
mkdir -p "$PID_DIR"

if [ ! -d "$SUT_DIR" ]; then
  echo "❌ Missing eshop-sut directory at $SUT_DIR"
  exit 1
fi

echo "🚀 Starting EShop SUT services..."

# Start Backend (port 3000)
(cd "$SUT_DIR/backend" && node server.js > "$PID_DIR/backend.log" 2>&1) &
echo $! > "$PID_DIR/backend.pid"

# Start Frontend Web (port 5173)
(cd "$SUT_DIR/frontend-web" && npx vite --port 5173 --strictPort > "$PID_DIR/frontend-web.log" 2>&1) &
echo $! > "$PID_DIR/frontend-web.pid"

# Start Frontend Admin (port 5174)
(cd "$SUT_DIR/frontend-admin" && npx vite --port 5174 --strictPort > "$PID_DIR/frontend-admin.log" 2>&1) &
echo $! > "$PID_DIR/frontend-admin.pid"

echo "⏳ Waiting for ports 3000, 5173, 5174..."
for i in $(seq 1 30); do
  if curl -s http://localhost:3000/api/products >/dev/null 2>&1 \
     && curl -s http://localhost:5173 >/dev/null 2>&1 \
     && curl -s http://localhost:5174 >/dev/null 2>&1; then
    echo "✅ EShop SUT ready: Backend(:3000), Web(:5173), Admin(:5174)"
    exit 0
  fi
  sleep 1
done

echo "❌ Timeout waiting for EShop SUT. Check logs in $PID_DIR"
exit 1
