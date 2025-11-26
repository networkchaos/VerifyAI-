// OCR Model Registry - Extensible system for multiple OCR providers

import { extractTextWithGoogleVision } from './googleVision.js'
import { createWorker } from 'tesseract.js'
import { parseKenyanID } from './idParser.js'
import { preprocessImage, preprocessImageMultiple } from './imagePreprocessor.js'
import fs from 'fs/promises'

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
      // Preprocess image first (rotation correction, contrast enhancement)
      let processedImagePath = imagePath
      try {
        processedImagePath = await preprocessImage(imagePath)
        console.log('✅ Image preprocessed for better OCR accuracy')
      } catch (error) {
        console.warn('⚠️ Image preprocessing failed, using original:', error.message)
      }
      
      // Create worker with initial parameters (some can only be set during initialization)
      const worker = await createWorker('eng', 1, {
        logger: m => {
          // Suppress verbose logging
          if (m.status === 'recognizing text') {
            // Only log progress if needed
          }
        }
      })
      
      // Configure Tesseract for better accuracy on ID cards
      // Note: tessedit_ocr_engine_mode must be set during createWorker, not setParameters
      await worker.setParameters({
        tessedit_pageseg_mode: '6', // Assume uniform block of text
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<:.,/- ', // Allow only relevant characters
        preserve_interword_spaces: '1', // Preserve spaces between words
        tessedit_create_hocr: '0', // Don't create hOCR
        tessedit_create_tsv: '0', // Don't create TSV
      })
      
      // Recognize with better settings
      const { data: { text } } = await worker.recognize(processedImagePath, {
        rectangle: undefined, // Process full image
      })
      
      await worker.terminate()
      
      // Clean up preprocessed image if it was created
      if (processedImagePath !== imagePath) {
        try {
          await fs.unlink(processedImagePath).catch(() => {}) // Ignore errors
        } catch {}
      }
      
      // Log raw OCR text for debugging
      console.log('📄 Raw OCR text (first 500 chars):', text.substring(0, 500))
      
      const parsed = parseKenyanID(text)
      
      // Log parsed results
      console.log('📋 Parsed ID data:', {
        idNumber: parsed.idNumber,
        fullName: parsed.fullName,
        dateOfBirth: parsed.dateOfBirth,
      })
      
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
 * Extract text multiple times with different preprocessing and vote on best result
 * @param {string} imagePath - Path to image file
 * @param {string} modelId - OCR model identifier
 * @param {number} runs - Number of extraction runs (default: 3)
 * @returns {Promise<Object>} Best extracted text and parsed data based on voting
 */
export const extractTextMultiple = async (imagePath, modelId = 'tesseract', runs = 3) => {
  try {
    console.log(`🔄 Running ${runs} OCR extractions with different preprocessing...`)
    
    // Get preprocessing variations
    const variations = await preprocessImageMultiple(imagePath)
    
    // Run OCR on each variation
    const results = []
    for (let i = 0; i < Math.min(runs, variations.length); i++) {
      try {
        const variation = variations[i]
        console.log(`   Run ${i + 1}/${runs}: Using ${variation.type} preprocessing...`)
        const result = await extractText(variation.path, modelId, false)
        results.push({
          ...result,
          run: i + 1,
          preprocessing: variation.type,
        })
      } catch (error) {
        console.warn(`   Run ${i + 1} failed:`, error.message)
      }
    }
    
    // Clean up preprocessed images
    for (const variation of variations) {
      if (variation.path !== imagePath) {
        try {
          await fs.unlink(variation.path).catch(() => {})
        } catch {}
      }
    }
    
    if (results.length === 0) {
      console.warn('⚠️ All OCR runs failed, falling back to single extraction')
      return await extractText(imagePath, modelId, true)
    }
    
    // Vote on best result
    const bestResult = voteOnBestResult(results)
    console.log(`✅ Best result from run ${bestResult.run} (${bestResult.preprocessing}):`, {
      fullName: bestResult.fullName,
      idNumber: bestResult.idNumber,
      dateOfBirth: bestResult.dateOfBirth,
    })
    
    return {
      ...bestResult,
      method: `${modelId}-multiple`,
      runs: results.length,
      allResults: results.map(r => ({
        run: r.run,
        preprocessing: r.preprocessing,
        fullName: r.fullName,
        idNumber: r.idNumber,
        dateOfBirth: r.dateOfBirth,
        text: r.text, // Include raw text from each run for validation
      })),
    }
  } catch (error) {
    console.error('Multiple extraction error:', error)
    // Fallback to single extraction
    return await extractText(imagePath, modelId, true)
  }
}

/**
 * Vote on best result from multiple OCR runs
 * Uses consensus voting: prefer values that appear in multiple runs
 */
const voteOnBestResult = (results) => {
  if (results.length === 1) return results[0]
  
  // Count occurrences of each value
  const nameVotes = {}
  const idVotes = {}
  const dobVotes = {}
  
  for (const result of results) {
    // Vote for full name
    const name = result.fullName || result.name
    if (name) {
      const normalized = name.toLowerCase().trim()
      nameVotes[normalized] = (nameVotes[normalized] || 0) + 1
    }
    
    // Vote for ID number
    const id = result.idNumber
    if (id) {
      const normalized = String(id).replace(/\s+/g, '').trim()
      idVotes[normalized] = (idVotes[normalized] || 0) + 1
    }
    
    // Vote for date of birth
    const dob = result.dateOfBirth || result.dob
    if (dob) {
      const normalized = String(dob).trim()
      dobVotes[normalized] = (dobVotes[normalized] || 0) + 1
    }
  }
  
  // Find most common values
  const bestName = Object.entries(nameVotes)
    .sort((a, b) => b[1] - a[1])[0]?.[0]
  const bestId = Object.entries(idVotes)
    .sort((a, b) => b[1] - a[1])[0]?.[0]
  const bestDob = Object.entries(dobVotes)
    .sort((a, b) => b[1] - a[1])[0]?.[0]
  
  // Find the result that matches most of the voted values
  let bestResult = results[0]
  let bestScore = 0
  
  for (const result of results) {
    let score = 0
    const name = (result.fullName || result.name || '').toLowerCase().trim()
    const id = String(result.idNumber || '').replace(/\s+/g, '').trim()
    const dob = String(result.dateOfBirth || result.dob || '').trim()
    
    if (bestName && name === bestName) score += nameVotes[bestName]
    if (bestId && id === bestId) score += idVotes[bestId]
    if (bestDob && dob === bestDob) score += dobVotes[bestDob]
    
    if (score > bestScore) {
      bestScore = score
      bestResult = result
    }
  }
  
  // Override with voted values if they exist
  if (bestName) {
    // Find original casing from results
    const nameResult = results.find(r => 
      (r.fullName || r.name || '').toLowerCase().trim() === bestName
    )
    bestResult.fullName = nameResult?.fullName || nameResult?.name || bestResult.fullName
  }
  
  if (bestId) {
    const idResult = results.find(r => 
      String(r.idNumber || '').replace(/\s+/g, '').trim() === bestId
    )
    bestResult.idNumber = idResult?.idNumber || bestResult.idNumber
  }
  
  if (bestDob) {
    const dobResult = results.find(r => 
      String(r.dateOfBirth || r.dob || '').trim() === bestDob
    )
    bestResult.dateOfBirth = dobResult?.dateOfBirth || dobResult?.dob || bestResult.dateOfBirth
  }
  
  return bestResult
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
  extractTextMultiple,
  registerModel,
}

