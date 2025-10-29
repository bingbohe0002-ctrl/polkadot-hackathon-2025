<#
  DISM Error Fix Script (Method 1: Use Windows Update)
  Fix Error Code: 0x800f081f - Source files not found
  
  Usage:
    Run PowerShell as Administrator, then execute:
    .\修复DISM错误.ps1
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DISM Error Fix Tool (Method 1)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script requires administrator privileges!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "[OK] Administrator privileges detected" -ForegroundColor Green
Write-Host ""

# Step 1: Check and enable Windows Update services
Write-Host "[Step 1] Checking Windows Update services..." -ForegroundColor Yellow

$services = @("wuauserv", "cryptSvc", "bits", "msiserver")
foreach ($serviceName in $services) {
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($service) {
        if ($service.Status -ne "Running") {
            Write-Host "  Starting service: $serviceName" -ForegroundColor Gray
            Start-Service -Name $serviceName -ErrorAction SilentlyContinue
        } else {
            Write-Host "  [OK] $serviceName is running" -ForegroundColor Green
        }
    }
}
Write-Host ""

# Step 2: Run DISM repair using Windows Update
Write-Host "[Step 2] Running DISM repair (fetching source files from Windows Update)..." -ForegroundColor Yellow
Write-Host "  This may take several minutes, please wait..." -ForegroundColor Gray
Write-Host ""

$dismResult = DISM /Online /Cleanup-Image /RestoreHealth 2>&1

# Display output
$dismResult | ForEach-Object {
    $line = $_.ToString()
    if ($line -match "Error|错误|0x|failed|失败") {
        Write-Host $line -ForegroundColor Red
    } elseif ($line -match "100\.0%|completed|完成|success|成功") {
        Write-Host $line -ForegroundColor Green
    } else {
        Write-Host $line
    }
}

Write-Host ""

# Check result
if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] DISM repair completed successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Step 3: Run SFC for additional verification
    Write-Host "[Step 3] Running System File Checker (SFC)..." -ForegroundColor Yellow
    Write-Host "  This may take 10-20 minutes, please wait..." -ForegroundColor Gray
    Write-Host ""
    
    $sfcResult = sfc /scannow 2>&1
    $sfcResult | ForEach-Object {
        $line = $_.ToString()
        if ($line -match "Error|错误") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "verification|验证|integrity|完整性|found no integrity|未发现") {
            Write-Host $line -ForegroundColor Green
        } else {
            Write-Host $line
        }
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "        Repair Completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "[WARNING] DISM repair encountered issues. Trying alternative method..." -ForegroundColor Yellow
    Write-Host ""
    
    # Alternative: Reset Windows Update components
    Write-Host "[Alternative] Resetting Windows Update components..." -ForegroundColor Yellow
    
    Write-Host "  Stopping related services..." -ForegroundColor Gray
    foreach ($serviceName in $services) {
        Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "  Renaming cache folders..." -ForegroundColor Gray
    if (Test-Path "C:\Windows\SoftwareDistribution") {
        Rename-Item "C:\Windows\SoftwareDistribution" "SoftwareDistribution.old" -ErrorAction SilentlyContinue -Force
    }
    if (Test-Path "C:\Windows\System32\catroot2") {
        Rename-Item "C:\Windows\System32\catroot2" "catroot2.old" -ErrorAction SilentlyContinue -Force
    }
    
    Write-Host "  Restarting services..." -ForegroundColor Gray
    foreach ($serviceName in $services) {
        Start-Service -Name $serviceName -ErrorAction SilentlyContinue
    }
    
    Write-Host ""
    Write-Host "  Waiting for services to be ready..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Host "  Retrying DISM repair..." -ForegroundColor Yellow
    Write-Host ""
    
    $dismResult2 = DISM /Online /Cleanup-Image /RestoreHealth 2>&1
    
    $dismResult2 | ForEach-Object {
        $line = $_.ToString()
        if ($line -match "Error|错误|0x|failed|失败") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "100\.0%|completed|完成|success|成功") {
            Write-Host $line -ForegroundColor Green
        } else {
            Write-Host $line
        }
    }
    
    Write-Host ""
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] DISM repair completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "[FAILED] DISM repair still failed." -ForegroundColor Red
        Write-Host ""
        Write-Host "Suggestions:" -ForegroundColor Yellow
        Write-Host "  1. Ensure network connection is working" -ForegroundColor White
        Write-Host "  2. Check if Windows Update service is working properly" -ForegroundColor White
        Write-Host "  3. Try Method 2: Use Windows installation media as source" -ForegroundColor White
        Write-Host "  4. Check detailed logs: C:\Windows\Logs\DISM\dism.log" -ForegroundColor White
        Write-Host ""
    }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
