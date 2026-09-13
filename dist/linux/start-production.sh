#!/usr/bin/env bash
set -euo pipefail
SCRIPT_PATH="${BASH_SOURCE[0]}"
ROOT="${SCRIPT_PATH%/*}"
if [ "$ROOT" = "$SCRIPT_PATH" ]; then ROOT="."; fi
cd "$ROOT"
ROOT="$PWD"
export PORT="${PORT:-10100}"
export APP_ROOT="${APP_ROOT:-$ROOT}"
export FRONTEND_DIR="${FRONTEND_DIR:-$ROOT/frontend/dist}"
export UPLOAD_DIR="${UPLOAD_DIR:-$ROOT/uploads/imgs}"
export CORS_ORIGIN="${CORS_ORIGIN:-*}"
echo "Open http://localhost:${PORT}/SSO_Check/"
exec "$ROOT/sso-check-backend"
