@echo off
setlocal
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "OUT=%ROOT%\dist\linux"

echo Building frontend...
cd /d "%ROOT%\frontend" || exit /b 1
if not exist node_modules call npm install || exit /b 1
call npm run build || exit /b 1

echo Building Linux backend executable...
cd /d "%ROOT%\backend" || exit /b 1
if not exist "%OUT%" mkdir "%OUT%"
set "GOOS=linux"
set "GOARCH=amd64"
set "CGO_ENABLED=0"
go build -ldflags "-s -w" -o "%OUT%\sso-check-backend" . || exit /b 1

echo Copying frontend dist...
if exist "%OUT%\frontend\dist" rmdir /s /q "%OUT%\frontend\dist"
mkdir "%OUT%\frontend" >nul 2>nul
robocopy "%ROOT%\frontend\dist" "%OUT%\frontend\dist" /MIR >nul
if errorlevel 8 exit /b 1

if not exist "%OUT%\uploads\imgs" mkdir "%OUT%\uploads\imgs"

set "ENV_SOURCE="
if exist "%ROOT%\.env" set "ENV_SOURCE=%ROOT%\.env"
if not defined ENV_SOURCE if exist "%ROOT%\backend\.env" set "ENV_SOURCE=%ROOT%\backend\.env"
if not defined ENV_SOURCE if defined DOCUMENT_ENV_FILE if exist "%DOCUMENT_ENV_FILE%" set "ENV_SOURCE=%DOCUMENT_ENV_FILE%"
if not defined ENV_SOURCE if exist "C:\Dev\DOCUMENT\backend\.env" set "ENV_SOURCE=C:\Dev\DOCUMENT\backend\.env"
if defined ENV_SOURCE (
  copy /Y "%ENV_SOURCE%" "%OUT%\.env" >nul
  echo Copied environment file to %OUT%\.env
) else (
  (
    echo PORT=10100
    echo DB_SERVER=10.0.32.165
    echo DB_NAME=SSO_Agent_tnlx
    echo DB_USER=sa
    echo DB_PASS=
    echo DB_ENCRYPT=disable
    echo DB_TRUST_SERVER_CERTIFICATE=true
    echo VPN_LOGIN_DSN=sqlserver://user:password@server:1433?database=vpn_documents^&encrypt=disable^&TrustServerCertificate=true
    echo AD_LDAP_URL=ldaps://ad.example.local
    echo AD_LDAP_DOMAIN=thanulux.local
    echo AD_LDAP_BIND_PATTERN=
    echo AD_LDAP_START_TLS=false
    echo AD_LDAP_INSECURE_TLS=true
    echo AD_LDAP_TIMEOUT_SEC=5
    echo JWT_SECRET=change-me-please-use-a-long-random-secret
    echo JWT_TTL_MINUTES=480
  ) > "%OUT%\.env.example"
  echo No .env found. Created %OUT%\.env.example; copy it to .env and fill AD/VPN settings before login.
)

(
  echo #!/usr/bin/env bash
  echo set -euo pipefail
  echo SCRIPT_PATH="${BASH_SOURCE[0]}"
  echo ROOT="${SCRIPT_PATH%%/*}"
  echo if [ "$ROOT" = "$SCRIPT_PATH" ]; then ROOT="."; fi
  echo cd "$ROOT"
  echo ROOT="$PWD"
  echo export PORT="${PORT:-10100}"
  echo export APP_ROOT="${APP_ROOT:-$ROOT}"
  echo export FRONTEND_DIR="${FRONTEND_DIR:-$ROOT/frontend/dist}"
  echo export UPLOAD_DIR="${UPLOAD_DIR:-$ROOT/uploads/imgs}"
  echo export CORS_ORIGIN="${CORS_ORIGIN:-*}"
  echo echo "Open http://localhost:${PORT}/SSO_Check/"
  echo exec "$ROOT/sso-check-backend"
) > "%OUT%\start-production.sh"

(
  echo #!/usr/bin/env bash
  echo set -euo pipefail
  echo ROOT="${0%%/*}"
  echo if [ "$ROOT" = "$0" ]; then ROOT="."; fi
  echo cd "$ROOT"
  echo ROOT="$PWD"
  echo PID_FILE="$ROOT/sso-check-backend.pid"
  echo if [ -f "$PID_FILE" ]; then
  echo   read -r PID ^< "$PID_FILE"
  echo   kill "$PID" 2^>/dev/null ^|^| true
  echo   rm -f "$PID_FILE"
  echo fi
) > "%OUT%\stop-production.sh"

echo.
echo Linux build complete:
echo %OUT%\sso-check-backend
echo %OUT%\start-production.sh
echo.
echo On Linux, run: chmod +x sso-check-backend start-production.sh stop-production.sh
endlocal
