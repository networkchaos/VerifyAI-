# Frontend Explanation - VerifyAI

This document explains the frontend architecture, features, and setup of the VerifyAI system.

## 📷 Camera Functionality

### Features Implemented

#### 1. Camera Access
- Uses `getUserMedia` API for camera access
- Requests front-facing camera (`facingMode: 'user'`)
- Optimized video resolution (1280x720 ideal)
- Proper error handling for various camera errors

#### 2. User Experience
- Mirrored video preview (users see themselves naturally)
- Un-mirrored capture (correct orientation for verification)
- Loading indicator while camera initializes
- Visual frame overlay for better alignment
- Animated scanning effect during verification

#### 3. Error Handling
- **Permission Denied**: Clear message to allow camera access
- **No Camera Found**: Helpful message to connect camera
- **Camera in Use**: Notifies if camera is busy
- **Browser Support**: Checks for API availability

#### 4. Image Capture
- Canvas-based capture for high quality
- JPEG format with 95% quality
- Proper image validation
- Automatic camera cleanup after capture

#### 5. File Upload
- ID image validation (type and size)
- Base64 to Blob conversion
- Proper error handling for file operations
- Image cropping support for better quality

## 🔧 Camera Setup & Testing

### Browser Requirements
- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (iOS 11+)
- **Opera**: ✅ Full support

### HTTPS Requirement
⚠️ **Important**: Camera access requires HTTPS in production environments. Localhost works without HTTPS, but deployed sites need SSL certificates.

### Testing the Camera

1. Open `http://localhost:5173/register`
2. Click "Activate Camera" button
3. Allow camera permissions when prompted
4. Wait for camera to initialize
5. Click "Capture Selfie" to take photo
6. Verify image preview appears

## 🐛 Camera Troubleshooting

### Camera Not Starting
**Symptoms:** Clicking "Activate Camera" does nothing or shows error

**Solutions:**
- Check browser console for errors (F12 → Console)
- Ensure you're using HTTPS or localhost (camera requires secure context)
- Check browser permissions: Settings → Privacy → Camera
- Close other apps using the camera (Zoom, Teams, etc.)
- Try refreshing the page

### Permission Denied
**Symptoms:** Browser blocks camera access

**Solutions:**
- Click the camera icon in browser address bar
- Allow camera permissions
- Check browser settings for site permissions
- Try in incognito/private mode (may reset permissions)

### Camera Not Found
**Symptoms:** "No camera found" error

**Solutions:**
- Ensure camera is connected and working
- Check Device Manager (Windows) or System Settings (Mac)
- Try another browser
- Test camera in another app first

### Camera Already in Use
**Symptoms:** "Camera is already in use" error

**Solutions:**
- Close other applications using camera
- Restart browser
- Check Task Manager for camera processes

### Video Not Displaying
**Symptoms:** Camera activates but no video shows

**Solutions:**
- Check browser console for errors
- Try different browser (Chrome recommended)
- Clear browser cache
- Check if video element is visible in DOM

## 🧪 Testing & Verification Features

### Verification History Page
- **Route**: `/history`
- View all verification tests
- Filter by status (All, Approved, Failed)
- Statistics dashboard (Total, Approved, Failed, Pending)
- Detailed information for each test
- Shows validation errors and reasons for failure

### Enhanced Results Display
- Shows face similarity score with percentage
- Displays validation errors clearly
- Shows flagged reasons
- Visual indicators (Approved/Failed)
- Better navigation buttons

### Better Navigation
- **Results page buttons**:
  - "Test Another ID" - Start new verification
  - "View All Tests" - Go to history page
  - "Back to Home" - Return to home
- **Home page**: "View History" button
- **History page**: "New Verification" button

## 🎨 UI Features

### Image Cropping
- Uses `vue-cropperjs` for image cropping
- Allows cropping of uploaded ID images
- Better visual quality for OCR processing
- Aspect ratio control
- Rotatable and scalable

### OCR Model Selection
- Dynamic dropdown for OCR models
- Fetches available models from backend
- Supports Tesseract and Google Vision
- Easy to add more models

### Face Detection Model Selection
- Dynamic dropdown for face detection models
- Fetches available models from backend
- Supports multiple models (DeepFace, InsightFace, YOLOv8, MediaPipe)
- Auto-selects best available model

### Form Validation
- Real-time validation feedback
- Clear error messages
- Required field indicators
- File type and size validation

## 📱 Responsive Design

- Mobile-friendly layout
- Touch-optimized controls
- Responsive grid system
- Adaptive image sizing
- Mobile camera support

## 🔍 Testing Scenarios

### Scenario 1: Same ID, Same Name, Same Photo ✅
- Upload same ID image
- Enter same name
- Use same selfie
- **Expected**: Approved (allows testing)

### Scenario 2: Same ID, Different Name ❌
- Upload same ID image
- Enter different name
- **Expected**: Failed - "Name mismatch" or "Duplicate ID (different person)"

### Scenario 3: Wrong ID, Different Name ❌
- Upload different ID image
- Enter different name
- **Expected**: Failed - Multiple validation errors

### Scenario 4: Correct ID, Wrong Name ❌
- Upload correct ID
- Enter wrong name
- **Expected**: Failed - "Name mismatch"

### Scenario 5: Correct ID, Wrong Selfie ❌
- Upload correct ID
- Use different person's selfie
- **Expected**: Failed - "Face similarity too low"

## 🚀 Quick Fixes

1. **Refresh Page:** Often fixes temporary issues
2. **Clear Cache:** Clears stored permissions
3. **Try Different Browser:** Rules out browser-specific issues
4. **Restart Browser:** Resets camera state
5. **Check Antivirus:** Some antivirus blocks camera access

## 📝 Code Features

### Camera Initialization
```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { 
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 }
  },
})
```

### Image Capture
- Canvas-based capture
- Automatic un-mirroring
- JPEG compression
- Base64 encoding

### Error Messages
- User-friendly error messages
- Specific guidance for each error type
- Console logging for debugging

## 🎯 Usage Flow

1. **Go to Register page** (`/register`)
2. **Enter information** and upload ID images
3. **Capture selfie** using camera
4. **Click "Verify Person"**
5. **View results** on Results page
6. **Click "View All Tests"** to see history
7. **Test again** with same or different data

