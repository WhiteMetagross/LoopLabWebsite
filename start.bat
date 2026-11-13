@echo off
setlocal
cd /d "%~dp0"

echo =========================================================
echo LoopLab Demonstration Platform - Startup
echo =========================================================

echo [1/3] Starting Python research simulation service...
start "LoopLab Research Service (Port 8000)" cmd /k "cd /d ""%~dp0services\research_api"" && call start.bat"

echo [2/3] Starting Next.js web application on port 3000...
start "LoopLab Web Application (Port 3000)" cmd /k "cd /d ""%~dp0web"" && npm run dev"

echo [3/3] Opening browser at http://localhost:3000 in 4 seconds...
timeout /t 4 /nobreak >nul
start http://localhost:3000

echo.
echo LoopLab services started.
echo - Web UI:       http://localhost:3000
echo - Research API: http://localhost:8000
echo Close the respective terminal windows to shut down services.
echo =========================================================

