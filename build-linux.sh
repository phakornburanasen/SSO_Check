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

ENV_SOURCE=""
for candidate in "$ROOT/.env" "$ROOT/backend/.env" "${DOCUMENT_ENV_FILE:-}" "C:/Dev/DOCUMENT/backend/.env"; do
  if [ -n "$candidate" ] && [ -f "$candidate" ]; then
    ENV_SOURCE="$candidate"
    break
  fi
done
if [ -n "$ENV_SOURCE" ]; then
  cp "$ENV_SOURCE" "$OUT/.env"
  echo "Copied environment file to $OUT/.env"
else
  cat > "$OUT/.env.example" <<'ENV'
PORT=10100
DB_SERVER=10.0.32.165
DB_NAME=SSO_Agent_tnlx
DB_USER=sa
DB_PASS=
DB_ENCRYPT=disable
DB_TRUST_SERVER_CERTIFICATE=true
VPN_LOGIN_DSN=sqlserver://user:password@server:1433?database=vpn_documents&encrypt=disable&TrustServerCertificate=true
AD_LDAP_URL=ldaps://ad.example.local
AD_LDAP_DOMAIN=thanulux.local
AD_LDAP_BIND_PATTERN=
AD_LDAP_START_TLS=false
AD_LDAP_INSECURE_TLS=true
AD_LDAP_TIMEOUT_SEC=5
JWT_SECRET=change-me-please-use-a-long-random-secret
JWT_TTL_MINUTES=480
ENV
  echo "No .env found. Created $OUT/.env.example; copy it to .env and fill AD/VPN settings before login."
fi

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
