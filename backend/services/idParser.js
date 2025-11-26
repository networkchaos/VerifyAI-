// Kenyan ID Parser - Extracts information from OCR text

// Helper function to identify MRZ lines
const identifyMrzLines = (lines) => {
  const mrzLines = []
  
  for (const line of lines) {
    // MRZ lines are typically long (20+ chars), contain <, numbers, and uppercase letters
    if (line.length >= 20 && /[<0-9A-Z]/.test(line) && line.match(/[A-Z]{2,}/)) {
      // Check if it looks like an MRZ line
      // Line 1: Starts with IDKEN or IDKYA
      // Line 2: Contains date pattern and KEN
      // Line 3: Contains name with < separators
      if (line.match(/IDK(?:EN|YA)/) || 
          line.match(/\d{6}[MF]/) || 
          line.match(/[A-Z]+<[A-Z]+/)) {
        mrzLines.push(line)
      }
    }
  }
  
  return mrzLines
}

// Blacklist of common ID card text that should never be considered as names
const ID_CARD_BLACKLIST = [
  'JAMHURI',
  'JAMHURI YA KENYA',
  'REPUBLIC',
  'REPUBLIC OF KENYA',
  'KENYA',
  'KITAMBULISHO',
  'KITAMBULISHO CHA TAIFA',
  'TAIFA',
  'NATIONAL',
  'NATIONAL IDENTITY',
  'NATIONAL IDENTITY CARD',
  'IDENTITY',
  'IDENTITY CARD',
  'CARD',
  'DISTRICT',
  'DIVISION',
  'LOCATION',
  'SUB-LOCATION',
  'NAIVASHA',
  'MURANGA',
  'SERIAL',
  'NUMBER',
  'DATE',
  'BIRTH',
  'ISSUE',
  'PLACE',
  'HOLDER',
  'SIGN',
  'SEX',
  'MALE',
  'FEMALE',
  'COUNTY',
  'SUB-COUNTY',
  'PRINCIPAL',
  'REGISTRAR',
]

// Check if a string contains any blacklisted words
const containsBlacklistedText = (text) => {
  if (!text) return false
  const upperText = text.toUpperCase()
  return ID_CARD_BLACKLIST.some(blacklisted => upperText.includes(blacklisted))
}

// Validate if extracted name looks reasonable
const isValidName = (name) => {
  if (!name || name.length < 5) return false
  
  // Reject if contains blacklisted ID card text
  if (containsBlacklistedText(name)) {
    return false
  }
  
  // Reject names with too many short words (likely OCR errors)
  const words = name.split(/\s+/)
  if (words.length < 2) return false
  
  // Reject if all words are too short (likely OCR garbage)
  const shortWords = words.filter(w => w.length <= 2).length
  if (shortWords > words.length / 2) return false
  
  // Reject common OCR error patterns
  const errorPatterns = [
    /^[A-Z]{1,2}\s+[A-Z]{1,2}\s+[A-Z]{1,2}/,  // Too many 1-2 letter words
    /^[^A-Za-z]/,  // Starts with non-letter
    /\d/,  // Contains numbers
    /[^A-Za-z\s]/,  // Contains special chars (except spaces)
  ]
  
  for (const pattern of errorPatterns) {
    if (pattern.test(name)) return false
  }
  
  // Name should have at least 2 words with 3+ letters each
  const validWords = words.filter(w => w.length >= 3)
  return validWords.length >= 2
}

