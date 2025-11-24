import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { processRegistration } from '../services/registration.js'
import { createAuditLog } from '../services/audit.js'

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
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
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

router.post('/', upload.fields([{ name: 'idImage' }, { name: 'idBackImage' }, { name: 'selfieImage' }]), async (req, res) => {
  try {
    const { fullName, nationalId, dateOfBirth, phoneNumber, address, ocrModel, faceModel } = req.body

    if (!req.files || !req.files.idImage || !req.files.idBackImage || !req.files.selfieImage) {
      return res.status(400).json({
        status: 'error',
        message: 'Both front and back ID images, and selfie are required',
      })
    }

    const idImagePath = req.files.idImage[0].path
    const idBackImagePath = req.files.idBackImage[0].path
    const selfieImagePath = req.files.selfieImage[0].path

    const result = await processRegistration({
      form: {
        fullName,
        nationalId,
        dateOfBirth,
        phoneNumber,
        address,
      },
      idImagePath,
      idBackImagePath,
      selfieImagePath,
      ocrModel: ocrModel || 'tesseract', // Default to tesseract if not specified
      faceModel: faceModel || null, // Face detection model (optional)
    })

    // Create audit log
    await createAuditLog({
      voterId: result.voterId,
      action: 'registration_submitted',
      actor: 'system',
      details: {
        status: result.status,
        flaggedReason: result.flaggedReason,
      },
    })

    res.json({
      status: result.status,
      voterId: result.voterId,
      message: result.message,
      similarity: result.similarity,
      validationErrors: result.validationErrors,
      flaggedReason: result.flaggedReason,
      data: {
        fullName,
        nationalId,
        dateOfBirth,
        phoneNumber,
        address,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || 'Registration failed. Please try again.',
    })
  }
})

export default router
