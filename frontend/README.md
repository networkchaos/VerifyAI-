# Frontend - AI-Powered Voter Registration System

Vue.js 3 frontend application with modern UI, camera integration, and real-time verification.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+) - [Download](https://nodejs.org/)

### Installation

1. **Navigate to frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

Application runs on: **http://localhost:3000**

## 📁 Project Structure

```
frontend/
├── public/
│   ├── icon.svg
│   └── placeholder.svg
├── src/
│   ├── components/
│   │   └── VoterRegistration.vue  # Main registration form
│   ├── views/
│   │   ├── Home.vue       # Landing page
│   │   ├── Register.vue   # Registration page
│   │   └── Results.vue    # Results page
│   ├── App.vue            # Root component
│   ├── main.js            # Application entry point
│   └── style.css          # Global styles
├── index.html             # HTML template
├── vite.config.js        # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── package.json           # Dependencies
```

## 🎯 How to Run

### Development Mode
```bash
npm run dev
```

Opens on: **http://localhost:3000**

### Production Build
```bash
npm run build
```

Creates optimized build in `dist/` folder.

### Preview Production Build
```bash
npm run preview
```

## ✨ Features

- **Modern UI** - Beautiful glass morphism design
- **Form Validation** - Real-time validation with error messages
- **Camera Integration** - Live camera feed for selfie capture
- **Scanning Effects** - Animated scanning overlay during verification
- **File Upload** - Drag-and-drop ID image upload
- **Auto-fill** - Automatically extracts data from ID images
- **Model Selection** - Choose OCR and face detection models
- **Notifications** - User-friendly notification system
- **Responsive** - Works on desktop, tablet, and mobile

## 🔧 Configuration

### API Proxy

Frontend proxies API requests to backend. Configured in `vite.config.js`:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',  // Backend URL
      changeOrigin: true,
    },
  },
}
```

If backend runs on different port, update this.

### Environment Variables

Create `.env` file if needed:
```env
VITE_API_URL=http://localhost:5000
```

## 📦 Dependencies

- **Vue.js 3** - Framework
- **Vite** - Build tool
- **Vue Router** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide Icons** - Icons

## 🐛 Troubleshooting

### Port Already in Use
Change port in `vite.config.js`:
```javascript
server: {
  port: 3001,  // Change to available port
}
```

### Camera Not Working
- ✅ Use HTTPS or localhost (required for camera)
- ✅ Allow camera permissions when prompted
- ✅ Check browser console (F12) for errors
- ✅ Try different browser (Chrome recommended)

### API Connection Errors
- ✅ Ensure backend is running on port 5000
- ✅ Check `vite.config.js` proxy configuration
- ✅ Test backend: `curl http://localhost:5000/api/health`

### Build Errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Styling Issues
- ✅ Ensure Tailwind is configured
- ✅ Check `postcss.config.mjs` exists
- ✅ Verify `tailwind.config.js` is correct

## 🎨 Styling

- Uses **Tailwind CSS** for utility-first styling
- Custom styles in `src/style.css`
- Color scheme defined in CSS variables
- Glass morphism effects
- Animated scanning effects

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

## 🎯 Usage

### Registration Flow

1. **Enter Personal Information**
   - Full name, National ID, Date of birth, Phone, Address

2. **Upload ID Images**
   - Front side of ID (auto-extracts data)
   - Back side of ID

3. **Select Models** (Optional)
   - OCR Model: Tesseract or Google Vision
   - Face Detection: YOLOv8, RetinaFace, MediaPipe, or Auto

4. **Capture Selfie**
   - Click "Activate Camera"
   - Allow camera permissions
   - Click "Capture Selfie"

5. **Submit Registration**
   - Click "Complete Registration"
   - Wait for processing
   - View results

## 🔍 Development

### Adding New Pages

1. Create component in `src/views/`
2. Add route in `src/main.js`:
   ```javascript
   { path: '/new-page', component: NewPage }
   ```

### Adding New Components

1. Create in `src/components/`
2. Import and use:
   ```vue
   import MyComponent from '@/components/MyComponent.vue'
   ```

## 📝 Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔐 Security

- XSS protection (Vue auto-escaping)
- CSP ready
- No eval() usage
- Input validation

## ♿ Accessibility

- Semantic HTML
- Keyboard navigation
- ARIA labels
- Focus management

## 📚 More Info

- **Backend Setup**: See [../backend/README.md](../backend/README.md)
- **Main README**: See [../README.md](../README.md)

---

**Ready to run!** Just install dependencies and start with `npm run dev` 🚀
