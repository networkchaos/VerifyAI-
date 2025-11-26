// Combined Extraction Service - Uses both Docparser and OCR for better accuracy
// Implements voting/consensus mechanism to choose best results

import { extractText, extractTextMultiple } from './ocrRegistry.js'
import { parseIDWithDocparser } from './docparser.js'

/**
 * Calculate similarity between two strings
 */
const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  if (s1 === s2) return 1
  
  // Simple Levenshtein-based similarity
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  if (longer.length === 0) return 1
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Levenshtein distance calculation
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = []
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[str2.length][str1.length]
}

/**
 * Validate extracted data quality
 */
const validateData = (data) => {
  const score = {
    fullName: 0,
    idNumber: 0,
    dateOfBirth: 0,
  }
  
  // Validate name
  if (data.fullName) {
    const words = data.fullName.split(/\s+/)
    if (words.length >= 2) {
      const validWords = words.filter(w => w.length >= 3)
      score.fullName = validWords.length >= 2 ? 1 : 0.5
    }
  }
  
  // Validate ID number
  if (data.idNumber) {
    const id = String(data.idNumber).replace(/\s+/g, '')
    if (id.length >= 8 && id.length <= 9 && /^\d+$/.test(id)) {
      score.idNumber = 1
    }
  }
  
  // Validate date of birth
  if (data.dateOfBirth) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (dateRegex.test(data.dateOfBirth)) {
      score.dateOfBirth = 1
    }
  }
  
  return score
}

/**
 * Combine results from multiple extraction methods using voting/consensus
 */
const combineResults = (ocrResult, docparserResult) => {
  const results = []
  
  // Add OCR result
  if (ocrResult) {
    results.push({
      source: 'ocr',
      data: ocrResult,
      score: validateData(ocrResult),
    })
  }
  
  // Add Docparser result
  if (docparserResult) {
    results.push({
      source: 'docparser',
      data: docparserResult,
      score: validateData(docparserResult),
    })
  }
  
  // If only one result, return it
  if (results.length === 1) {
    return {
      ...results[0].data,
      method: `combined-${results[0].source}`,
      sources: [results[0].source],
    }
  }
  
  // Combine using voting/consensus
  const combined = {
    fullName: null,
    idNumber: null,
    dateOfBirth: null,
    sex: null,
    districtOfBirth: null,
    placeOfIssue: null,
    dateOfIssue: null,
    sources: ['ocr', 'docparser'],
    method: 'combined',
  }
  
  // For each field, choose the best value
  // Priority: 1) Both agree (high confidence), 2) Higher quality score, 3) Non-null value
  
  // Full Name
  const name1 = ocrResult?.fullName || ocrResult?.name
  const name2 = docparserResult?.fullName
  if (name1 && name2) {
    const similarity = calculateSimilarity(name1, name2)
    if (similarity > 0.8) {
      // Both agree - use the one with better quality
      const ocrScore = validateData(ocrResult).fullName
      const docScore = validateData(docparserResult).fullName
      combined.fullName = ocrScore > docScore ? name1 : name2
    } else {
      // Disagree - use the one with better quality score
      const ocrScore = validateData(ocrResult).fullName
      const docScore = validateData(docparserResult).fullName
      combined.fullName = ocrScore > docScore ? name1 : name2
    }
  } else {
    combined.fullName = name1 || name2
  }
  
  // ID Number
  const id1 = ocrResult?.idNumber
  const id2 = docparserResult?.idNumber
  if (id1 && id2) {
    if (String(id1).trim() === String(id2).trim()) {
      // Both agree
      combined.idNumber = id1
    } else {
      // Disagree - prefer the one that looks more valid
      const id1Valid = /^\d{8,9}$/.test(String(id1).replace(/\s+/g, ''))
      const id2Valid = /^\d{8,9}$/.test(String(id2).replace(/\s+/g, ''))
      combined.idNumber = id1Valid && !id2Valid ? id1 : (id2Valid ? id2 : id1)
    }
  } else {
    combined.idNumber = id1 || id2
  }
  
  // Date of Birth
  const dob1 = ocrResult?.dateOfBirth || ocrResult?.dob
  const dob2 = docparserResult?.dateOfBirth
  if (dob1 && dob2) {
    if (dob1 === dob2) {
      combined.dateOfBirth = dob1
    } else {
      // Prefer the one that matches date format
      const dob1Valid = /^\d{4}-\d{2}-\d{2}$/.test(dob1)
      const dob2Valid = /^\d{4}-\d{2}-\d{2}$/.test(dob2)
      combined.dateOfBirth = dob1Valid && !dob2Valid ? dob1 : (dob2Valid ? dob2 : dob1)
    }
  } else {
    combined.dateOfBirth = dob1 || dob2
  }
  
  // Other fields - use first non-null value
  combined.sex = ocrResult?.sex || docparserResult?.sex
  combined.districtOfBirth = ocrResult?.districtOfBirth || docparserResult?.districtOfBirth
  combined.placeOfIssue = ocrResult?.placeOfIssue || docparserResult?.placeOfIssue
  combined.dateOfIssue = ocrResult?.dateOfIssue || docparserResult?.dateOfIssue
  
  // Combine raw text
  const rawTexts = []
  if (ocrResult?.text) rawTexts.push(`OCR: ${ocrResult.text.substring(0, 500)}`)
  if (docparserResult?.rawText) rawTexts.push(`Docparser: ${docparserResult.rawText.substring(0, 500)}`)
  combined.rawText = rawTexts.join('\n\n---\n\n')
  
  return combined
}

