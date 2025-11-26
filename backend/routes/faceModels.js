// API endpoint to get available face detection models
import express from 'express'
import { getAvailableModels } from '../services/faceDetectionService.js'

const router = express.Router()

/**
 * GET /api/face-models
 * Returns list of available face detection models with their configuration status
 */
router.get('/', async (req, res) => {
  try {
    const models = await getAvailableModels()
    res.json({
      status: 'success',
      models,
    })
  } catch (error) {
    console.error('Error fetching face detection models:', error)
    console.error('Error stack:', error.stack)
    
    // Ensure response is sent even if there's an error
    if (!res.headersSent) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch face detection models',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    }
  }
})

export default router

