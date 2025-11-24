# Backend - AI-Powered Voter Registration System

Node.js/Express backend server with OCR and face recognition capabilities.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12+) - [Download](https://www.postgresql.org/download/)
- **Python 3.8+** (optional, for face detection) - [Download](https://www.python.org/downloads/)

### Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   # Windows
   Copy-Item env.example .env
   
   # Linux/Mac
   cp env.example .env
   ```

3. **Edit `.env` with your database credentials:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=voter_registration
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   PORT=5000
   NODE_ENV=development
   ```

4. **Create database:**
   ```bash
   createdb voter_registration
   # Or using psql:
   psql -U postgres
   CREATE DATABASE voter_registration;
   \q
   ```

5. **Install Python dependencies (Optional - for face detection):**
   ```bash
   pip install -r requirements.txt
   # Or just YOLOv8:
   pip install ultralytics opencv-python numpy
   ```

### Running

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server runs on: **http://localhost:5000**

## 📁 Project Structure

```
backend/
├── db/
│   ├── init.js          # Database initialization
│   └── schema.sql       # Database schema
├── routes/
│   ├── register.js      # Registration endpoint
│   ├── extractIdData.js # ID extraction endpoint
│   ├── ocrModels.js     # OCR models endpoint
│   └── faceModels.js    # Face models endpoint
├── services/
│   ├── registration.js  # Registration logic
│   ├── ocrRegistry.js   # OCR model registry
│   ├── faceDetectionService.js # Face detection wrapper
│   ├── faceDetection.py # Python face detection service
│   ├── googleVision.js  # Google Vision integration
│   ├── idParser.js      # ID parser
│   └── audit.js         # Audit logging
├── uploads/              # Uploaded files (auto-created)
├── server.js             # Main server file
├── package.json          # Dependencies
├── requirements.txt      # Python dependencies
└── .env                  # Environment variables (create this)
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voter_registration
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=development

# Optional: Google Vision API
GOOGLE_VISION_API_KEY=your_api_key_here
```

### Database Setup

Database tables are created automatically on first run.

To manually create:
```bash
psql -U postgres -d voter_registration -f db/schema.sql
```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Get OCR Models
```
GET /api/ocr-models
```
Returns available OCR models (Tesseract, Google Vision, etc.)

### Get Face Detection Models
```
GET /api/face-models
```
Returns available face detection models (YOLOv8, RetinaFace, etc.)

### Extract ID Data
```
POST /api/extract-id-data
Content-Type: multipart/form-data

Body:
  - idImage: (file) ID card image
  - ocrModel: (string, optional) "tesseract" or "google-vision"
```

### Register Voter
```
POST /api/register
Content-Type: multipart/form-data

Body:
  - fullName: (string)
  - nationalId: (string)
  - dateOfBirth: (string) YYYY-MM-DD
  - phoneNumber: (string)
  - address: (string)
  - idImage: (file) Front ID image
  - idBackImage: (file) Back ID image
  - selfieImage: (file) Selfie photo
  - ocrModel: (string, optional) OCR model to use
  - faceModel: (string, optional) Face detection model to use
```

## ✨ Features

### OCR Models
- **Tesseract** (Default) - Free, offline, works without API key
- **Google Vision** (Optional) - High accuracy, requires API key
- **Extensible** - Easy to add new models via `ocrRegistry.js`

### Face Detection Models
- **YOLOv8 Face** (Default) - Fast, accurate, requires Python
- **RetinaFace** - Highest accuracy, requires Python
- **MediaPipe** - Lightweight, requires Python
- **Google Vision** (Optional) - Cloud-based, requires API key

### Other Features
- Automatic database initialization
- File upload handling (10MB max)
- Duplicate detection
- Audit logging
- Error handling with fallbacks

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
# Windows: Check Services
# Linux: sudo systemctl status postgresql

# Test connection
psql -U postgres -d voter_registration -c "SELECT NOW();"
```

### Port Already in Use
Change `PORT` in `.env` file or kill process using port 5000.

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Python Face Detection Not Working
```bash
# Check Python is installed
python --version

# Install dependencies
pip install -r requirements.txt

# Test Python script
python services/faceDetection.py --action detect --model yolov8-face --image test.jpg
```

### OCR Not Working
- Tesseract downloads models on first use (be patient)
- Check images are clear and well-lit
- Verify file upload permissions

## 📦 Dependencies

### Node.js Packages
- `express` - Web framework
- `pg` - PostgreSQL client
- `tesseract.js` - OCR engine
- `multer` - File uploads
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `uuid` - UUID generation

### Python Packages (Optional)
- `ultralytics` - YOLOv8 face detection
- `retinaface` - RetinaFace detection
- `mediapipe` - MediaPipe detection
- `opencv-python` - Image processing
- `numpy` - Numerical operations

## 🔐 Security

- Never commit `.env` file
- Use strong database passwords
- Validate all inputs
- Limit file upload sizes
- Use HTTPS in production
- Implement rate limiting

## 📝 Development

### Adding New OCR Model

Edit `services/ocrRegistry.js`:
```javascript
ocrModels['my-model'] = {
  name: 'My OCR Model',
  description: 'Model description',
  requiresApiKey: false,
  extract: async (imagePath) => {
    // Your extraction logic
    return { text, idNumber, fullName, ... }
  },
}
```

### Adding New Face Detection Model

Edit `services/faceDetection.py` and add new detector class, then update `faceDetectionService.js`.

## 🚀 Production

1. Set `NODE_ENV=production`
2. Use process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start server.js --name voter-backend
   ```
3. Set up reverse proxy (Nginx)
4. Configure SSL
5. Set up database backups
6. Monitor logs

## 📚 More Info

- **Face Detection Setup**: See [FACE_DETECTION_SETUP.md](./FACE_DETECTION_SETUP.md)
- **Google Vision Setup**: See [GOOGLE_VISION_SETUP.md](./GOOGLE_VISION_SETUP.md)
- **Main README**: See [../README.md](../README.md)

---

**Ready to run!** Just install dependencies, configure `.env`, and start with `npm run dev` 🚀