export const parseKenyanID = (ocrText, enteredIdNumber = null) => {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line)
  
  let fullName = null
  let idNumber = null
  let dateOfBirth = null
  let sex = null
  let districtOfBirth = null
  let placeOfIssue = null
  let dateOfIssue = null
  
  const fullText = ocrText.toLowerCase()
  
  // If entered ID number is provided, check if it exists in OCR text and prioritize it
  if (enteredIdNumber) {
    const cleanEnteredId = enteredIdNumber.replace(/\s+/g, '').trim()
    // Check if entered ID appears in the OCR text
    if (ocrText.includes(cleanEnteredId)) {
      console.log(`✅ Found entered ID "${cleanEnteredId}" in OCR text - will prioritize this`)
      
      // FIRST: Check if it appears in "ID NUMBER:" field (most reliable for actual ID)
      const idNumberFieldPattern = /id\s*number\s*:?\s*(\d{8,9})/i
      const idNumberFieldMatch = ocrText.match(idNumberFieldPattern)
      if (idNumberFieldMatch && idNumberFieldMatch[1] === cleanEnteredId) {
        idNumber = cleanEnteredId
        console.log(`✅ Using entered ID "${cleanEnteredId}" from "ID NUMBER:" field (highest priority)`)
      } else {
        // SECOND: Check if it appears in MRZ line 1 (after IDKEN/IDKYA)
        const mrzLines = identifyMrzLines(lines)
        if (mrzLines.length >= 1) {
          const mrzLine1 = mrzLines[0]
          // Check if entered ID appears right after IDKEN/IDKYA in MRZ line 1
          const idkenMatch = mrzLine1.match(/IDK(?:EN|YA|5N|5YA)(\d{8,9})/)
          if (idkenMatch && idkenMatch[1] === cleanEnteredId) {
            idNumber = cleanEnteredId
            console.log(`✅ Using entered ID "${cleanEnteredId}" from MRZ line 1`)
          } else {
            // THIRD: If entered ID is anywhere in text (and not in MRZ line 2), use it
            // This handles cases where ID appears in text fields but not in MRZ
            const mrzLines = identifyMrzLines(lines)
            let isInMrzLine2 = false
            if (mrzLines.length >= 2) {
              const mrzLine2 = mrzLines[1]
              const kenIndex = mrzLine2.indexOf('KEN')
              const enteredIdIndex = mrzLine2.indexOf(cleanEnteredId)
              if (kenIndex !== -1 && enteredIdIndex > kenIndex) {
                isInMrzLine2 = true
              }
            }
            
            if (!isInMrzLine2) {
              idNumber = cleanEnteredId
              console.log(`✅ Using entered ID "${cleanEnteredId}" - found in OCR text (not in MRZ line 2)`)
            }
          }
        }
      }
    }
  }
  
  // Try MRZ (Machine Readable Zone) parsing FIRST - most reliable
  const mrzLines = identifyMrzLines(lines)
  
  // Log MRZ lines for debugging
  if (mrzLines.length > 0) {
    console.log(`📋 Found ${mrzLines.length} MRZ line(s):`)
    mrzLines.forEach((line, idx) => {
      console.log(`  Line ${idx + 1}: ${line.substring(0, 50)}...`)
    })
  }
  
  // Extract ID number from MRZ FIRST (most accurate)
  if (mrzLines.length >= 1 && !idNumber) {
    // MRZ format: IDKEN6333078363<195<4741<<<<<<
    // The ID number is right after IDKEN (Kenya country code)
    // It's typically 8-9 digits, followed by other data
    const mrzLine1 = mrzLines[0]
    
    // If entered ID was provided, check if it appears in MRZ line 1 first
    if (enteredIdNumber) {
      const cleanEnteredId = enteredIdNumber.replace(/\s+/g, '').trim()
      // Find IDKEN/IDKYA position
      const idkenMatch = mrzLine1.match(/IDK(?:EN|YA|5N|5YA)/i)
      if (idkenMatch) {
        const idkenIndex = idkenMatch.index + idkenMatch[0].length
        // Check if entered ID appears right after IDKEN (within next 15 characters)
        const nextSection = mrzLine1.substring(idkenIndex, idkenIndex + 15)
        if (nextSection.includes(cleanEnteredId)) {
          idNumber = cleanEnteredId
          console.log(`✅ Using entered ID "${cleanEnteredId}" - found in MRZ line 1 after IDKEN`)
        }
      }
    }
    
    // If we don't have the entered ID, try extraction patterns
    if (!idNumber) {
      // Try multiple patterns for IDKEN (OCR might misread characters)
      const idkenPatterns = [
        /IDKEN(\d{8,9})/,           // Exact: IDKEN633307836
        /IDK[E5]N(\d{8,9})/,        // OCR might read E as 5: IDK5N
        /IDK[E5][E5]N(\d{8,9})/,    // OCR might misread: IDK55N
        /[1I][D0]K[E5]N(\d{8,9})/,  // OCR might read I as 1, D as 0
        /IDK[E5]N(\d{8,9})[<0-9]/,  // With following character
      ]
      
      for (const pattern of idkenPatterns) {
        const match = mrzLine1.match(pattern)
        if (match) {
          const extracted = match[1]
          // Validate it's 8-9 digits (Kenyan ID format)
          if (extracted.length >= 8 && extracted.length <= 9) {
            // If entered ID was provided and is different, check which one is more likely correct
            if (enteredIdNumber) {
              const cleanEnteredId = enteredIdNumber.replace(/\s+/g, '').trim()
              if (extracted !== cleanEnteredId) {
                // Check if entered ID also appears in MRZ line 1
                const enteredIdIndex = mrzLine1.indexOf(cleanEnteredId)
                const extractedIndex = mrzLine1.indexOf(extracted)
                const idkenIndex = mrzLine1.search(/IDK(?:EN|YA|5N|5YA)/i)
                
                // Prefer the one that appears closer to IDKEN (correct position)
                if (enteredIdIndex !== -1 && idkenIndex !== -1) {
                  const enteredIdDistance = enteredIdIndex - idkenIndex
                  const extractedDistance = extractedIndex - idkenIndex
                  
                  // If entered ID is closer to IDKEN and within reasonable distance (0-15 chars), use it
                  if (enteredIdDistance >= 0 && enteredIdDistance <= 15 && 
                      (enteredIdDistance < extractedDistance || extractedDistance < 0)) {
                    idNumber = cleanEnteredId
                    console.log(`✅ Using entered ID "${cleanEnteredId}" - closer to IDKEN position (distance: ${enteredIdDistance})`)
                    break
                  }
                }
              }
            }
            
            if (!idNumber) {
              idNumber = extracted
              console.log(`✅ Extracted ID from MRZ line 1: ${idNumber} (pattern: ${pattern})`)
              break
            }
          }
        }
      }
    }
    
    // Fallback: Try IDKYA pattern (older format)
    if (!idNumber) {
      const idkyaPatterns = [
        /IDKYA(\d{8,9})/,
        /IDK[YV]A(\d{8,9})/,  // OCR might read Y as V
      ]
      
      for (const pattern of idkyaPatterns) {
        const match = mrzLine1.match(pattern)
        if (match) {
          const extracted = match[1]
          if (extracted.length >= 8 && extracted.length <= 9) {
            idNumber = extracted
            console.log(`✅ Extracted ID from MRZ line 1 (IDKYA): ${idNumber}`)
            break
          }
        }
      }
    }
    
    // Last resort: Extract first 8-9 digit sequence after IDK
    if (!idNumber) {
      const flexibleMatch = mrzLine1.match(/IDK[A-Z0-9]{0,3}(\d{8,9})/)
      if (flexibleMatch) {
        const extracted = flexibleMatch[1]
        if (extracted.length >= 8 && extracted.length <= 9) {
          idNumber = extracted
          console.log(`✅ Extracted ID from MRZ line 1 (flexible): ${idNumber}`)
        }
      }
    }
  }
  
  // If MRZ didn't work, try text field patterns
  if (!idNumber) {
    const idPatterns = [
      /id\s*number\s*:?\s*(\d{8,9})/i,  // "ID NUMBER: 633307836"
      /id\s*number\s*:?\s*(\d{6,10})/i,  // More flexible
      /serial\s*number\s*:?\s*(\d{8,9})/i,  // "SERIAL NUMBER: 633307836"
    ]
    
    for (const pattern of idPatterns) {
      const match = ocrText.match(pattern)
      if (match) {
        const extractedId = match[1]
        // Kenyan ID numbers are typically 8-9 digits
        if (extractedId.length >= 8 && extractedId.length <= 9) {
          // Double-check: make sure this number is NOT from MRZ line 2
          let isFromMrzLine2 = false
          if (mrzLines.length >= 2) {
            const mrzLine2 = mrzLines[1]
            // Check if this number appears in line 2 after KEN (document number)
            const line2Match = mrzLine2.match(/KEN(\d+)/)
            if (line2Match && line2Match[1].includes(extractedId)) {
              isFromMrzLine2 = true
              console.log(`⚠️ Skipping ${extractedId} - appears to be document number from MRZ line 2`)
            }
          }
          
          if (!isFromMrzLine2) {
            idNumber = extractedId
            console.log(`✅ Extracted ID from text field: ${idNumber}`)
            break
          }
        }
      }
    }
  }
  
  // Last resort: Look for standalone 8-9 digit numbers (but be very careful)
  if (!idNumber) {
    // Find all 8-9 digit numbers
    const allNumbers = [...ocrText.matchAll(/\b(\d{8,9})\b/g)]
    
    // If we have MRZ lines, collect numbers from line 2 to exclude them
    const mrzLine2Numbers = new Set()
    if (mrzLines.length >= 2) {
      const mrzLine2 = mrzLines[1]
      // Extract all numbers from line 2 (these are document numbers, not ID)
      const line2Numbers = [...mrzLine2.matchAll(/\d{8,9}/g)]
      line2Numbers.forEach(m => mrzLine2Numbers.add(m[0]))
      console.log(`📋 Numbers found in MRZ line 2 (to exclude):`, Array.from(mrzLine2Numbers))
    }
    
    // Filter out numbers that look like dates or other patterns
    for (const match of allNumbers) {
      const num = match[1]
      
      // Skip if it looks like a date (starts with 0-3, then 0-1, then 0-9)
      if (/^[0-3][0-1][0-9]/.test(num)) {
        continue
      }
      
      // ALWAYS skip if it's in MRZ line 2 (document numbers, NOT ID)
      if (mrzLine2Numbers.has(num)) {
        console.log(`⚠️ Skipping number ${num} - found in MRZ line 2 (document number, not ID)`)
        continue
      }
      
      // Also check if it appears after KEN in line 2
      if (mrzLines.length >= 2) {
        const mrzLine2 = mrzLines[1]
        const kenIndex = mrzLine2.indexOf('KEN')
        const numIndex = mrzLine2.indexOf(num)
        if (kenIndex !== -1 && numIndex > kenIndex) {
          console.log(`⚠️ Skipping number ${num} - appears after KEN in MRZ line 2`)
          continue
        }
      }
      
      // Skip if it's in MRZ line 1 but after the ID position (other data)
      if (mrzLines.length >= 1) {
        const mrzLine1 = mrzLines[0]
        // If the number appears after position 20 in line 1, it's likely not the ID
        const numIndex = mrzLine1.indexOf(num)
        if (numIndex > 20) {
          console.log(`⚠️ Skipping number ${num} - appears too late in MRZ line 1 (position ${numIndex})`)
          continue
        }
      }
      
      idNumber = num
      console.log(`✅ Extracted ID from standalone pattern: ${idNumber}`)
      break
    }
  }
  
  // Final validation: If entered ID was provided and found in text, prioritize it
  if (enteredIdNumber && !idNumber) {
    const cleanEnteredId = enteredIdNumber.replace(/\s+/g, '').trim()
    if (ocrText.includes(cleanEnteredId)) {
      // Check if it's not in MRZ line 2 (document number area)
      const mrzLines = identifyMrzLines(lines)
      let isInMrzLine2 = false
      if (mrzLines.length >= 2) {
        const mrzLine2 = mrzLines[1]
        const kenIndex = mrzLine2.indexOf('KEN')
        const enteredIdIndex = mrzLine2.indexOf(cleanEnteredId)
        // If it appears after KEN in line 2, it's likely a document number, not ID
        if (kenIndex !== -1 && enteredIdIndex > kenIndex) {
          isInMrzLine2 = true
        }
      }
      
      if (!isInMrzLine2) {
        idNumber = cleanEnteredId
        console.log(`✅ Using entered ID "${cleanEnteredId}" - found in OCR text (not in MRZ line 2)`)
      }
    }
  }
  
  // Final validation: If we extracted an ID, log it for debugging
  if (idNumber) {
    console.log(`📋 Final extracted ID number: ${idNumber}`)
    if (enteredIdNumber) {
      const cleanEnteredId = enteredIdNumber.replace(/\s+/g, '').trim()
      if (idNumber !== cleanEnteredId) {
        console.log(`⚠️ WARNING: Extracted ID "${idNumber}" does not match entered ID "${cleanEnteredId}"`)
      }
    }
  } else {
    console.log(`⚠️ No ID number extracted from OCR text`)
  }
  
  // Extract Name from MRZ (after ID extraction) - PRIORITY 1
  // Improved parsing based on actual Kenyan ID card formats
  if (mrzLines.length >= 3) {
    // MRZ format examples:
    // - GICHERU<<MALCOM<MURIUKI<<<<<<< (SURNAME<<GIVEN1<GIVEN2)
    // - GEORGE<RUCHATHI<KINYANJUI<<<<< (GIVEN1<GIVEN2<SURNAME - alternative format)
    const mrzLine3 = mrzLines[2]
    
    let extractedName = null
    
    // Pattern 1: Double << separator (most common format)
    // Format: SURNAME<<GIVEN1<GIVEN2<<<<<<<
    const doubleSeparatorMatch = mrzLine3.match(/^([A-Z]{4,})<<([A-Z<]+)/)
    if (doubleSeparatorMatch) {
      const surname = doubleSeparatorMatch[1]
      const givenPart = doubleSeparatorMatch[2]
      // Split given names by single < and filter valid parts
      const givenNames = givenPart.split('<').filter(part => part.trim() && part.length >= 3)
      
      if (givenNames.length > 0) {
        // Format: Given Names + Surname (e.g., "Malcom Muriuki Gicheru")
        extractedName = `${givenNames.join(' ')} ${surname}`
        console.log(`✅ Extracted name from MRZ (double separator): ${extractedName}`)
      }
    }
    
    // Pattern 2: Single < separator with 3 parts
    // Could be SURNAME<GIVEN1<GIVEN2 or GIVEN1<GIVEN2<SURNAME
    if (!extractedName) {
      const nameParts = mrzLine3.split('<').filter(part => part.trim() && part.length >= 3)
      
      if (nameParts.length >= 3) {
        // Analyze structure: surname is usually longest or in specific position
        const lengths = nameParts.map(p => p.length)
        const maxLength = Math.max(...lengths)
        const maxIndex = lengths.indexOf(maxLength)
        
        // In Kenyan IDs, surname is often:
        // 1. First position and longest (SURNAME<GIVEN1<GIVEN2)
        // 2. Last position and longest (GIVEN1<GIVEN2<SURNAME)
        if (maxIndex === 0 && maxLength > nameParts[1].length + 1) {
          // First is surname
          extractedName = `${nameParts[1]} ${nameParts[2]} ${nameParts[0]}`
        } else if (maxIndex === 2 && maxLength > nameParts[1].length + 1) {
          // Last is surname
          extractedName = `${nameParts[0]} ${nameParts[1]} ${nameParts[2]}`
        } else {
          // Default: assume first is surname (most common)
          extractedName = `${nameParts[1]} ${nameParts[2]} ${nameParts[0]}`
        }
        console.log(`✅ Extracted name from MRZ (3 parts): ${extractedName}`)
      } else if (nameParts.length === 2) {
        // 2 parts: usually SURNAME<GIVEN or GIVEN<SURNAME
        // Check length - longer is usually surname
        if (nameParts[0].length > nameParts[1].length + 2) {
          extractedName = `${nameParts[1]} ${nameParts[0]}` // Given + Surname
        } else {
          extractedName = `${nameParts[0]} ${nameParts[1]}` // Given + Surname
        }
        console.log(`✅ Extracted name from MRZ (2 parts): ${extractedName}`)
      }
    }
    
    if (extractedName) {
      // Format properly: Capitalize first letter of each word
      extractedName = extractedName.split(/\s+/).map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join(' ')
      
      // Validate the extracted name
      if (isValidName(extractedName)) {
        fullName = extractedName
        console.log(`✅ Final extracted name from MRZ: ${fullName}`)
      } else {
        console.log(`⚠️ Extracted name failed validation: ${extractedName}`)
      }
    }
  }
  
  // If MRZ didn't work, try "Surname:" and "Given Name:" fields (PRIORITY 2)
  if (!fullName) {
    // Kenyan IDs have separate "Surname:" and "Given Name:" fields on front
    // Make patterns more flexible to handle OCR errors, rotation, and various formats
    
    // More robust patterns that handle OCR errors
    const surnamePatterns = [
      /surname\s*:?\s*([A-Z]{3,}[A-Z\s]*?)(?:\n|given|date|sex|id|number|$)/i,
      /surname\s*:?\s*([A-Z]{4,})/i,  // Just get the word after "Surname:"
      /surname[:\s]+([A-Z]{4,})/i,  // Handle missing colon or extra spaces
      /surname[:\s]*([A-Z]{4,8})/i,  // More specific length
    ]
    
    const givenNamePatterns = [
      /given\s*name\s*:?\s*([A-Z]{3,}[A-Z\s]*?)(?:\n|date|sex|id|number|$)/i,
      /given\s*name\s*:?\s*([A-Z]{3,}\s+[A-Z]{3,})/i,  // Expect at least 2 words
      /given[:\s]+name[:\s]+([A-Z]{4,}\s+[A-Z]{4,})/i,  // Handle OCR errors
      /given[:\s]*name[:\s]*([A-Z]{4,}\s+[A-Z]{4,})/i,  // More flexible spacing
    ]
    
    let surname = null
    let givenName = null
    
    // Try to extract surname with multiple patterns
    for (const pattern of surnamePatterns) {
      const matches = [...ocrText.matchAll(new RegExp(pattern.source, 'gi'))]
      for (const match of matches) {
        const extracted = match[1].trim().toUpperCase()
        // Clean up: remove common OCR errors and non-letter characters
        const cleaned = extracted.replace(/[^A-Z\s]/g, '').trim()
        // Validate: should be 4-12 characters, not blacklisted ID card words
        if (cleaned.length >= 4 && cleaned.length <= 12 && 
            !containsBlacklistedText(cleaned)) {
          surname = cleaned
          console.log(`✅ Found surname: ${surname}`)
          break
        }
      }
      if (surname) break
    }
    
    // Try to extract given name with multiple patterns
    for (const pattern of givenNamePatterns) {
      const matches = [...ocrText.matchAll(new RegExp(pattern.source, 'gi'))]
      for (const match of matches) {
        const extracted = match[1].trim().toUpperCase()
        // Clean up: remove common OCR errors
        const cleaned = extracted.replace(/[^A-Z\s]/g, '').trim()
        // Validate: should be at least 5 characters (2 words minimum), not blacklisted ID card words
        if (cleaned.length >= 5 && cleaned.split(/\s+/).length >= 1 &&
            !containsBlacklistedText(cleaned)) {
          givenName = cleaned
          console.log(`✅ Found given name: ${givenName}`)
          break
        }
      }
      if (givenName) break
    }
    
    // If we have both, combine them
    if (surname && givenName) {
      // Combine: Given Name + Surname (e.g., "MALCOM MURIUKI GICHERU" -> "Malcom Muriuki Gicheru")
      const combinedName = `${givenName} ${surname}`
      const normalizedName = combinedName.split(/\s+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
      
      if (isValidName(normalizedName)) {
        fullName = normalizedName
        console.log(`✅ Extracted name from Surname/Given Name fields: ${fullName}`)
      }
    } else if (surname) {
      // If we only have surname, try to find given name nearby
      const surnameIndex = ocrText.toUpperCase().indexOf(surname)
      if (surnameIndex !== -1) {
        // Look for text before surname that could be given name
        const beforeContext = ocrText.substring(Math.max(0, surnameIndex - 100), surnameIndex)
        const givenNameMatch = beforeContext.match(/([A-Z]{4,}\s+[A-Z]{4,})/)
        if (givenNameMatch) {
          const combinedName = `${givenNameMatch[1]} ${surname}`
          const normalizedName = combinedName.split(/\s+/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')
          if (isValidName(normalizedName)) {
            fullName = normalizedName
            console.log(`✅ Extracted name from context before surname: ${fullName}`)
          }
        }
      }
    } else if (givenName) {
      // If we only have given name, try to find surname nearby
      const givenNameIndex = ocrText.toUpperCase().indexOf(givenName)
      if (givenNameIndex !== -1) {
        // Look for text after given name that could be surname
        const afterContext = ocrText.substring(givenNameIndex + givenName.length, givenNameIndex + givenName.length + 50)
        const surnameMatch = afterContext.match(/([A-Z]{4,8})/)
        if (surnameMatch) {
          const combinedName = `${givenName} ${surnameMatch[1]}`
          const normalizedName = combinedName.split(/\s+/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')
          if (isValidName(normalizedName)) {
            fullName = normalizedName
            console.log(`✅ Extracted name from context after given name: ${fullName}`)
          }
        }
      }
    }
  }
  
  // If still not found, try "FULL NAMES:" field (PRIORITY 3)
  if (!fullName) {
    const namePatterns = [
      /full\s*names?\s*:?\s*([A-Z][A-Z\s]{5,50}?)(?:\n|date|birth|sex|id|$)/i,  // After "FULL NAMES:" label, stop at next field
      /full\s*names?\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,  // Mixed case
    ]
    
    for (const pattern of namePatterns) {
      const match = ocrText.match(pattern)
      if (match) {
        const name = match[1].trim()
        // Clean up: remove common OCR errors and extra spaces
        let cleanedName = name.replace(/\s+/g, ' ').trim()
        
        // Filter out common non-name words and validate it looks like a name
        const normalizedName = cleanedName.split(/\s+/).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
        
        if (!containsBlacklistedText(name) && isValidName(normalizedName)) {
          fullName = normalizedName
          console.log(`✅ Extracted name from FULL NAMES field: ${fullName}`)
          break
        }
      }
    }
  }
  
  // Last resort: Look for all caps name patterns (but be very strict) (PRIORITY 4)
  if (!fullName) {
    // Exclude blacklisted ID card text and patterns
    const excludePatterns = [
      /^IDK(EN|YA)/,  // MRZ identifiers
      /\d{8,9}/,  // ID numbers
      /^\d{6}[MF]/,  // MRZ date patterns
    ]
    
    const allCapsPattern = /([A-Z]{4,}\s+[A-Z]{4,}(?:\s+[A-Z]{4,})?)/g
    const matches = [...ocrText.matchAll(allCapsPattern)]
    
    for (const match of matches) {
      const name = match[1].trim()
      
      // Skip if matches exclusion patterns
      let shouldExclude = false
      for (const excludePattern of excludePatterns) {
        if (excludePattern.test(name)) {
          shouldExclude = true
          break
        }
      }
      
      if (shouldExclude) continue
      
      // Validate it's not a location or other text
      const normalizedName = name.split(/\s+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
      
      if (isValidName(normalizedName)) {
        fullName = normalizedName
        console.log(`✅ Extracted name from all caps pattern: ${fullName}`)
        break
      }
    }
  }
  
  // Extract Date of Birth - Look for "DATE OF BIRTH" or date patterns
  const dobPatterns = [
    /date\s*of\s*birth\s*:?\s*(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/i,
    /(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/ // General date pattern
  ]
  
  for (const pattern of dobPatterns) {
    const match = ocrText.match(pattern)
    if (match) {
      let dateStr = match[1]
      // Convert to YYYY-MM-DD format
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
  
  // Extract Sex/Gender
  const sexMatch = ocrText.match(/sex\s*:?\s*(male|female|m|f)/i)
  if (sexMatch) {
    sex = sexMatch[1].toUpperCase()
  }
  
  // Extract District of Birth
  const districtMatch = ocrText.match(/district\s*of\s*birth\s*:?\s*([A-Z\s]+)/i)
  if (districtMatch) {
    districtOfBirth = districtMatch[1].trim()
  }
  
  // Extract Place of Issue
  const placeMatch = ocrText.match(/place\s*of\s*issue\s*:?\s*([A-Z\s]+)/i)
  if (placeMatch) {
    placeOfIssue = placeMatch[1].trim()
  }
  
  // Extract Date of Issue
  const issueDateMatch = ocrText.match(/date\s*of\s*issue\s*:?\s*(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/i)
  if (issueDateMatch) {
    dateOfIssue = issueDateMatch[1]
  }
  
  // ID number should already be extracted from MRZ above
  // This section is now redundant but kept for backward compatibility
  
  // Extract DOB from MRZ if not found yet (prioritize MRZ)
  if (mrzLines.length >= 2) {
    // MRZ format: 0606022M3412053KEN705681714008
    // DOB is at the start: 060602 = 02.06.2006 (YYMMDD)
    const mrzLine2 = mrzLines[1]
    // Extract DOB from MRZ (YYMMDD format at the start)
    const mrzDobMatch = mrzLine2.match(/^(\d{6})[MF]/)
    if (mrzDobMatch && !dateOfBirth) {
      const dobStr = mrzDobMatch[1]
      const year = dobStr.substring(0, 2)
      const month = dobStr.substring(2, 4)
      const day = dobStr.substring(4, 6)
      const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`
      dateOfBirth = `${fullYear}-${month}-${day}`
    }
  }
  
  return {
    fullName,
    idNumber,
    dateOfBirth,
    sex,
    districtOfBirth,
    placeOfIssue,
    dateOfIssue,
    rawText: ocrText
  }
}
