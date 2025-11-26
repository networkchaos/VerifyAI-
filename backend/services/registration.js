import pool from '../db/init.js'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { extractText } from './ocrRegistry.js'
import { extractIDWithCombined } from './combinedExtraction.js'
import { 
  compareFaces as compareFacesGoogleVision,
  hasFaceInImage 
} from './googleVision.js'
import {
  compareFaces as compareFacesLocal,
  isModelAvailable as isFaceModelAvailable,
} from './faceDetectionService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Face similarity calculation
const calculateFaceSimilarity = async (idImagePath, selfieImagePath, ocrModel = 'tesseract', faceModel = null) => {
  try {
    console.log(`🔍 Starting face similarity calculation:`)
    console.log(`   ID Image: ${idImagePath}`)
    console.log(`   Selfie Image: ${selfieImagePath}`)
    console.log(`   Face Model: ${faceModel || 'auto'}`)
    
    // Check if files exist
    const fs = await import('fs/promises')
    try {
      const idStats = await fs.stat(idImagePath)
      const selfieStats = await fs.stat(selfieImagePath)
      console.log(`   ID Image size: ${idStats.size} bytes`)
      console.log(`   Selfie Image size: ${selfieStats.size} bytes`)
      
      if (idStats.size === 0 || selfieStats.size === 0) {
        console.error('❌ One or both images are empty!')
        return 0.0
      }
    } catch (statError) {
      console.error('❌ Error checking image files:', statError.message)
      return 0.0
    }
    
    // If face model is specified, use local face detection models
    if (faceModel && faceModel !== 'google-vision') {
      try {
        const available = await isFaceModelAvailable(faceModel)
        if (available) {
          console.log(`✅ Using specified face model: ${faceModel}`)
          const result = await compareFacesLocal(idImagePath, selfieImagePath, faceModel)
          console.log(`   Result: similarity=${result.similarity}, id_has_face=${result.id_has_face}, selfie_has_face=${result.selfie_has_face}`)
          if (result.message) console.log(`   Message: ${result.message}`)
          if (result.error) console.error(`   Error: ${result.error}`)
          return result.similarity || 0
        } else {
          console.warn(`⚠️ Face detection model ${faceModel} not available, falling back...`)
        }
      } catch (error) {
        console.error(`❌ Error with face detection model ${faceModel}:`, error.message)
        // Fallback to other methods
      }
    }
    
    // Use Google Vision if specified
    if (ocrModel === 'google-vision' || faceModel === 'google-vision') {
      try {
        console.log('✅ Trying Google Vision...')
        const result = await compareFacesGoogleVision(idImagePath, selfieImagePath)
        console.log(`   Google Vision result: similarity=${result.similarity}`)
        return result.similarity || 0
      } catch (error) {
        console.error('❌ Google Vision face comparison error:', error.message)
        // Fallback to local models
      }
    }
    
    // Try DeepFace for accurate face verification
    try {
      const available = await isFaceModelAvailable('deepface')
      if (available) {
        console.log('✅ Trying DeepFace...')
        const result = await compareFacesLocal(idImagePath, selfieImagePath, 'deepface')
        console.log(`   DeepFace result: similarity=${result.similarity}, verified=${result.verified}`)
        if (result.message) console.log(`   Message: ${result.message}`)
        if (result.error) console.error(`   Error: ${result.error}`)
        return result.similarity || 0
      } else {
        console.log('⚠️ DeepFace not available')
      }
    } catch (error) {
      console.error('❌ DeepFace comparison error:', error.message)
    }
    
    // Try InsightFace as fallback
    try {
      const available = await isFaceModelAvailable('insightface')
      if (available) {
        console.log('✅ Trying InsightFace...')
        const result = await compareFacesLocal(idImagePath, selfieImagePath, 'insightface')
        console.log(`   InsightFace result: similarity=${result.similarity}`)
        return result.similarity || 0
      } else {
        console.log('⚠️ InsightFace not available')
      }
    } catch (error) {
      console.error('❌ InsightFace comparison error:', error.message)
    }
    
    // Try YOLOv8 as final fallback
    try {
      const available = await isFaceModelAvailable('yolov8-face')
      if (available) {
        console.log('✅ Trying YOLOv8...')
        const result = await compareFacesLocal(idImagePath, selfieImagePath, 'yolov8-face')
        console.log(`   YOLOv8 result: similarity=${result.similarity}, id_has_face=${result.id_has_face}, selfie_has_face=${result.selfie_has_face}`)
        if (result.message) console.log(`   Message: ${result.message}`)
        return result.similarity || 0
      } else {
        console.log('⚠️ YOLOv8 not available')
      }
    } catch (error) {
      console.error('❌ YOLOv8 face comparison error:', error.message)
    }
    
    // Final fallback - return 0 instead of mock similarity
    console.warn('⚠️ No face detection models available or all failed, returning 0.0')
    return 0.0
  } catch (error) {
    console.error('❌ Face similarity calculation error:', error)
    return 0.0
  }
}

