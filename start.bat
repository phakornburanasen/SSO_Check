@echo off
setlocal
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "RUNTIME=%ROOT%\.runtime"
if not exist "%RUNTIME%" mkdir "%RUNTIME%"

echo Starting SSO_Check backend...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d ""%ROOT%\backend"" && go run .' -WindowStyle Minimized -PassThru; Set-Content -Path '""%RUNTIME%\backend.pid""' -Value $p.Id"

echo Starting SSO_Check frontend on port 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d ""%ROOT%\frontend"" && call npm run dev' -WindowStyle Minimized -PassThru; Set-Content -Path '""%RUNTIME%\frontend.pid""' -Value $p.Id"

echo.
echo Frontend: http://localhost:3000/SSO_Check/
echo Backend : http://localhost:10100
echo.
echo Use stop.bat to stop both services.
endlocal
