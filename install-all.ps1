# Install All Packages Script for Windows
# This script installs all Node.js and Python dependencies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Smart Vote Kenya - Complete Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
$pythonCmd = $null
try {
    $pythonVersion = python --version 2>&1
    $pythonCmd = "python"
    Write-Host "✅ Python installed: $pythonVersion" -ForegroundColor Green
} catch {
    try {
        $pythonVersion = python3 --version 2>&1
        $pythonCmd = "python3"
        Write-Host "✅ Python installed: $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Python not found. Please install Python 3.8+ from https://www.python.org/downloads/" -ForegroundColor Red
        Write-Host "   Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
        exit 1
    }
}

# Check pip
Write-Host "Checking pip..." -ForegroundColor Yellow
try {
    $pipVersion = & $pythonCmd -m pip --version 2>&1
    Write-Host "✅ pip installed" -ForegroundColor Green
} catch {
    Write-Host "❌ pip not found. Installing pip..." -ForegroundColor Yellow
    try {
        & $pythonCmd -m ensurepip --upgrade
        Write-Host "✅ pip installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install pip" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Backend Node.js packages..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend packages" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✅ Backend Node.js packages installed" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Frontend Node.js packages..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend packages" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✅ Frontend Node.js packages installed" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Python packages..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Set-Location backend
Write-Host "Installing Python dependencies from requirements.txt..." -ForegroundColor Yellow
& $pythonCmd -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Python packages" -ForegroundColor Red
    Write-Host "Trying to install packages individually..." -ForegroundColor Yellow
    
    # Install core packages
    & $pythonCmd -m pip install opencv-python numpy scipy
    & $pythonCmd -m pip install ultralytics
    & $pythonCmd -m pip install mediapipe
    & $pythonCmd -m pip install deepface
    & $pythonCmd -m pip install insightface
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Python packages individually" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}
Write-Host "✅ Python packages installed" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verifying installation..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Verify Python packages
Write-Host "Verifying Python packages..." -ForegroundColor Yellow
Set-Location backend
& $pythonCmd test_models.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Some Python packages may not be installed correctly" -ForegroundColor Yellow
} else {
    Write-Host "✅ All Python packages verified" -ForegroundColor Green
}
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up your .env file in the backend directory" -ForegroundColor White
Write-Host "2. Run database migrations: cd backend && node db/migrate.js" -ForegroundColor White
Write-Host "3. Start backend: cd backend && npm start" -ForegroundColor White
Write-Host "4. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""

