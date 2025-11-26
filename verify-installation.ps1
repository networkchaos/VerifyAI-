# Verify Installation Script
# Checks if all required packages are installed

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Smart Vote Kenya - Installation Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    $allGood = $false
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    $allGood = $false
}

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
$pythonCmd = $null
try {
    $pythonVersion = python --version 2>&1
    $pythonCmd = "python"
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    try {
        $pythonVersion = python3 --version 2>&1
        $pythonCmd = "python3"
        Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Python not found" -ForegroundColor Red
        $allGood = $false
    }
}

# Check Backend Node.js packages
Write-Host ""
Write-Host "Checking Backend Node.js packages..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
    Write-Host "✅ Backend node_modules exists" -ForegroundColor Green
} else {
    Write-Host "❌ Backend node_modules missing" -ForegroundColor Red
    Write-Host "   Run: cd backend && npm install" -ForegroundColor Yellow
    $allGood = $false
}

# Check Frontend Node.js packages
Write-Host "Checking Frontend Node.js packages..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "✅ Frontend node_modules exists" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend node_modules missing" -ForegroundColor Red
    Write-Host "   Run: cd frontend && npm install" -ForegroundColor Yellow
    $allGood = $false
}

# Check Python packages
if ($pythonCmd) {
    Write-Host ""
    Write-Host "Checking Python packages..." -ForegroundColor Yellow
    
    $packages = @("opencv-python", "numpy", "ultralytics", "deepface", "mediapipe", "insightface")
    foreach ($pkg in $packages) {
        $result = & $pythonCmd -m pip show $pkg 2>&1
        if ($LASTEXITCODE -eq 0) {
            $version = ($result | Select-String -Pattern "Version:").ToString().Split(":")[1].Trim()
            Write-Host "✅ $pkg : $version" -ForegroundColor Green
        } else {
            Write-Host "❌ $pkg : Not installed" -ForegroundColor Red
            $allGood = $false
        }
    }
}

Write-Host ""
if ($allGood) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ All packages are installed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ Some packages are missing" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run the installation script:" -ForegroundColor Yellow
    Write-Host "  .\install-all.ps1" -ForegroundColor Cyan
}

