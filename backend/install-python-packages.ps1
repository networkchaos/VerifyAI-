# Quick Python Packages Installation Script
# Run this from the backend directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installing Python Packages" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
$pythonCmd = $null
try {
    $pythonVersion = python --version 2>&1
    $pythonCmd = "python"
    Write-Host "✅ Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    try {
        $pythonVersion = python3 --version 2>&1
        $pythonCmd = "python3"
        Write-Host "✅ Found Python: $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Python not found!" -ForegroundColor Red
        Write-Host "Please install Python 3.8+ from https://www.python.org/downloads/" -ForegroundColor Yellow
        Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Installing packages..." -ForegroundColor Yellow
Write-Host ""

# Install core packages
Write-Host "1. Installing core packages (opencv-python, numpy, scipy)..." -ForegroundColor Cyan
& $pythonCmd -m pip install opencv-python numpy scipy
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Some core packages failed to install" -ForegroundColor Yellow
}

# Install ultralytics (for YOLOv8)
Write-Host ""
Write-Host "2. Installing ultralytics (for YOLOv8 face detection)..." -ForegroundColor Cyan
& $pythonCmd -m pip install ultralytics
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ ultralytics failed to install" -ForegroundColor Yellow
}

# Install other face detection models (optional)
Write-Host ""
Write-Host "3. Installing optional face detection models..." -ForegroundColor Cyan
Write-Host "   (These are optional but recommended)" -ForegroundColor Gray

& $pythonCmd -m pip install mediapipe
& $pythonCmd -m pip install deepface
& $pythonCmd -m pip install insightface

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verifying installation..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verify installation
& $pythonCmd test_models.py

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "If you see any ❌ errors above, those packages need to be installed manually." -ForegroundColor Yellow
Write-Host "Restart your backend server to see the changes." -ForegroundColor Cyan
Write-Host ""

