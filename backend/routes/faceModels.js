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
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch face detection models',
    })
  }
})

export default router

