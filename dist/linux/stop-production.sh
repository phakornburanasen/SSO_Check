#!/usr/bin/env bash
set -euo pipefail
ROOT="${0%/*}"
if [ "$ROOT" = "$0" ]; then ROOT="."; fi
cd "$ROOT"
ROOT="$PWD"
PID_FILE="$ROOT/sso-check-backend.pid"
if [ -f "$PID_FILE" ]; then
  read -r PID < "$PID_FILE"
  kill "$PID" 2>/dev/null || true
  rm -f "$PID_FILE"
fi
