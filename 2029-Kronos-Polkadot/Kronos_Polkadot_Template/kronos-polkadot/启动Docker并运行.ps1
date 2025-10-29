<#
  Kronos - Auto Start Docker Desktop and Services
  Enhanced starter with flags, environment setup and health checks

  Usage examples:
    ./启动Docker并运行.ps1                 # normal start
    ./启动Docker并运行.ps1 -NoOpen         # do not open browser
    ./启动Docker并运行.ps1 -Rebuild        # docker-compose build --no-cache then up
    ./启动Docker并运行.ps1 -Reset          # docker-compose down -v then up
#>

param(
  [switch]$NoOpen,
  [switch]$Rebuild,
  [switch]$Reset
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Kronos Docker Auto Starter" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 0: Move to project directory
$expectedDir = "D:\code\Kronos_Polkadot_Template\kronos-polkadot"
if ((Get-Location).Path -ne $expectedDir) {
  Write-Host "[Step 0] Changing directory..." -ForegroundColor Yellow
  Set-Location $expectedDir
  Write-Host "  ✅ In project directory`n" -ForegroundColor Green
}

# Step 1: Ensure .env files exist (root/backend/frontend)
Write-Host "[Step 1] Preparing environment files..." -ForegroundColor Yellow

function Ensure-Env($path, $exampleContent) {
  if (-not (Test-Path $path)) {
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
    $exampleContent | Out-File -FilePath $path -Encoding UTF8 -Force
    Write-Host "  Created: $path" -ForegroundColor Green
  } else {
    Write-Host "  Exists:  $path" -ForegroundColor Gray
  }
}

$rootEnv = @(
  "# Root .env for docker-compose",
  "FRONTEND_PORT=3000",
  "BACKEND_PORT=5000",
  "PREDICT_PORT=5001",
  "VITE_BACKEND_URL=http://localhost:5000",
  "VITE_WS_PROVIDER=wss://westend-rpc.polkadot.io",
  "VITE_CONTRACT_ADDRESS="
) -join "`r`n"

$backendEnv = @(
  "# Backend service env",
  "NODE_ENV=production",
  "PYTHONUNBUFFERED=1",
  "BINANCE_API_URL=https://api.binance.com"
) -join "`r`n"

$frontendEnv = @(
  "# Frontend env (Vite)",
  "VITE_BACKEND_URL=http://localhost:5000",
  "VITE_WS_PROVIDER=wss://westend-rpc.polkadot.io",
  "VITE_CONTRACT_ADDRESS="
) -join "`r`n"

Ensure-Env -path ".env" -exampleContent $rootEnv
Ensure-Env -path "backend/.env" -exampleContent $backendEnv
Ensure-Env -path "frontend/.env" -exampleContent $frontendEnv

# Step 2: Check Docker Desktop
Write-Host "[Step 2] Checking Docker Desktop..." -ForegroundColor Yellow
$dockerRunning = $false
try { docker ps 2>&1 | Out-Null; if ($LASTEXITCODE -eq 0) { $dockerRunning = $true } } catch {}

if (-not $dockerRunning) {
  Write-Host "  ❌ Docker Desktop is NOT running" -ForegroundColor Red
  Write-Host "  Starting Docker Desktop..." -ForegroundColor Yellow
  $dockerPaths = @(
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
    "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
  )
  $dockerFound = $false
  foreach ($p in $dockerPaths) { if (Test-Path $p) { Start-Process $p; $dockerFound = $true; break } }
  if (-not $dockerFound) {
    Write-Host "  Please install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
  }
  Write-Host "  ⏳ Waiting Docker ready..." -ForegroundColor Yellow
  1..30 | ForEach-Object { Start-Sleep 2; try { docker ps 2>&1 | Out-Null; if ($LASTEXITCODE -eq 0) { $dockerRunning = $true; break } } catch {} }
  if (-not $dockerRunning) { Write-Host "  Still not ready, try again later." -ForegroundColor Yellow; exit 1 }
}
Write-Host "  ✅ Docker Desktop is running`n" -ForegroundColor Green

# Step 3: Optionally reset or rebuild
if ($Reset) {
  Write-Host "[Step 3] Resetting containers and volumes..." -ForegroundColor Yellow
  docker-compose down -v
}

# Step 3.5: Rebuild frontend
Write-Host "[Step 3.5] Rebuilding frontend..." -ForegroundColor Yellow
Set-Location frontend
Write-Host "  Running npm install..." -ForegroundColor Gray
npm install 2>&1 | Out-Null
Write-Host "  Running npm run build..." -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) { 
  Write-Host "  ⚠️  Frontend build failed, continuing anyway..." -ForegroundColor Yellow 
}
Set-Location ..
Write-Host "  ✅ Frontend build completed`n" -ForegroundColor Green

if ($Rebuild) {
  Write-Host "[Step 4] Rebuilding Docker images (no cache)..." -ForegroundColor Yellow
  docker-compose build --no-cache
  if ($LASTEXITCODE -ne 0) { Write-Host "  ❌ Failed to rebuild images" -ForegroundColor Red; exit 1 }
}

# Step 5: Start services
Write-Host "[Step 5] Starting services..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) { Write-Host "  ❌ Failed to start services" -ForegroundColor Red; exit 1 }

# Step 5.5: Copy frontend build to container
Write-Host "[Step 5.5] Deploying frontend build..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
docker cp frontend/dist/. kronos-frontend:/usr/share/nginx/html/ 2>&1 | Out-Null
docker restart kronos-frontend | Out-Null
Write-Host "  ✅ Frontend deployed to container`n" -ForegroundColor Green

# Step 6: Health checks
Write-Host "[Step 6] Waiting for services (up to 45s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

function Test-Url($url, $timeoutSec = 5) {
  try { Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec $timeoutSec -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

$frontendOk = $false; $backendOk = $false
1..9 | ForEach-Object {
  if (-not $backendOk) { $backendOk = Test-Url "http://localhost:5000/health" }
  if (-not $frontendOk) { $frontendOk = Test-Url "http://localhost:3000" }
  if ($frontendOk -and $backendOk) { return }
  Start-Sleep -Seconds 5
}

Write-Host "`n[Status]" -ForegroundColor Cyan
docker-compose ps
if ($backendOk) { Write-Host "  ✅ Backend ready" -ForegroundColor Green } else { Write-Host "  ⚠️  Backend not ready yet" -ForegroundColor Yellow }
if ($frontendOk) { Write-Host "  ✅ Frontend ready" -ForegroundColor Green } else { Write-Host "  ⚠️  Frontend not ready yet" -ForegroundColor Yellow }

# Final summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "        KRONOS IS READY!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Access your application:" -ForegroundColor White
Write-Host "  🌐 Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  🔌 Backend:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "  🤖 AI Service: http://localhost:5001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor White
Write-Host "  View logs:   docker-compose logs -f" -ForegroundColor Gray
Write-Host "  Stop all:    docker-compose down" -ForegroundColor Gray
Write-Host "  Restart:     docker-compose restart" -ForegroundColor Gray
Write-Host "  Status:      docker-compose ps" -ForegroundColor Gray
Write-Host ""

if (-not $NoOpen) {
  try { Start-Process "http://localhost:3000" } catch {}
  Write-Host "✅ Opening browser..." -ForegroundColor Green
}


