# Smart Vote Kenya

The intelligent voter registration system - Smart, secure, and efficient digital voter registration using Artificial Intelligence with OCR and facial recognition.

## 🚀 Quick Start

### One-Command Installation (Recommended)

After cloning this repo:

- **On Windows (PowerShell):**
  ```powershell
  .\install-all.ps1
  ```

- **On Linux / macOS (Terminal):**
  ```bash
  chmod +x install-all.sh
  ./install-all.sh
  ```

This will:
- Install **backend** Node.js packages
- Install **frontend** Node.js packages
- Install **Python** dependencies (for face detection)
- Run a quick verification of the Python models

If anything fails, see `INSTALL.md` for detailed manual steps.

### Manual Setup (Alternative)

#### Prerequisites

Before you begin, make sure you have installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **Python 3.8+** (optional, for face detection models) - [Download](https://www.python.org/downloads/)

#### Step 1: Database Setup

1. **Start PostgreSQL service** (if not running)

2. **Create the database:**
   ```bash
   # Using psql
   psql -U postgres
   CREATE DATABASE voter_registration;
   \q
   
   # Or using createdb command
   createdb voter_registration
   ```

#### Step 2: Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   # Windows PowerShell
   Copy-Item env.example .env
   
   # Linux/Mac
   cp env.example .env
   ```

4. **Edit `.env` file** with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=voter_registration
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   PORT=5000
   NODE_ENV=development
   
   # Optional: Google Vision API (for enhanced OCR)
   GOOGLE_VISION_API_KEY=your_api_key_here
   ```

5. **Install Python dependencies (Optional - for face detection):**
   ```bash
   pip install -r requirements.txt
   # Or just YOLOv8 (recommended):
   pip install ultralytics opencv-python numpy
   ```

6. **Start backend server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ✅ Database connected successfully
   ✅ Database tables initialized
   Server running on port 5000
   ```

#### Step 3: Frontend Setup

1. **Open a NEW terminal window** and navigate to frontend:
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start frontend server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ```

#### Step 4: Access the Application

Open your browser and go to: **http://localhost:5173**

## 📁 Project Structure

```
Smart Vote Kenya/
├── backend/              # Node.js/Express backend
│   ├── db/              # Database initialization
│   ├── routes/          # API routes
│   ├── services/        # Business logic (OCR, face detection)
│   ├── uploads/         # Uploaded files storage
│   ├── server.js         # Main server file
│   └── package.json      # Backend dependencies
│
├── frontend/            # Vue.js frontend
│   ├── src/
│   │   ├── components/  # Vue components
│   │   ├── views/       # Page views
│   │   └── main.js      # App entry point
│   └── package.json      # Frontend dependencies
│
└── README.md            # This file
```

## 🎯 How to Run

### Running Backend

```bash
cd backend
npm run dev
```

**Backend runs on:** http://localhost:5000

### Running Frontend

```bash
cd frontend
npm run dev
```

**Frontend runs on:** http://localhost:3000

### Running Database

PostgreSQL should be running as a service. If not:

**Windows:**
- Check Services (services.msc)
- Start "postgresql-x64-XX" service

**Linux/Mac:**
```bash
sudo systemctl start postgresql
# or
brew services start postgresql
```

## ✨ Features

### OCR Models
- **Tesseract** (Default) - Free, works offline
- **Google Vision AI** (Optional) - High accuracy, requires API key
- **Extensible** - Easy to add new OCR models

### Face Detection Models
- **YOLOv8 Face** (Default) - Ultra-fast, accurate
- **RetinaFace** - Highest accuracy
- **MediaPipe** - Lightweight, mobile-friendly
- **Google Vision** (Optional) - Cloud-based, requires API key

### Registration Flow
1. Enter personal information
2. Upload ID images (front & back)
3. Capture selfie with camera
4. System verifies identity automatically
5. Get instant results

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voter_registration
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5000
```

### Frontend Configuration

Frontend automatically connects to backend on `http://localhost:5000`.

To change backend URL, edit `frontend/vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',  // Change this
  },
}
```

## 📚 Detailed Documentation

- **Backend Setup**: See [backend/README.md](./backend/README.md)
- **Frontend Setup**: See [frontend/README.md](./frontend/README.md)
- **Face Detection**: See [backend/FACE_DETECTION_SETUP.md](./backend/FACE_DETECTION_SETUP.md)
- **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🐛 Troubleshooting

### Backend won't start
- ✅ Check PostgreSQL is running
- ✅ Verify database credentials in `.env`
- ✅ Ensure database `voter_registration` exists
- ✅ Check port 5000 is available

### Frontend won't start
- ✅ Check port 3000 is available
- ✅ Verify Node.js version (v18+)
- ✅ Try: `rm -rf node_modules && npm install`

### Database connection error
- ✅ Verify PostgreSQL service is running
- ✅ Check database exists: `psql -U postgres -l`
- ✅ Verify credentials in `backend/.env`

### Camera not working
- ✅ Use HTTPS or localhost (required for camera)
- ✅ Allow camera permissions in browser
- ✅ Check browser console for errors

### OCR/Face Detection not working
- ✅ For Python models: Install Python dependencies
- ✅ For Google Vision: Add API key to `.env`
- ✅ Check backend logs for errors

## 🧪 Testing

### Test Backend
```bash
curl http://localhost:5000/api/health
```

Should return: `{"status":"ok","message":"Server is running"}`

### Test Frontend
1. Open http://localhost:3000
2. Click "Begin Registration"
3. Fill form and test registration flow

## 📦 Dependencies

### Backend
- Express.js - Web framework
- PostgreSQL (pg) - Database client
- Tesseract.js - OCR engine
- Multer - File uploads
- Python (optional) - Face detection models

### Frontend
- Vue.js 3 - Framework
- Vite - Build tool
- Tailwind CSS - Styling
- Axios - HTTP client

## 🔐 Security Notes

- Never commit `.env` files
- Use strong database passwords
- Enable HTTPS in production
- Implement rate limiting
- Add authentication for admin endpoints

## 📝 API Endpoints

- `GET /api/health` - Health check
- `GET /api/ocr-models` - List available OCR models
- `GET /api/face-models` - List available face detection models
- `POST /api/extract-id-data` - Extract data from ID image
- `POST /api/register` - Register new voter

## 🚀 Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Build frontend: `cd frontend && npm run build`
3. Use process manager (PM2, systemd)
4. Set up reverse proxy (Nginx)
5. Configure SSL certificates
6. Set up database backups

## 📄 License

This project is for educational purposes.

## 💬 Support

For issues:
1. Check console logs (backend and frontend)
2. Verify all services are running
3. Check database connection
4. Review error messages
5. See detailed docs in each folder

---

**Ready to use!** Start with database setup, then backend, then frontend. Everything is configured and ready to run! 🎉
