# Complete Installation Guide

This guide will help you install all required packages for the Smart Vote Kenya system.

## Prerequisites

Before running the installation, make sure you have:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **Python** (v3.8 or higher) - [Download](https://www.python.org/downloads/)
3. **npm** (comes with Node.js)
4. **pip** (comes with Python 3.4+)

## Quick Installation

### Windows

1. Open PowerShell in the project root directory
2. Run:
   ```powershell
   .\install-all.ps1
   ```

### Linux/Mac

1. Open Terminal in the project root directory
2. Make the script executable:
   ```bash
   chmod +x install-all.sh
   ```
3. Run:
   ```bash
   ./install-all.sh
   ```

## Manual Installation

If the automated script doesn't work, follow these steps:

### Step 1: Install Backend Node.js Packages

```bash
cd backend
npm install
```

### Step 2: Install Frontend Node.js Packages

```bash
cd frontend
npm install
```

### Step 3: Install Python Packages

```bash
cd backend
pip install -r requirements.txt
```

Or install individually:

```bash
# Core dependencies
pip install opencv-python numpy scipy

# Face detection models
pip install ultralytics      # YOLOv8 (default)
pip install mediapipe        # MediaPipe
pip install deepface         # DeepFace
pip install insightface      # InsightFace
```

## Verify Installation

### Check Node.js Packages

```bash
# Backend
cd backend
npm list --depth=0

# Frontend
cd frontend
npm list --depth=0
```

### Check Python Packages

```bash
cd backend
python test_models.py
```

You should see:
```
✅ OpenCV: Installed (version X.X.X)
✅ NumPy: Installed (version X.X.X)
✅ YOLOv8 (Ultralytics): Installed
✅ DeepFace: Installed
✅ InsightFace: Installed
✅ MediaPipe: Installed
```

## Required Packages Summary

### Node.js Dependencies

#### Backend (`backend/package.json`)
- express - Web framework
- cors - CORS middleware
- dotenv - Environment variables
- pg - PostgreSQL client
- multer - File upload handling
- tesseract.js - OCR
- uuid - UUID generation

#### Frontend (`frontend/package.json`)
- vue - Vue.js framework
- vue-router - Routing
- axios - HTTP client
- lucide-vue-next - Icons
- vue-cropperjs - Image cropping
- tailwindcss - CSS framework
- vite - Build tool

### Python Dependencies (`backend/requirements.txt`)

#### Core
- opencv-python>=4.8.0 - Image processing
- numpy>=1.24.0 - Numerical computing
- scipy>=1.4.1 - Scientific computing

#### Face Detection Models
- ultralytics>=8.0.0 - YOLOv8 face detection (default)
- mediapipe>=0.10.0 - MediaPipe face detection
- deepface>=0.0.79 - DeepFace recognition
- insightface>=0.7.3 - InsightFace detection

## Troubleshooting

### Node.js Issues

**Error: npm not found**
- Install Node.js from https://nodejs.org/
- Make sure Node.js is in your PATH

**Error: Permission denied**
- On Linux/Mac, try: `sudo npm install`
- Or fix npm permissions: `npm config set prefix ~/.npm-global`

### Python Issues

**Error: Python not found**
- Install Python 3.8+ from https://www.python.org/downloads/
- On Windows, check "Add Python to PATH" during installation
- Verify: `python --version` or `python3 --version`

**Error: pip not found**
- Install pip: `python -m ensurepip --upgrade`
- Or download: https://bootstrap.pypa.io/get-pip.py

**Error: Package installation fails**
- Try: `pip install --upgrade pip`
- Use: `python -m pip install <package>`
- On Windows, you might need Visual C++ Build Tools for some packages

**Error: ultralytics installation fails**
- Make sure you have Python 3.8+
- Try: `pip install --upgrade pip setuptools wheel`
- Then: `pip install ultralytics`

**Error: opencv-python installation fails**
- Try: `pip install opencv-python-headless` (lighter version)
- Or: `pip install --upgrade pip` then retry

### Face Detection Issues

**Error: "Python is not available"**
- Make sure Python is installed and in PATH
- Restart your terminal/IDE after installing Python
- Verify: `python --version`

**Error: "Module not found"**
- Make sure you installed packages in the correct Python environment
- Check: `python -m pip list | grep ultralytics`
- Try: `python -m pip install <package>`

## Next Steps

After installation:

1. **Set up environment variables**
   ```bash
   cd backend
   cp env.example .env
   # Edit .env with your database credentials
   ```

2. **Run database migrations**
   ```bash
   cd backend
   node db/migrate.js
   ```

3. **Start the backend**
   ```bash
   cd backend
   npm start
   ```

4. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

## System Requirements

- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB for packages and models
- **Internet**: Required for initial package downloads

## Support

If you encounter issues:

1. Check the error messages carefully
2. Verify all prerequisites are installed
3. Check the troubleshooting section above
4. Review the backend console logs
5. Check the browser console (F12) for frontend errors

