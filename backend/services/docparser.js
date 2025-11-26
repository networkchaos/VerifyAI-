// Docparser Service - Structured document parsing for Kenyan ID cards
// Uses zonal OCR and pattern matching for better accuracy

import fs from 'fs/promises'
import { createWorker } from 'tesseract.js'
import { parseKenyanID } from './idParser.js'
import { preprocessImage } from './imagePreprocessor.js'

/**
 * Docparser-style structured parsing for Kenyan ID cards
 * Uses zonal OCR to extract data from specific regions
 */
export const parseIDWithDocparser = async (imagePath) => {
  try {
    // Preprocess image first (rotation correction, contrast enhancement)
    let processedImagePath = imagePath
    try {
      processedImagePath = await preprocessImage(imagePath)
    } catch (error) {
      console.warn('⚠️ Image preprocessing failed in docparser, using original:', error.message)
    }
    
    // Create Tesseract worker for zonal OCR with LSTM engine
    const worker = await createWorker('eng', 1, {
      logger: m => {
        // Suppress verbose logging
      }
    })
    
    // Configure for better accuracy
    // Note: tessedit_ocr_engine_mode must be set during createWorker, not setParameters
    await worker.setParameters({
      tessedit_pageseg_mode: '6', // Assume uniform block of text
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<:.,/- ',
      preserve_interword_spaces: '1', // Preserve spaces between words
    })
    
    // Extract full text first
    const { data: { text: fullText } } = await worker.recognize(processedImagePath)
    
    // Clean up preprocessed image if it was created
    if (processedImagePath !== imagePath) {
      try {
        await fs.unlink(processedImagePath).catch(() => {}) // Ignore errors
      } catch {}
    }
    
    // Parse using improved parser
    const parsed = parseKenyanID(fullText)
    
    // Additional structured extraction using pattern matching
    const structuredData = extractStructuredData(fullText)
    
    // Combine results - prefer structured data when available
    const combined = {
      fullName: structuredData.fullName || parsed.fullName,
      idNumber: structuredData.idNumber || parsed.idNumber,
      dateOfBirth: structuredData.dateOfBirth || parsed.dateOfBirth,
      sex: structuredData.sex || parsed.sex,
      districtOfBirth: structuredData.districtOfBirth || parsed.districtOfBirth,
      placeOfIssue: structuredData.placeOfIssue || parsed.placeOfIssue,
      dateOfIssue: structuredData.dateOfIssue || parsed.dateOfIssue,
      rawText: fullText,
      method: 'docparser',
    }
    
    await worker.terminate()
    
    return combined
  } catch (error) {
    console.error('Docparser extraction error:', error)
    throw error
  }
}

/**
 * Extract structured data using pattern matching
 * Based on actual Kenyan ID card formats
 */
