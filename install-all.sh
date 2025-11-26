#!/bin/bash
# Install All Packages Script for Linux/Mac
# This script installs all Node.js and Python dependencies

echo "========================================"
echo "  Smart Vote Kenya - Complete Installation"
echo "========================================"
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm installed: $NPM_VERSION"
else
    echo "❌ npm not found"
    exit 1
fi

# Check Python
echo "Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python installed: $PYTHON_VERSION"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    PYTHON_VERSION=$(python --version)
    echo "✅ Python installed: $PYTHON_VERSION"
else
    echo "❌ Python not found. Please install Python 3.8+"
    exit 1
fi

# Check pip
echo "Checking pip..."
if $PYTHON_CMD -m pip --version &> /dev/null; then
    echo "✅ pip installed"
else
    echo "❌ pip not found. Installing pip..."
    $PYTHON_CMD -m ensurepip --upgrade
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install pip"
        exit 1
    fi
    echo "✅ pip installed"
fi

echo ""
echo "========================================"
echo "Installing Backend Node.js packages..."
echo "========================================"
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend packages"
    cd ..
    exit 1
fi
echo "✅ Backend Node.js packages installed"
cd ..

echo ""
echo "========================================"
echo "Installing Frontend Node.js packages..."
echo "========================================"
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend packages"
    cd ..
    exit 1
fi
echo "✅ Frontend Node.js packages installed"
cd ..

echo ""
echo "========================================"
echo "Installing Python packages..."
echo "========================================"
cd backend
echo "Installing Python dependencies from requirements.txt..."
$PYTHON_CMD -m pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Python packages"
    echo "Trying to install packages individually..."
    
    # Install core packages
    $PYTHON_CMD -m pip install opencv-python numpy scipy
    $PYTHON_CMD -m pip install ultralytics
    $PYTHON_CMD -m pip install mediapipe
    $PYTHON_CMD -m pip install deepface
    $PYTHON_CMD -m pip install insightface
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Python packages individually"
        cd ..
        exit 1
    fi
fi
echo "✅ Python packages installed"
cd ..

echo ""
echo "========================================"
echo "Verifying installation..."
echo "========================================"

# Verify Python packages
echo "Verifying Python packages..."
cd backend
$PYTHON_CMD test_models.py
if [ $? -ne 0 ]; then
    echo "⚠️ Some Python packages may not be installed correctly"
else
    echo "✅ All Python packages verified"
fi
cd ..

echo ""
echo "========================================"
echo "✅ Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Set up your .env file in the backend directory"
echo "2. Run database migrations: cd backend && node db/migrate.js"
echo "3. Start backend: cd backend && npm start"
echo "4. Start frontend: cd frontend && npm run dev"
echo ""

