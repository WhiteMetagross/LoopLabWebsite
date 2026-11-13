@echo off
setlocal
cd /d "%~dp0"

echo =========================================================
echo LoopLab Demonstration Platform - Setup
echo =========================================================

echo [1/4] Checking prerequisites...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is required but was not found in PATH.
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Python was not found in PATH.
    echo If using WSL or Conda, ensure your environment has FastAPI and Uvicorn.
) else (
    echo Node.js and Python detected.
)

echo.
echo [2/4] Setting up environment configuration...
if not exist "web\.env" (
    if exist "web\.env.example" (
        copy "web\.env.example" "web\.env" >nul
        echo Created web\.env from template.
    )
) else (
    echo web\.env configuration exists.
)

echo.
echo [3/4] Installing Python research service dependencies...
where python >nul 2>&1
if not errorlevel 1 (
    python -m pip install -r services\research_api\requirements.txt
) else (
    echo Skipping host pip install. Python research service will run through WSL if configured.
)

echo.
echo [4/4] Installing web application npm packages...
cd /d "%~dp0web"
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install npm packages.
    pause
    exit /b 1
)

cd /d "%~dp0"
echo.
echo =========================================================
echo LoopLab setup completed successfully.
echo You can now run start.bat or ./start.ps1 to launch LoopLab.
echo =========================================================
pause
