#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME="$ROOT/.runtime"
mkdir -p "$RUNTIME"

export PORT="${PORT:-10100}"
export APP_ROOT="${APP_ROOT:-$ROOT}"
export FRONTEND_DIR="${FRONTEND_DIR:-$ROOT/frontend/dist}"
export UPLOAD_DIR="${UPLOAD_DIR:-$ROOT/uploads/imgs}"
export CORS_ORIGIN="${CORS_ORIGIN:-*}"

if [ ! -x "$ROOT/dist/linux/sso-check-backend" ]; then
  echo "Missing dist/linux/sso-check-backend. Run ./build-linux.sh first."
  exit 1
fi

nohup "$ROOT/dist/linux/sso-check-backend" > "$RUNTIME/backend.log" 2>&1 &
echo $! > "$RUNTIME/backend.pid"
echo "Started backend PID $(cat "$RUNTIME/backend.pid")"
echo "Open http://localhost:${PORT}/SSO_Check/"
