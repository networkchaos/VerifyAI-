# Face Detection Setup Guide

## Quick Fix for "Face detection failed" Error

If you're seeing "Face detection failed: python script failed: ERROR", follow these steps:

### Step 1: Install Python (if not already installed)
- Download from: https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation
- Verify: `python --version` (should show Python 3.8+)

### Step 2: Install Required Packages

```bash
# Navigate to backend directory
cd backend

# Install all packages at once
pip install -r requirements.txt
```

Or install individually:
```bash
# Core dependencies
pip install opencv-python numpy

# YOLOv8 Face Detection (default model)
pip install ultralytics

# Optional: Other models
pip install deepface      # For DeepFace model
pip install insightface   # For InsightFace model
pip install mediapipe     # For MediaPipe model
```

### Step 3: Verify Installation

```bash
# Run the test script
python test_models.py
```

You should see:
```
✅ OpenCV: Installed (version X.X.X)
✅ NumPy: Installed (version X.X.X)
✅ YOLOv8 (Ultralytics): Installed
```

### Step 4: Restart Backend Server

After installing packages, restart your backend server:
```bash
cd backend
npm start
```

### Step 5: Test Face Detection

1. Open the frontend application
2. Go to registration page
3. Upload a selfie image
4. You should see "Face Detected" message

## Troubleshooting

### Error: "Python is not available"
- Make sure Python is installed and in your PATH
- Try: `python --version` or `python3 --version`
- On Windows, you may need to restart your terminal after installing Python

### Error: "Ultralytics not installed"
```bash
pip install ultralytics
```

### Error: "OpenCV not installed"
```bash
pip install opencv-python numpy
```

### Error: "Module not found"
- Make sure you're using the correct Python interpreter
- Try: `python -m pip install <package-name>`
- On Windows, you might need: `py -m pip install <package-name>`

### Still Getting Errors?

1. Check backend console logs for detailed error messages
2. Check browser console (F12) for frontend errors
3. Verify Python packages: `pip list | grep ultralytics`
4. Test Python script directly:
   ```bash
   python backend/services/faceDetection.py --action detect --model yolov8-face --image <path-to-image>
   ```

## Model Options

The system supports multiple face detection models:

1. **yolov8-face** (Default) - Fast and accurate
2. **deepface** - Best for face verification
3. **insightface** - High accuracy
4. **mediapipe** - Lightweight

You can select the model in the frontend dropdown or it will use the default (yolov8-face).

## System Status

✅ Error handling improved
✅ Better error messages with installation hints
✅ Python script always returns JSON
✅ Frontend shows detailed error messages
✅ Backend logs all errors for debugging

The system is now ready to use once Python packages are installed!

