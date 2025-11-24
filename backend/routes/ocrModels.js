// API endpoint to get available OCR models
import express from 'express'
import { getAvailableModels } from '../services/ocrRegistry.js'

const router = express.Router()

/**
 * GET /api/ocr-models
 * Returns list of available OCR models with their configuration status
 */
router.get('/', (req, res) => {
  try {
    const models = getAvailableModels()
    res.json({
      status: 'success',
      models,
    })
  } catch (error) {
    console.error('Error fetching OCR models:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch OCR models',
    })
  }
})

export default router

