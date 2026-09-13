@echo off
setlocal
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "RUNTIME=%ROOT%\.runtime"

for %%F in ("%RUNTIME%\frontend.pid" "%RUNTIME%\backend.pid" "%RUNTIME%\production.pid") do (
  if exist "%%~F" (
    for /f "usebackq delims=" %%P in ("%%~F") do (
      echo Stopping PID %%P...
      taskkill /PID %%P /T /F >nul 2>nul
    )
    del "%%~F" >nul 2>nul
  )
)

echo Done.
endlocal
