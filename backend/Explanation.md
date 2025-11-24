# Backend Explanation - VerifyAI

This document explains the backend architecture, setup, and features of the VerifyAI system.

## 📦 Face Detection Models

### Available Models

#### 1. DeepFace (⭐ Recommended for Verification)
- **Speed**: ⚡⚡⚡
- **Accuracy**: ⭐⭐⭐⭐⭐ (Best for face verification)
- **Best for**: Accurate face verification between ID and selfie
- **Features**: Uses face embeddings for true similarity comparison
- **Models**: VGG-Face, Facenet, OpenFace, ArcFace

#### 2. InsightFace
- **Speed**: ⚡⚡⚡
- **Accuracy**: ⭐⭐⭐⭐⭐
- **Best for**: High accuracy face detection and verification
- **Note**: Modern alternative, no TensorFlow dependency

#### 3. YOLOv8 Face Detection
- **Speed**: ⚡⚡⚡⚡⚡ (Ultra-fast)
- **Accuracy**: ⭐⭐⭐⭐
- **Best for**: Production use, real-time applications
- **Models**: `yolov8n-face` (nano), `yolov8s-face` (small), `yolov8m-face` (medium)

#### 4. MediaPipe Face Detection
- **Speed**: ⚡⚡⚡⚡⚡
- **Accuracy**: ⭐⭐⭐
- **Best for**: Mobile apps, lightweight applications
- **Note**: Good for simple use cases

### Installation

#### Step 1: Install Python
Make sure you have Python 3.8 or higher installed:
```bash
python --version  # Windows
python3 --version # Linux/Mac
```

#### Step 2: Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

Or install individually:
```bash
pip install deepface opencv-python numpy
pip install ultralytics      # For YOLOv8
pip install insightface      # For InsightFace
pip install mediapipe        # For MediaPipe
```

#### Step 3: Verify Installation
```bash
python test_models.py
```

### Usage

#### Automatic Model Selection
The system automatically uses DeepFace by default. No configuration needed!

#### Manual Model Selection
- **Via Frontend**: Select face detection model from dropdown
- **Via API**: Include `faceModel` parameter in registration request

#### Available Model IDs
- `deepface` - DeepFace (⭐ Best for verification, uses embeddings)
- `insightface` - InsightFace (high accuracy, no TensorFlow)
- `yolov8-face` or `yolov8n-face` - YOLOv8 Nano (fastest)
- `yolov8s-face` - YOLOv8 Small (balanced)
- `yolov8m-face` - YOLOv8 Medium (more accurate)
- `mediapipe` - MediaPipe (lightweight)
- `auto` - Automatically selects best available model

### Model Comparison

| Model | Speed | Accuracy | Verification | Use Case |
|-------|-------|----------|--------------|----------|
| **DeepFace** | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | ✅ Best | Face verification (ID vs Selfie) |
| **InsightFace** | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | ✅ Excellent | High accuracy detection & verification |
| YOLOv8n | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | ⚠️ Basic | Production, real-time detection |
| YOLOv8s | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | ⚠️ Basic | Balanced performance |
| YOLOv8m | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | ⚠️ Basic | High accuracy detection |
| MediaPipe | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | ⚠️ Basic | Mobile, simple apps |

### Troubleshooting

#### Python Not Found
**Error**: `Python is not available`
**Solution**: Install Python 3.8+ from [python.org](https://www.python.org/downloads/) and ensure it's in your PATH

#### Package Installation Errors
**Error**: `ModuleNotFoundError: No module named 'ultralytics'`
**Solution**: 
```bash
python -m pip install -r requirements.txt
```

#### Model Download Issues
- Models are downloaded automatically on first use
- Make sure you have internet connection
- Models are cached after first download

## 🔍 Google Cloud Vision API Setup

### Overview
Google Cloud Vision API provides enhanced OCR and face detection capabilities (optional).

### Prerequisites
- Google Cloud account
- Billing enabled (Google provides free tier with $300 credit)

### Setup Steps

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable APIs**
   - Navigate to **APIs & Services** → **Library**
   - Search for and enable **Cloud Vision API**

3. **Create API Key**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy the generated API key
   - (Recommended) Restrict the API key to Cloud Vision API only

4. **Configure Backend**
   - Open `backend/.env` file
   - Add your API key:
     ```env
     GOOGLE_VISION_API_KEY=your_actual_api_key_here
     ```

### Features Enabled
- **OCR**: Higher accuracy text extraction
- **Face Detection**: Detects faces with bounding boxes and confidence scores

### API Pricing
- **Text Detection**: First 1,000 units/month free, then $1.50 per 1,000 units
- **Face Detection**: First 1,000 units/month free, then $1.50 per 1,000 units

### Fallback Behavior
If Google Vision API fails, the system automatically falls back to Tesseract.js OCR.

## 🧪 Testing & Verification Features

### Verification History
- **Route**: `/api/verifications`
- View all verification tests with status (Approved/Failed)
- Filter by status
- Statistics dashboard

### Allow Same ID Testing
- Removed UNIQUE constraint on ID number
- Smart duplicate detection: Only flags if different person uses same ID
- Name-based matching: Uses fuzzy name matching to determine if same person
- Allows testing with same ID and photo multiple times

### Enhanced Validation
- **Name validation**: Checks if entered name matches ID name (fuzzy matching ≥70%)
- **ID number validation**: Verifies extracted ID matches entered ID
- **Date of birth validation**: Ensures DOB matches
- **Face similarity**: Verifies selfie matches ID photo (≥60% similarity)
- **Clear error messages**: Shows specific reasons for failure

### Validation Details

#### Name Matching
- Uses **fuzzy matching** (Levenshtein distance)
- **70% similarity threshold**
- Handles name variations and typos
- Case-insensitive comparison

#### Face Similarity
- Uses **DeepFace** (default) for accurate verification
- **60% similarity threshold**
- Compares face embeddings (not just detection)
- True face recognition

#### ID Details Validation
- **ID Number**: Must match exactly
- **Name**: Must match ≥70% similarity
- **Date of Birth**: Must match exactly

### Database Changes
- **Removed UNIQUE constraint** on `id_number` (allows testing)
- **Added columns**:
  - `face_similarity` - Stores similarity score
  - `validation_errors` - JSONB array of errors

## 🔧 How Face Detection Works

1. **Node.js Backend** receives registration request
2. **Python Service** (`faceDetection.py`) is called via subprocess
3. **Face Detection Model** processes images
4. **Results** are returned as JSON to Node.js
5. **Face Comparison** is performed using detected faces or embeddings

## 📝 Notes

- **First Run**: Models are downloaded automatically (may take a few minutes)
- **Caching**: Models are cached after first download
- **Offline**: Once downloaded, models work offline
- **Performance**: DeepFace is recommended for best verification accuracy
- **Fallback**: System falls back to Google Vision or mock similarity if Python models unavailable

## 🆘 Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify `.env` file has correct credentials
- Ensure database `voter_registration` exists

### Python Module Not Found
- Run `pip install -r requirements.txt` in backend folder
- Verify Python 3.8+ is installed

### Port Already in Use
- Change PORT in `.env` file
- Or stop the process using the port

