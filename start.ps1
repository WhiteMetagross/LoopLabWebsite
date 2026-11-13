# LoopLab Demonstration Platform - PowerShell Startup Script
[CmdletBinding()]
param()

$ProjectRoot = $PSScriptRoot

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "LoopLab Demonstration Platform - Startup" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Start Python Research API
Write-Host "[1/3] Starting Python research simulation service on port 8000..." -ForegroundColor Yellow
$serviceDir = Join-Path $ProjectRoot "services\research_api"
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$serviceDir`" && call start.bat"

# 2. Start Next.js Web
Write-Host "[2/3] Starting Next.js web application on port 3000..." -ForegroundColor Yellow
$webDir = Join-Path $ProjectRoot "web"
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$webDir`" && npm run dev"

# 3. Wait and open browser
Write-Host "[3/3] Opening browser at http://localhost:3000 in 4 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"

Write-Host "`nLoopLab running." -ForegroundColor Green
Write-Host "- Web interface: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Research API:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Close terminal windows to stop services." -ForegroundColor Gray

