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
