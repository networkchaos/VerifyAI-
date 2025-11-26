import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { detectFaces } from '../services/faceDetectionService.js'
import { detectFacesWithGoogleVision } from '../services/googleVision.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'detect-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  },
})

/**
 * POST /api/detect-face
 * Detect faces in an uploaded image
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Image is required',
      })
    }

    // Get model from body (multer makes form fields available in req.body)
    const model = req.body?.model || req.body?.faceModel
    const imagePath = req.file.path
    const detectionModel = model || 'yolov8-face'
    
    console.log('Face detection request:', {
      model: detectionModel,
      filename: req.file.filename,
      size: req.file.size,
    })

    let result

    // Try Google Vision first if model is google-vision
    if (detectionModel === 'google-vision') {
      try {
        const googleResult = await detectFacesWithGoogleVision(imagePath)
        result = {
          face_count: googleResult.faceCount,
          faces: googleResult.faces.map(face => ({
            bounding_box: {
              x1: face.boundingPoly?.vertices?.[0]?.x || 0,
              y1: face.boundingPoly?.vertices?.[0]?.y || 0,
              x2: face.boundingPoly?.vertices?.[2]?.x || 0,
              y2: face.boundingPoly?.vertices?.[2]?.y || 0,
            },
            confidence: face.detectionConfidence || 0.9,
            model: 'google-vision',
          })),
          model: 'google-vision',
        }
      } catch (error) {
        console.warn('Google Vision face detection failed, falling back to local:', error.message)
        // Fallback to local detection
        result = await detectFaces(imagePath, detectionModel)
      }
    } else {
      // Use local face detection
      result = await detectFaces(imagePath, detectionModel)
    }

    // Log result for debugging
    console.log('Face detection result:', {
      face_count: result.face_count,
      model: result.model || detectionModel,
      has_error: !!result.error,
      error: result.error,
    })
    
    // If there's an error, provide helpful message
    let message = ''
    if (result.error) {
      message = `Face detection failed: ${result.error}`
      // Provide installation hints for common errors
      if (result.error.includes('not installed') || result.error.includes('ImportError')) {
        if (result.error.includes('opencv') || result.error.includes('OpenCV')) {
          message += '. Please install: pip install opencv-python numpy'
        } else if (result.error.includes('ultralytics') || result.error.includes('YOLO')) {
          message += '. Please install: pip install ultralytics'
        } else if (result.error.includes('deepface')) {
          message += '. Please install: pip install deepface'
        } else if (result.error.includes('insightface')) {
          message += '. Please install: pip install insightface'
        } else if (result.error.includes('mediapipe')) {
          message += '. Please install: pip install mediapipe'
        }
      }
    } else if (result.face_count > 0) {
      message = `Face detected successfully (${result.face_count} face${result.face_count > 1 ? 's' : ''})`
    } else {
      message = 'No face detected in image. Please ensure your face is clearly visible.'
    }
    
    res.json({
      status: result.error ? 'error' : 'success',
      hasFace: result.face_count > 0,
      faceCount: result.face_count,
      faces: result.faces || [],
      model: result.model || detectionModel,
      message: message,
      error: result.error || undefined,
    })
  } catch (error) {
    console.error('Face detection API error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to detect faces. Please ensure Python and required packages are installed.',
      hasFace: false,
      faceCount: 0,
    })
  }
})

export default router

