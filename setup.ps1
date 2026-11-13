# LoopLab Demonstration Platform - PowerShell Setup Script
[CmdletBinding()]
param()

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "LoopLab Demonstration Platform - Setup" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Step 1: Check prerequisites
Write-Host "`n[1/4] Checking prerequisites..." -ForegroundColor Yellow
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Error "Node.js 18+ is required but not found in PATH. Install from https://nodejs.org"
    exit 1
}
Write-Host "Node.js detected: $(& node -v)" -ForegroundColor Green

$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    Write-Host "Python detected: $(& python --version)" -ForegroundColor Green
} else {
    Write-Host "Host python not detected. If running in WSL or Conda, ensure FastAPI and Uvicorn are installed." -ForegroundColor DarkYellow
}

# Step 2: Configure environment
Write-Host "`n[2/4] Setting up environment configuration..." -ForegroundColor Yellow
$envFile = Join-Path $ProjectRoot "web\.env"
$envExample = Join-Path $ProjectRoot "web\.env.example"
if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "Created web/.env from template." -ForegroundColor Green
    }
} else {
    Write-Host "web/.env configuration already exists." -ForegroundColor Green
}

# Step 3: Install Python dependencies
Write-Host "`n[3/4] Installing Python research service dependencies..." -ForegroundColor Yellow
if ($python) {
    $reqPath = Join-Path $ProjectRoot "services\research_api\requirements.txt"
    & python -m pip install -r $reqPath
}

# Step 4: Install npm dependencies
Write-Host "`n[4/4] Installing web application npm packages..." -ForegroundColor Yellow
Set-Location (Join-Path $ProjectRoot "web")
npm install
Set-Location $ProjectRoot

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "LoopLab setup completed successfully." -ForegroundColor Green
Write-Host "Run .\start.ps1 or start.bat to launch LoopLab." -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
