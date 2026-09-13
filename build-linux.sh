#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$ROOT/dist/linux"

echo "Building frontend..."
cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  npm install
fi
npm run build

echo "Building Linux backend binary..."
cd "$ROOT/backend"
mkdir -p "$OUT"
GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o "$OUT/sso-check-backend" .

echo "Copying frontend dist..."
rm -rf "$OUT/frontend/dist"
mkdir -p "$OUT/frontend"
cp -R "$ROOT/frontend/dist" "$OUT/frontend/dist"
mkdir -p "$OUT/uploads/imgs"

cat > "$OUT/start-production.sh" <<'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PORT="${PORT:-10100}"
export APP_ROOT="${APP_ROOT:-$ROOT}"
export FRONTEND_DIR="${FRONTEND_DIR:-$ROOT/frontend/dist}"
export UPLOAD_DIR="${UPLOAD_DIR:-$ROOT/uploads/imgs}"
export CORS_ORIGIN="${CORS_ORIGIN:-*}"
echo "Open http://localhost:${PORT}/SSO_Check/"
exec "$ROOT/sso-check-backend"
SCRIPT
chmod +x "$OUT/start-production.sh" "$OUT/sso-check-backend"

echo "Build complete: $OUT"
