import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { extractIDText } from '../services/registration.js'

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
    const extracted = await extractIDText(imagePath, ocrModel || 'tesseract')

    res.json({
      status: 'success',
      extracted: {
        fullName: extracted.fullName || extracted.name,
        idNumber: extracted.idNumber,
        dateOfBirth: extracted.dateOfBirth || extracted.dob,
        sex: extracted.sex,
        districtOfBirth: extracted.districtOfBirth,
        placeOfIssue: extracted.placeOfIssue,
        dateOfIssue: extracted.dateOfIssue,
      },
    })
  } catch (error) {
    console.error('Extract ID data error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to extract ID data',
    })
  }
})

export default router
