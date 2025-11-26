import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { extractIDText } from '../services/registration.js'
import { validateIdImage } from '../services/idImageValidator.js'

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
    cb(null, 'extract-' + uniqueSuffix + path.extname(file.originalname))
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

router.post('/', upload.single('idImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'ID image is required',
      })
    }

    const { ocrModel } = req.body
    const imagePath = req.file.path
    
    // Validate that the image is actually an ID card (not a selfie)
    console.log('🔍 Validating uploaded image...')
    const validation = await validateIdImage(imagePath)
    
    if (!validation.isIdCard && validation.confidence > 0.6) {
      console.warn('⚠️ Image validation failed - likely not an ID card')
      return res.status(400).json({
        status: 'error',
        message: 'The uploaded image does not appear to be an ID card. Please upload the front side of your national ID card, not a selfie photo.',
        validation: {
          isIdCard: false,
          reason: validation.reason,
          confidence: validation.confidence,
        },
      })
    }
    
    // If validation is uncertain (low confidence), proceed but warn
    if (!validation.isIdCard && validation.confidence <= 0.6) {
      console.warn('⚠️ Image validation uncertain, proceeding with extraction')
    }
    
    const extracted = await extractIDText(imagePath, ocrModel || 'tesseract', true)

    // Ensure we have a valid result object
    if (!extracted) {
      throw new Error('Extraction returned no results')
    }

    res.json({
      status: 'success',
      extracted: {
        fullName: extracted.fullName || extracted.name || null,
        idNumber: extracted.idNumber || null,
        dateOfBirth: extracted.dateOfBirth || extracted.dob || null,
        sex: extracted.sex || null,
        districtOfBirth: extracted.districtOfBirth || null,
        placeOfIssue: extracted.placeOfIssue || null,
        dateOfIssue: extracted.dateOfIssue || null,
      },
      validation: validation.isIdCard ? undefined : {
        warning: true,
        reason: validation.reason,
      },
    })
  } catch (error) {
    console.error('Extract ID data error:', error)
    console.error('Error stack:', error.stack)
    
    // Ensure response is sent even if there's an error
    if (!res.headersSent) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to extract ID data',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    }
  }
})

export default router