// Extract text from ID image using OCR (with combined Docparser + OCR)
export const extractIDText = async (imagePath, ocrModel = 'tesseract', useCombined = true) => {
  try {
    // Use combined extraction (Docparser + OCR) for better accuracy
    if (useCombined) {
      try {
        return await extractIDWithCombined(imagePath, ocrModel)
      } catch (combinedError) {
        console.warn('Combined extraction failed, falling back to OCR only:', combinedError.message)
        // Fallback to OCR only
      }
    }
    
    // Fallback to OCR only
    return await extractText(imagePath, ocrModel, true)
  } catch (error) {
    console.error('OCR Error:', error)
    return {
      text: '',
      idNumber: null,
      name: null,
      dob: null,
      fullName: null,
      dateOfBirth: null,
      method: ocrModel,
      error: error.message,
    }
  }
}

// Validate ID details match entered information with fuzzy matching
// Now checks ALL OCR runs (3 runs) and approves if ANY run has similar data
const validateIDDetails = (ocrResult, formData) => {
  const errors = []
  let isValid = true
  let hasExactMatch = false
  let hasSimilarMatch = false
  let matchedFields = []
  let similarMatches = []
  
  // Collect all results to check - include main result and all runs from multiple extractions
  const allResultsToCheck = []
  
  // Add main result
  if (ocrResult) {
    try {
      allResultsToCheck.push({
        source: 'main',
        fullName: ocrResult.fullName || ocrResult.name || null,
        idNumber: ocrResult.idNumber || null,
        dateOfBirth: ocrResult.dateOfBirth || ocrResult.dob || null,
        text: ocrResult.text || ocrResult.rawText || '',
      })
    } catch (error) {
      console.warn('Error adding main result to validation:', error.message)
    }
  }
  
  // Add all results from multiple OCR runs (if available)
  if (ocrResult && ocrResult.allResults && Array.isArray(ocrResult.allResults)) {
    try {
      console.log(`🔍 Checking ${ocrResult.allResults.length} OCR runs for matches...`)
      for (const runResult of ocrResult.allResults) {
        if (runResult) {
          allResultsToCheck.push({
            source: `run-${runResult.run || 'unknown'}`,
            fullName: runResult.fullName || null,
            idNumber: runResult.idNumber || null,
            dateOfBirth: runResult.dateOfBirth || null,
            text: runResult.text || '',
          })
        }
      }
    } catch (error) {
      console.warn('Error adding OCR run results to validation:', error.message)
    }
  }
  
  // Check name match - also check if key parts of the name appear in OCR text
  let hasExactNameMatch = false
  let nameMatchFoundInRun = null
  if (formData.fullName) {
    const enteredName = normalizeName(formData.fullName)
    const enteredNameParts = enteredName.split(/\s+/).filter(part => part.length >= 3)
    
    // Check ALL results (main + all OCR runs) for name matches
    for (const result of allResultsToCheck) {
      if (!result) continue // Skip null/undefined results
      if (hasExactNameMatch) break // Already found a match
      
      const extractedName = result.fullName ? normalizeName(result.fullName) : null
      const ocrText = result.text ? normalizeName(result.text) : null
      
      // Check extracted name
      if (extractedName) {
        // Check for exact match
        if (extractedName === enteredName) {
          hasExactNameMatch = true
          hasExactMatch = true
          matchedFields.push('name')
          nameMatchFoundInRun = result.source
          console.log(`✅ Exact name match in ${result.source}: "${result.fullName}" matches "${formData.fullName}"`)
          break
        }
        
        // Check if ANY word from entered name appears in extracted name
        let hasWordMatch = false
        for (const part of enteredNameParts) {
          if (extractedName.includes(part)) {
            hasWordMatch = true
            hasExactNameMatch = true
            hasExactMatch = true
            matchedFields.push('name_word_match')
            nameMatchFoundInRun = result.source
            console.log(`✅ Name word match in ${result.source}: Found "${part}" in extracted name "${result.fullName}" - APPROVED`)
            break
          }
        }
        
        // Check if ANY word from extracted name appears in entered name
        if (!hasWordMatch) {
          const extractedNameParts = extractedName.split(/\s+/).filter(p => p.length >= 3)
          for (const extractedPart of extractedNameParts) {
            if (enteredName.includes(extractedPart)) {
              hasWordMatch = true
              hasExactNameMatch = true
              hasExactMatch = true
              matchedFields.push('name_word_match')
              nameMatchFoundInRun = result.source
              console.log(`✅ Name word match in ${result.source}: Found "${extractedPart}" from extracted name in entered name - APPROVED`)
              break
            }
            // Fuzzy match
            for (const enteredPart of enteredNameParts) {
              const similarity = calculateNameSimilarity(extractedPart, enteredPart)
              if (similarity >= 0.6) {
                hasWordMatch = true
                hasExactNameMatch = true
                hasExactMatch = true
                matchedFields.push('name_word_match_fuzzy')
                nameMatchFoundInRun = result.source
                console.log(`✅ Name word fuzzy match in ${result.source}: "${extractedPart}" similar to "${enteredPart}" (${(similarity * 100).toFixed(0)}%) - APPROVED`)
                break
              }
            }
            if (hasWordMatch) break
          }
        }
        
        // Try overall fuzzy similarity
        if (!hasWordMatch) {
          const nameSimilarity = calculateNameSimilarity(extractedName, enteredName)
          if (nameSimilarity >= 0.5) {
            hasSimilarMatch = true
            hasExactMatch = true
            similarMatches.push({ field: 'name', extracted: result.fullName, entered: formData.fullName, similarity: nameSimilarity, source: result.source })
            nameMatchFoundInRun = result.source
            console.log(`✅ Similar name match in ${result.source}: "${result.fullName}" similar to "${formData.fullName}" (${(nameSimilarity * 100).toFixed(1)}%)`)
            break
          }
        }
      }
      
      // Check OCR text for name parts
      if (!hasExactNameMatch && ocrText) {
        let matchingParts = 0
        const foundParts = []
        
        for (const part of enteredNameParts) {
          if (ocrText.includes(part)) {
            matchingParts++
            foundParts.push(part)
            console.log(`✅ Found name part "${part}" in ${result.source} OCR text (exact match)`)
          } else {
            const similarWords = findSimilarWords(part, ocrText, 0.5)
            if (similarWords.length > 0 && similarWords[0].similarity >= 0.5) {
              matchingParts++
              foundParts.push(`${part} (similar to: ${similarWords[0].word})`)
              console.log(`✅ Found similar name part "${part}" in ${result.source} OCR text (similar to "${similarWords[0].word}")`)
            }
          }
        }
        
        if (matchingParts > 0) {
          hasExactNameMatch = true
          hasExactMatch = true
          matchedFields.push('name_parts')
          nameMatchFoundInRun = result.source
          console.log(`✅ Name match approved from ${result.source}: Found ${matchingParts} matching name part(s): ${foundParts.join(', ')} - APPROVED`)
          break
        }
      }
    }
    
    // If no match found in any run, add error
    if (!hasExactNameMatch && !hasSimilarMatch) {
      errors.push(`Name mismatch: No matching name found in any OCR extraction run`)
      isValid = false
    }
  }
  
  // Check ID number match - CRITICAL: ID number must match exactly or test fails
  // Check ALL OCR runs for ID number match
  let hasExactIdMatch = false
  let idNumberCritical = false
  let idMatchFoundInRun = null
  if (formData.nationalId) {
    const enteredId = formData.nationalId.replace(/\s+/g, '').trim()
    idNumberCritical = true // ID number is always critical
    
    // Check ALL results (main + all OCR runs) for ID number match
    for (const result of allResultsToCheck) {
      if (!result) continue // Skip null/undefined results
      if (hasExactIdMatch) break // Already found a match
      
      // Check extracted ID number
      if (result.idNumber) {
        const extractedId = String(result.idNumber).replace(/\s+/g, '').trim()
        if (extractedId === enteredId) {
          hasExactIdMatch = true
          hasExactMatch = true
          matchedFields.push('id_number')
          idMatchFoundInRun = result.source
          console.log(`✅ Exact ID match in ${result.source}: "${extractedId}" matches "${enteredId}"`)
          break
        }
      }
      
      // Check if entered ID appears in OCR text
      if (result.text && result.text.includes(enteredId)) {
        hasExactIdMatch = true
        hasExactMatch = true
        matchedFields.push('id_number_in_text')
        idMatchFoundInRun = result.source
        console.log(`✅ ID found in ${result.source} OCR text: "${enteredId}" found in extracted text`)
        break
      }
    }
    
    // If no match found in any run, add error
    if (!hasExactIdMatch) {
      errors.push(`CRITICAL: ID number "${enteredId}" not found in any OCR extraction run`)
      isValid = false
      console.log(`❌ CRITICAL: ID number not found in any OCR run - test will FAIL`)
    }
  }
  
  // Check date of birth match - check ALL OCR runs
  let hasExactDobMatch = false
  let dobMatchFoundInRun = null
  if (formData.dateOfBirth) {
    const enteredDob = new Date(formData.dateOfBirth).toISOString().split('T')[0]
    
    // Check ALL results (main + all OCR runs) for DOB match
    for (const result of allResultsToCheck) {
      if (!result) continue // Skip null/undefined results
      if (hasExactDobMatch) break // Already found a match
      
      if (result.dateOfBirth) {
        const extractedDob = new Date(result.dateOfBirth).toISOString().split('T')[0]
        if (extractedDob === enteredDob) {
          hasExactDobMatch = true
          hasExactMatch = true
          matchedFields.push('date_of_birth')
          dobMatchFoundInRun = result.source
          console.log(`✅ Exact DOB match in ${result.source}: "${extractedDob}" matches "${enteredDob}"`)
          break
        }
      }
    }
    
    // If no match found in any run, add error
    if (!hasExactDobMatch) {
      errors.push(`Date of birth mismatch: No matching date found in any OCR extraction run`)
      isValid = false
    }
  }
  
  // If any field matches exactly or similarly, approve the test
  if (hasExactMatch || hasSimilarMatch) {
    if (hasExactMatch) {
      console.log(`✅ Test approved: Exact match found in field(s): ${matchedFields.join(', ')}`)
    }
    if (hasSimilarMatch) {
      console.log(`✅ Test approved: Similar match found:`, similarMatches)
    }
  }
  
  // CRITICAL: If ID number is required and doesn't match, test must fail regardless of other matches
  let finalIsValid = isValid
  if (idNumberCritical && !hasExactIdMatch) {
    finalIsValid = false
    console.log(`❌ CRITICAL: ID number validation failed - test will be REJECTED regardless of other matches`)
  }
  
  return {
    isValid: finalIsValid && (hasExactMatch || hasSimilarMatch), // Approve only if ID matches AND other fields match
    errors,
    hasExactMatch, // Flag to indicate any exact match
    hasSimilarMatch, // Flag to indicate any similar match
    hasExactNameMatch: hasExactNameMatch || hasSimilarMatch, // Keep for backward compatibility
    hasExactIdMatch, // Flag to indicate ID number matched
    matchedFields, // Which fields matched exactly
    similarMatches, // Which fields matched similarly
    idNumberCritical, // Flag to indicate ID number is critical
  }
}

