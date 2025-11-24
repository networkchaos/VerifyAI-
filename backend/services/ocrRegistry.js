// OCR Model Registry - Extensible system for multiple OCR providers

import { extractTextWithGoogleVision } from './googleVision.js'
import { createWorker } from 'tesseract.js'
import { parseKenyanID } from './idParser.js'

/**
 * OCR Model Registry
 * Add new OCR models here by implementing the OCRModel interface
 */
const ocrModels = {
  'tesseract': {
    name: 'Tesseract OCR',
    description: 'Free, open-source OCR engine. Works offline.',
    requiresApiKey: false,
    extract: async (imagePath) => {
      const worker = await createWorker('eng')
      const { data: { text } } = await worker.recognize(imagePath)
      await worker.terminate()
      
      const parsed = parseKenyanID(text)
      
      return {
        text,
        idNumber: parsed.idNumber,
        name: parsed.fullName,
        dob: parsed.dateOfBirth,
        fullName: parsed.fullName,
        dateOfBirth: parsed.dateOfBirth,
        sex: parsed.sex,
        districtOfBirth: parsed.districtOfBirth,
        placeOfIssue: parsed.placeOfIssue,
        dateOfIssue: parsed.dateOfIssue,
        method: 'tesseract',
      }
    },
  },
  
  'google-vision': {
    name: 'Google Vision AI',
    description: 'High-accuracy cloud-based OCR. Requires API key.',
    requiresApiKey: true,
    extract: async (imagePath) => {
      return await extractTextWithGoogleVision(imagePath)
    },
    isConfigured: () => {
      return !!process.env.GOOGLE_VISION_API_KEY
    },
  },
}

/**
 * Get available OCR models
 * @returns {Array} List of available model configurations
 */
export const getAvailableModels = () => {
  return Object.entries(ocrModels).map(([key, model]) => ({
    id: key,
    name: model.name,
    description: model.description,
    requiresApiKey: model.requiresApiKey,
    isConfigured: model.isConfigured ? model.isConfigured() : true,
  }))
}

/**
 * Get OCR model by ID
 * @param {string} modelId - Model identifier
 * @returns {Object|null} Model configuration or null if not found
 */
export const getModel = (modelId) => {
  return ocrModels[modelId] || null
}

/**
 * Check if model is available and configured
 * @param {string} modelId - Model identifier
 * @returns {boolean} True if model is available and configured
 */
export const isModelAvailable = (modelId) => {
  const model = ocrModels[modelId]
  if (!model) return false
  
  if (model.requiresApiKey && model.isConfigured) {
    return model.isConfigured()
  }
  
  return true
}

/**
 * Extract text using specified OCR model with fallback
 * @param {string} imagePath - Path to image file
 * @param {string} modelId - OCR model identifier
 * @param {boolean} allowFallback - Whether to fallback to tesseract on error
 * @returns {Promise<Object>} Extracted text and parsed data
 */
export const extractText = async (imagePath, modelId = 'tesseract', allowFallback = true) => {
  const model = ocrModels[modelId]
  
  if (!model) {
    console.warn(`OCR model "${modelId}" not found, falling back to tesseract`)
    return await extractText(imagePath, 'tesseract', false)
  }
  
  // Check if model requires API key and is configured
  if (model.requiresApiKey && model.isConfigured && !model.isConfigured()) {
    console.warn(`OCR model "${modelId}" requires API key but is not configured, falling back to tesseract`)
    if (allowFallback) {
      return await extractText(imagePath, 'tesseract', false)
    }
    throw new Error(`OCR model "${modelId}" requires API key. Please configure it in .env file.`)
  }
  
  try {
    return await model.extract(imagePath)
  } catch (error) {
    console.error(`OCR Error with model "${modelId}":`, error)
    
    // Fallback to tesseract if allowed
    if (allowFallback && modelId !== 'tesseract') {
      console.log(`Falling back to Tesseract OCR...`)
      return await extractText(imagePath, 'tesseract', false)
    }
    
    // Return empty result if no fallback
    return {
      text: '',
      idNumber: null,
      name: null,
      dob: null,
      fullName: null,
      dateOfBirth: null,
      method: modelId,
      error: error.message,
    }
  }
}

/**
 * Register a new OCR model
 * @param {string} modelId - Unique model identifier
 * @param {Object} modelConfig - Model configuration
 */
export const registerModel = (modelId, modelConfig) => {
  if (ocrModels[modelId]) {
    console.warn(`OCR model "${modelId}" already exists. Overwriting...`)
  }
  
  ocrModels[modelId] = {
    name: modelConfig.name,
    description: modelConfig.description || '',
    requiresApiKey: modelConfig.requiresApiKey || false,
    extract: modelConfig.extract,
    isConfigured: modelConfig.isConfigured || (() => true),
  }
  
  console.log(`OCR model "${modelId}" registered successfully`)
}

export default {
  getAvailableModels,
  getModel,
  isModelAvailable,
  extractText,
  registerModel,
}

