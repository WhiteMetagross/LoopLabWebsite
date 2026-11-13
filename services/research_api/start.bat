@echo off
setlocal
cd /d "%~dp0"
echo Starting LoopLab Research Simulation API on http://localhost:8000...
python main.py
if errorlevel 1 (
    echo Python failed or not found. Attempting WSL conda run...
    wsl bash -lc "cd $(wslpath '%~dp0') && conda run --no-capture-output -n mambahar python main.py"
)
pause