// Normalize name for comparison (remove extra spaces, convert to uppercase)
const normalizeName = (name) => {
  if (!name) return ''
  return name
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^A-Z\s]/g, '')
}

// Find similar words in text using fuzzy matching
const findSimilarWords = (targetWord, text, minSimilarity = 0.7) => {
  if (!targetWord || !text) return []
  
  const target = normalizeName(targetWord)
  const normalizedText = normalizeName(text)
  const words = normalizedText.split(/\s+/).filter(w => w.length >= 3)
  
  const similarWords = []
  for (const word of words) {
    if (word.length < 3) continue
    
    // Check if word contains target or target contains word (substring match)
    if (word.includes(target) || target.includes(word)) {
      similarWords.push({ word, similarity: 1.0, type: 'substring' })
      continue
    }
    
    // Calculate similarity for longer words
    const similarity = calculateNameSimilarity(target, word)
    if (similarity >= minSimilarity) {
      similarWords.push({ word, similarity, type: 'fuzzy' })
    }
  }
  
  return similarWords.sort((a, b) => b.similarity - a.similarity)
}

// Calculate name similarity using Levenshtein distance
const calculateNameSimilarity = (name1, name2) => {
  const longer = name1.length > name2.length ? name1 : name2
  const shorter = name1.length > name2.length ? name2 : name1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

// Levenshtein distance calculation
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

// Check for duplicates (allows same ID for testing, but flags if different person)
const checkDuplicates = async (nationalId, phoneNumber, fullName) => {
  try {
    // Check by ID number - but allow if it's the same person (same name)
    const idCheck = await pool.query(
      'SELECT id, id_number, name FROM voters WHERE id_number = $1 ORDER BY created_at DESC LIMIT 5',
      [nationalId]
    )
    
    // Check by phone number - only flag if different name
    const phoneCheck = await pool.query(
      'SELECT id, id_number, name FROM voters WHERE phone = $1 ORDER BY created_at DESC LIMIT 5',
      [phoneNumber]
    )
    
    // If same ID but different name, it's a duplicate (different person using same ID)
    const differentPersonSameId = idCheck.rows.some(record => {
      const recordName = normalizeName(record.name)
      const enteredName = normalizeName(fullName)
      return calculateNameSimilarity(recordName, enteredName) < 0.7
    })
    
    // If same phone but different name, it's a duplicate
    const differentPersonSamePhone = phoneCheck.rows.some(record => {
      const recordName = normalizeName(record.name)
      const enteredName = normalizeName(fullName)
      return calculateNameSimilarity(recordName, enteredName) < 0.7
    })
    
    return {
      duplicateId: differentPersonSameId, // Only flag if different person
      duplicatePhone: differentPersonSamePhone, // Only flag if different person
      existingRecords: [...idCheck.rows, ...phoneCheck.rows],
    }
  } catch (error) {
    console.error('Duplicate check error:', error)
    return {
      duplicateId: false,
      duplicatePhone: false,
      existingRecords: [],
    }
  }
}

// Process registration
export const processRegistration = async ({ form, idImagePath, idBackImagePath, selfieImagePath, ocrModel = 'tesseract', faceModel = null }) => {
  const { fullName, nationalId, dateOfBirth, phoneNumber, address } = form
  
  try {
    // 1. Run combined extraction (Docparser + OCR) on ID image for better accuracy
    console.log(`Running combined extraction (Docparser + OCR) on ID image using ${ocrModel}...`)
    const ocrResult = await extractIDText(idImagePath, ocrModel, true)
    
    // 1.5. Post-process: If entered ID number appears in OCR text, prioritize it
    // This helps fix cases where OCR extracts wrong numbers (e.g., document numbers instead of ID)
    if (nationalId && ocrResult.text) {
      const cleanEnteredId = nationalId.replace(/\s+/g, '').trim()
      const cleanExtractedId = ocrResult.idNumber ? ocrResult.idNumber.replace(/\s+/g, '').trim() : null
      
      // Check if entered ID appears in OCR text
      if (ocrResult.text.includes(cleanEnteredId)) {
        // Check if extracted ID is different
        if (cleanExtractedId && cleanExtractedId !== cleanEnteredId) {
          console.log(`⚠️ Extracted ID "${cleanExtractedId}" differs from entered ID "${cleanEnteredId}"`)
          console.log(`🔍 Checking if entered ID "${cleanEnteredId}" is in correct position...`)
          
          // Check if entered ID appears in MRZ line 1 (correct position for ID number)
          const lines = ocrResult.text.split('\n').map(line => line.trim()).filter(line => line)
          const mrzLines = lines.filter(line => 
            line.length >= 20 && /[<0-9A-Z]/.test(line) && 
            (line.match(/IDK(?:EN|YA)/) || line.match(/\d{6}[MF]/) || line.match(/[A-Z]+<[A-Z]+/))
          )
          
          if (mrzLines.length >= 1) {
            const mrzLine1 = mrzLines[0]
            // Find IDKEN/IDKYA position
            const idkenMatch = mrzLine1.match(/IDK(?:EN|YA|5N|5YA)/i)
            if (idkenMatch) {
              const idkenIndex = idkenMatch.index + idkenMatch[0].length
              const enteredIdIndex = mrzLine1.indexOf(cleanEnteredId)
              const extractedIdIndex = mrzLine1.indexOf(cleanExtractedId)
              
              // If entered ID is closer to IDKEN position (within 15 chars), use it
              if (enteredIdIndex !== -1) {
                const enteredIdDistance = enteredIdIndex - idkenIndex
                const extractedIdDistance = extractedIdIndex !== -1 ? extractedIdIndex - idkenIndex : 999
                
                if (enteredIdDistance >= 0 && enteredIdDistance <= 15 && 
                    (enteredIdDistance < extractedIdDistance || extractedIdDistance < 0)) {
                  console.log(`✅ Correcting ID: Using entered ID "${cleanEnteredId}" (distance from IDKEN: ${enteredIdDistance}) instead of extracted "${cleanExtractedId}"`)
                  ocrResult.idNumber = cleanEnteredId
                } else if (extractedIdDistance >= 0 && extractedIdDistance <= 15) {
                  console.log(`⚠️ Keeping extracted ID "${cleanExtractedId}" (distance from IDKEN: ${extractedIdDistance})`)
                }
              }
            }
          } else {
            // No MRZ found, but entered ID is in text - use it if extracted is different
            console.log(`✅ No MRZ found, but entered ID "${cleanEnteredId}" is in OCR text - using it`)
            ocrResult.idNumber = cleanEnteredId
          }
        } else if (!cleanExtractedId) {
          // No ID was extracted, but entered ID is in text - use it
          console.log(`✅ No ID extracted, but entered ID "${cleanEnteredId}" is in OCR text - using it`)
          ocrResult.idNumber = cleanEnteredId
        }
      }
    }
    
    // 2. Calculate face similarity - prefer DeepFace for accurate verification
    const faceDetectionModel = faceModel || (ocrModel === 'google-vision' ? 'google-vision' : 'deepface')
    console.log(`Calculating face similarity using ${faceDetectionModel}...`)
    const faceSimilarity = await calculateFaceSimilarity(idImagePath, selfieImagePath, ocrModel, faceDetectionModel)
    
    // 3. Validate ID details match entered information
    const idValidation = validateIDDetails(ocrResult, { fullName, nationalId, dateOfBirth })
    
    // 4. Determine verification status
    let status = 'pending'
    let flaggedReason = null
    const validationErrors = []
    
    // CRITICAL CHECK 1: ID number must match exactly - if wrong, test ALWAYS fails
    if (idValidation.idNumberCritical && !idValidation.hasExactIdMatch) {
      status = 'flagged'
      flaggedReason = 'id_number_mismatch'
      validationErrors.push(...idValidation.errors.filter(e => e.includes('ID number') || e.includes('CRITICAL')))
      console.log(`❌ CRITICAL: ID number validation failed - test REJECTED`)
    }
    // CRITICAL CHECK 2: Face similarity must be >= 60%
    else if (faceSimilarity < 0.60) {
      status = 'flagged'
      flaggedReason = 'face_mismatch'
      validationErrors.push(`Face similarity too low (${(faceSimilarity * 100).toFixed(1)}%). Selfie does not match ID photo.`)
      console.log(`❌ CRITICAL: Face similarity too low - test REJECTED`)
    } 
    // If ID number matches, require at least name OR DOB to match
    else if (idValidation.hasExactIdMatch) {
      // Check if name or DOB matches
      const hasNameMatch = idValidation.hasExactNameMatch || 
        idValidation.matchedFields.some(f => f.includes('name'))
      const hasDobMatch = idValidation.matchedFields.some(f => f.includes('date_of_birth'))
      
      if (hasNameMatch || hasDobMatch) {
        status = 'verified'
        if (hasNameMatch && hasDobMatch) {
          console.log(`✅ Verification approved: ID number matches AND both name and DOB match`)
        } else if (hasNameMatch) {
          console.log(`✅ Verification approved: ID number matches AND name matches`)
        } else if (hasDobMatch) {
          console.log(`✅ Verification approved: ID number matches AND DOB matches`)
        }
        if (idValidation.hasExactMatch) {
          console.log(`  Matched fields: ${idValidation.matchedFields.join(', ')}`)
        }
        if (idValidation.hasSimilarMatch) {
          idValidation.similarMatches.forEach(match => {
            const matchInfo = match.extracted 
              ? `${match.field}: "${match.extracted}" similar to "${match.entered}" (${(match.similarity * 100).toFixed(0)}%)`
              : `${match.field}: Found ${match.found} for "${match.entered}"`
            console.log(`  - ${matchInfo}`)
          })
        }
      } else {
        // ID matches but neither name nor DOB matches - fail
        status = 'flagged'
        flaggedReason = 'id_details_mismatch'
        validationErrors.push(`ID number matches but name and date of birth do not match`)
        console.log(`❌ ID number matches but name and DOB don't match - test REJECTED`)
      }
    } 
    // Otherwise, check all validations
    else if (!idValidation.isValid) {
      status = 'flagged'
      flaggedReason = 'id_details_mismatch'
      validationErrors.push(...idValidation.errors)
      console.log(`❌ Validation failed: ${validationErrors.join('; ')}`)
    } else {
      status = 'verified'
    }
    
    // 5. Generate file URLs (in production, upload to S3/MinIO)
    const idImageUrl = `/uploads/${path.basename(idImagePath)}`
    const idBackImageUrl = idBackImagePath ? `/uploads/${path.basename(idBackImagePath)}` : null
    const selfieImageUrl = `/uploads/${path.basename(selfieImagePath)}`
    
    // 6. Store in database
    const voterId = uuidv4()
    const result = await pool.query(
      `INSERT INTO voters (
        id, id_number, name, dob, phone, address,
        id_image_url, selfie_image_url, id_ocr,
        verification_status, flagged_reason, face_embedding,
        face_similarity, validation_errors
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, verification_status, created_at`,
      [
        voterId,
        nationalId,
        fullName,
        dateOfBirth || null,
        phoneNumber,
        address,
        idImageUrl, // Store front image URL
        selfieImageUrl,
        JSON.stringify({ ...ocrResult, idBackImageUrl }), // Store back image URL in OCR data
        status,
        flaggedReason,
        [], // Placeholder for face embedding array
        faceSimilarity,
        validationErrors.length > 0 ? JSON.stringify(validationErrors) : null,
      ]
    )
    
    const message =
      status === 'verified'
        ? 'Verification successful! Your identity has been verified and confirmed.'
        : 'Verification flagged for review. Please keep your reference ID safe.'
    
    return {
      status,
      voterId: result.rows[0].id,
      message,
      flaggedReason,
      similarity: faceSimilarity,
      ocrResult,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      idValidation,
    }
  } catch (error) {
    console.error('Registration processing error:', error)
    throw error
  }
}
