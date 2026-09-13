@echo off
setlocal
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "EXE=%ROOT%\dist\windows\sso-check-backend.exe"
set "RUNTIME=%ROOT%\.runtime"

if not exist "%EXE%" (
  echo Missing %EXE%
  echo Run build.bat first.
  exit /b 1
)

if not exist "%RUNTIME%" mkdir "%RUNTIME%"
set "PORT=10100"
set "APP_ROOT=%ROOT%"
set "FRONTEND_DIR=%ROOT%\frontend\dist"
set "UPLOAD_DIR=%ROOT%\uploads\imgs"
set "CORS_ORIGIN=*"

echo Starting production exe...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Start-Process -FilePath '%EXE%' -WorkingDirectory '%ROOT%' -WindowStyle Minimized -PassThru; Set-Content -Path '%RUNTIME%\production.pid' -Value $p.Id"
echo Open http://localhost:10100/SSO_Check/
endlocal