const extractStructuredData = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line)
  const fullText = text.toLowerCase()
  
  let fullName = null
  let idNumber = null
  let dateOfBirth = null
  let sex = null
  let districtOfBirth = null
  let placeOfIssue = null
  let dateOfIssue = null
  
  // 1. Extract name from MRZ (most reliable)
  // Format: GICHERU<<MALCOM<MURIUKI or GEORGE<RUCHATHI<KINYANJUI
  const mrzNamePatterns = [
    /([A-Z]{4,})<<([A-Z]{3,})<([A-Z]{3,})/,  // SURNAME<<GIVEN1<GIVEN2
    /([A-Z]{4,})<([A-Z]{3,})<([A-Z]{3,})/,  // SURNAME<GIVEN1<GIVEN2 (single <)
    /([A-Z]{3,})<([A-Z]{3,})<([A-Z]{4,})/,  // GIVEN1<GIVEN2<SURNAME (alternative)
  ]
  
  for (const pattern of mrzNamePatterns) {
    const match = text.match(pattern)
    if (match) {
      // Determine which is surname based on position and length
      // In Kenyan IDs, surname is usually first and longer, or last
      const parts = [match[1], match[2], match[3]]
      const longestPart = parts.reduce((a, b) => a.length > b.length ? a : b)
      const longestIndex = parts.indexOf(longestPart)
      
      // If first part is longest, it's likely surname
      if (longestIndex === 0) {
        fullName = `${parts[1]} ${parts[2]} ${parts[0]}` // Given names + Surname
      } else if (longestIndex === 2) {
        fullName = `${parts[0]} ${parts[1]} ${parts[2]}` // Given names + Surname
      } else {
        // Middle is longest - assume first is surname
        fullName = `${parts[1]} ${parts[2]} ${parts[0]}`
      }
      
      // Format properly
      fullName = fullName.split(/\s+/).map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join(' ')
      
      break
    }
  }
  
  // 2. Extract name from "FULL NAMES:" field
  if (!fullName) {
    const fullNamesPatterns = [
      /full\s*names?\s*:?\s*([A-Z][A-Z\s]{5,50}?)(?:\n|date|birth|sex|id|serial|number|$)/i,
      /full\s*names?\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    ]
    
    for (const pattern of fullNamesPatterns) {
      const match = text.match(pattern)
      if (match) {
        let name = match[1].trim()
        // Clean up OCR errors
        name = name.replace(/\s+/g, ' ').trim()
        
        // Filter out common non-name words
        if (!name.match(/^(JAMHURI|REPUBLIC|KENYA|DISTRICT|DIVISION|LOCATION|SERIAL|NUMBER|DATE|BIRTH|ISSUE|PLACE|HOLDER|SIGN|SEX|MALE|FEMALE)/i)) {
          fullName = name.split(/\s+/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')
          break
        }
      }
    }
  }
  
  // 3. Extract name from "Surname:" and "Given Name:" fields
  if (!fullName) {
    const surnameMatch = text.match(/surname\s*:?\s*([A-Z]{3,}[A-Z\s]*?)(?:\n|given|date|sex|id|$)/i)
    const givenNameMatch = text.match(/given\s*name\s*:?\s*([A-Z]{3,}[A-Z\s]*?)(?:\n|date|sex|id|$)/i)
    
    if (surnameMatch && givenNameMatch) {
      const surname = surnameMatch[1].trim()
      const givenName = givenNameMatch[1].trim()
      fullName = `${givenName} ${surname}`
      fullName = fullName.split(/\s+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    }
  }
  
  // 4. Extract ID number from MRZ
  const idPatterns = [
    /IDKEN(\d{8,9})/,
    /IDK[E5]N(\d{8,9})/,
    /IDKYA(\d{8,9})/,
    /IDK[YV]A(\d{8,9})/,
    /id\s*number\s*:?\s*(\d{8,9})/i,
  ]
  
  for (const pattern of idPatterns) {
    const match = text.match(pattern)
    if (match && match[1].length >= 8 && match[1].length <= 9) {
      idNumber = match[1]
      break
    }
  }
  
  // 5. Extract date of birth
  const dobPatterns = [
    /date\s*of\s*birth\s*:?\s*(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/i,
    /(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/,
  ]
  
  for (const pattern of dobPatterns) {
    const match = text.match(pattern)
    if (match) {
      const dateStr = match[1]
      const parts = dateStr.split(/[\.\/\-]/)
      if (parts.length === 3) {
        let day = parts[0].padStart(2, '0')
        let month = parts[1].padStart(2, '0')
        let year = parts[2]
        if (year.length === 2) {
          year = parseInt(year) > 50 ? `19${year}` : `20${year}`
        }
        dateOfBirth = `${year}-${month}-${day}`
        break
      }
    }
  }
  
  // 6. Extract sex
  const sexMatch = text.match(/sex\s*:?\s*(male|female|m|f)/i)
  if (sexMatch) {
    sex = sexMatch[1].toUpperCase()
  }
  
  // 7. Extract district of birth
  const districtMatch = text.match(/district\s*of\s*birth\s*:?\s*([A-Z\s]+)/i)
  if (districtMatch) {
    districtOfBirth = districtMatch[1].trim()
  }
  
  // 8. Extract place of issue
  const placeMatch = text.match(/place\s*of\s*issue\s*:?\s*([A-Z\s]+)/i)
  if (placeMatch) {
    placeOfIssue = placeMatch[1].trim()
  }
  
  // 9. Extract date of issue
  const issueDateMatch = text.match(/date\s*of\s*issue\s*:?\s*(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/i)
  if (issueDateMatch) {
    dateOfIssue = issueDateMatch[1]
  }
  
  return {
    fullName,
    idNumber,
    dateOfBirth,
    sex,
    districtOfBirth,
    placeOfIssue,
    dateOfIssue,
  }
}

export default {
  parseIDWithDocparser,
}

