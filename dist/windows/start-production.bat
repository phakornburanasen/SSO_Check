@echo off
setlocal
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "PORT=10100"
set "APP_ROOT=%ROOT%"
set "FRONTEND_DIR=%ROOT%\frontend\dist"
set "UPLOAD_DIR=%ROOT%\uploads\imgs"
set "CORS_ORIGIN=*"
echo Open http://localhost:10100/SSO_Check/
cd /d "%ROOT%"
"%ROOT%\sso-check-backend.exe"
endlocal
