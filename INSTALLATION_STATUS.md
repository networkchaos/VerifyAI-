# Installation Status & Instructions

## ✅ Completed

### Node.js Packages
- ✅ **Backend packages installed** - All npm packages in `backend/` are installed
- ✅ **Frontend packages installed** - All npm packages in `frontend/` are installed

## ⚠️ Action Required

### Python Packages
Python packages need to be installed manually. Follow these steps:

#### Step 1: Verify Python Installation

Open PowerShell and run:
```powershell
python --version
```

If Python is not found, install it from: https://www.python.org/downloads/
- Make sure to check **"Add Python to PATH"** during installation
- Restart your terminal after installation

#### Step 2: Install Python Packages

Navigate to the backend directory and run:

```powershell
cd backend

# Install core packages
python -m pip install opencv-python numpy scipy

# Install face detection models
python -m pip install ultralytics      # YOLOv8 (default model)
python -m pip install mediapipe       # MediaPipe
python -m pip install deepface        # DeepFace
python -m pip install insightface    # InsightFace
```

Or install all at once:
```powershell
python -m pip install -r requirements.txt
```

#### Step 3: Verify Installation

Run the test script:
```powershell
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

## Quick Installation Scripts

I've created automated installation scripts for you:

### Windows (PowerShell)
```powershell
.\install-all.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x install-all.sh
./install-all.sh
```

## Verification Script

To check what's installed:
```powershell
.\verify-installation.ps1
```

## Troubleshooting

### Python Not Found
- Install Python 3.8+ from https://www.python.org/downloads/
- Make sure "Add Python to PATH" is checked
- Restart terminal after installation
- Try `python3` instead of `python` on some systems

### pip Not Found
```powershell
python -m ensurepip --upgrade
```

### Package Installation Fails
```powershell
# Upgrade pip first
python -m pip install --upgrade pip

# Then try installing again
python -m pip install <package-name>
```

### Permission Errors
On Linux/Mac, you might need:
```bash
sudo pip install <package-name>
```

Or use a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

## Current Status

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Node.js | ✅ Installed | None |
| npm | ✅ Installed | None |
| Backend npm packages | ✅ Installed | None |
| Frontend npm packages | ✅ Installed | None |
| Python | ⚠️ Check | Verify with `python --version` |
| Python packages | ⚠️ Install | Run installation commands above |

## Next Steps After Installation

1. **Set up environment variables**
   ```powershell
   cd backend
   copy env.example .env
   # Edit .env with your database credentials
   ```

2. **Run database migrations**
   ```powershell
   cd backend
   node db/migrate.js
   ```

3. **Start the backend**
   ```powershell
   cd backend
   npm start
   ```

4. **Start the frontend** (in a new terminal)
   ```powershell
   cd frontend
   npm run dev
   ```

## Summary

✅ **Node.js packages**: All installed  
⚠️ **Python packages**: Need to be installed manually

Once Python packages are installed, the system will be fully ready to use!