/**
 * Extract ID data using both OCR (multiple runs) and Docparser
 * @param {string} imagePath - Path to ID image
 * @param {string} ocrModel - OCR model to use (tesseract, google-vision)
 * @returns {Promise<Object>} Combined extraction results
 */
export const extractIDWithCombined = async (imagePath, ocrModel = 'tesseract') => {
  try {
    console.log('🔄 Starting combined extraction (Multiple OCR runs + Docparser)...')
    
    // Run multiple OCR extractions (3 times with different preprocessing) and Docparser in parallel
    const [ocrResult, docparserResult] = await Promise.allSettled([
      extractTextMultiple(imagePath, ocrModel, 3), // Run 3 times with voting
      parseIDWithDocparser(imagePath),
    ])
    
    const ocrData = ocrResult.status === 'fulfilled' ? ocrResult.value : null
    const docparserData = docparserResult.status === 'fulfilled' ? docparserResult.value : null
    
    if (ocrResult.status === 'rejected') {
      console.warn('⚠️ OCR extraction failed:', ocrResult.reason)
    }
    if (docparserResult.status === 'rejected') {
      console.warn('⚠️ Docparser extraction failed:', docparserResult.reason)
    }
    
    // If both failed, throw error
    if (!ocrData && !docparserData) {
      throw new Error('Both OCR and Docparser extractions failed')
    }
    
    // Combine results
    const combined = combineResults(ocrData, docparserData)
    
    // Ensure combined is a valid object
    if (!combined) {
      throw new Error('Failed to combine extraction results')
    }
    
    // Include all results from multiple OCR runs for validation
    if (ocrData && ocrData.allResults && Array.isArray(ocrData.allResults)) {
      combined.allResults = ocrData.allResults
    }
    
    // Also include docparser as a result to check
    if (docparserData) {
      if (!combined.allResults) {
        combined.allResults = []
      }
      try {
        combined.allResults.push({
          run: 'docparser',
          preprocessing: 'docparser',
          fullName: docparserData.fullName || null,
          idNumber: docparserData.idNumber || null,
          dateOfBirth: docparserData.dateOfBirth || null,
          text: docparserData.rawText || docparserData.text || '',
        })
      } catch (pushError) {
        console.warn('Error adding docparser result:', pushError.message)
      }
    }
    
    console.log('✅ Combined extraction complete:', {
      fullName: combined.fullName,
      idNumber: combined.idNumber,
      dateOfBirth: combined.dateOfBirth,
      sources: combined.sources,
      totalRunsToCheck: combined.allResults ? combined.allResults.length + 1 : 1, // +1 for main result
    })
    
    return combined
  } catch (error) {
    console.error('Combined extraction error:', error)
    throw error
  }
}

export default {
  extractIDWithCombined,
}

