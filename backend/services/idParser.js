// Kenyan ID Parser - Extracts information from OCR text

// Validate if extracted name looks reasonable
const isValidName = (name) => {
  if (!name || name.length < 5) return false
  
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

export const parseKenyanID = (ocrText) => {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line)
  
  let fullName = null
  let idNumber = null
  let dateOfBirth = null
  let sex = null
  let districtOfBirth = null
  let placeOfIssue = null
  let dateOfIssue = null
  
  const fullText = ocrText.toLowerCase()
  
  // Extract ID Number - Look for "ID NUMBER:" or "SERIAL NUMBER:" or 8-9 digit numbers
  const idPatterns = [
    /id\s*number\s*:?\s*(\d{6,10})/i,
    /serial\s*number\s*:?\s*(\d{6,10})/i,
    /\b(\d{8,9})\b/ // 8-9 digit standalone number
  ]
  
  for (const pattern of idPatterns) {
    const match = ocrText.match(pattern)
    if (match) {
      const extractedId = match[1]
      // Validate it's a reasonable ID number (8 digits for Kenyan ID)
      if (extractedId.length >= 6 && extractedId.length <= 10) {
        idNumber = extractedId
        break
      }
    }
  }
  
  // Try MRZ (Machine Readable Zone) parsing FIRST - most reliable
  const mrzLines = lines.filter(line => line.length > 20 && /[<0-9A-Z]/.test(line))
  if (mrzLines.length >= 3) {
    // MRZ format: GEORGE<RUCHATHI<KINYANJUI<<<<<
    const mrzLine3 = mrzLines[2]
    // Look for name pattern with < separators
    const mrzNameMatch = mrzLine3.match(/([A-Z]+<[A-Z]+<[A-Z]+)/)
    if (mrzNameMatch) {
      const nameParts = mrzLine3.split('<').filter(part => part.trim() && part.length > 2)
      if (nameParts.length >= 2) {
        const extractedName = nameParts.map(part => 
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join(' ')
        // Validate the extracted name
        if (isValidName(extractedName)) {
          fullName = extractedName
        }
      }
    }
  }
  
  // If MRZ didn't work, try "FULL NAMES:" field
  if (!fullName) {
    const namePatterns = [
      /full\s*names?\s*:?\s*([A-Z][A-Z\s]{5,50})/i,  // After "FULL NAMES:" label
      /full\s*names?\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,  // Mixed case
    ]
    
    for (const pattern of namePatterns) {
      const match = ocrText.match(pattern)
      if (match) {
        const name = match[1].trim()
        // Filter out common non-name words and validate it looks like a name
        const normalizedName = name.split(/\s+/).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
        
        if (!name.match(/^(JAMHURI|REPUBLIC|KENYA|DISTRICT|DIVISION|LOCATION|NAIVASHA|MURANGA)/i) &&
            isValidName(normalizedName)) {
          fullName = normalizedName
          break
        }
      }
    }
  }
  
  // Last resort: Look for all caps name patterns (but be more strict)
  if (!fullName) {
    const allCapsPattern = /([A-Z]{3,}\s+[A-Z]{3,}(?:\s+[A-Z]{3,})?)/g
    const matches = [...ocrText.matchAll(allCapsPattern)]
    for (const match of matches) {
      const name = match[1].trim()
      // Validate it's not a location or other text
      const normalizedName = name.split(/\s+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
      
      if (!name.match(/^(JAMHURI|REPUBLIC|KENYA|DISTRICT|DIVISION|LOCATION|NAIVASHA|MURANGA|SERIAL|NUMBER|DATE|BIRTH|ISSUE|PLACE|HOLDER|SIGN|SEX|MALE|FEMALE)/i) &&
          isValidName(normalizedName)) {
        fullName = normalizedName
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
  
  // Extract ID number from MRZ if not found yet
  if (!idNumber && mrzLines.length >= 1) {
    // MRZ format: IDKYA2505181482<<3231<<<<<3231
    const mrzLine1 = mrzLines[0]
    // Extract ID number from MRZ (usually after country code)
    const mrzIdMatch = mrzLine1.match(/IDKYA(\d{6,10})/)
    if (mrzIdMatch) {
      idNumber = mrzIdMatch[1]
    }
    
    // Also try extracting from second MRZ line: 0208264M2011138<B039467381U<<8
    if (mrzLines.length >= 2 && !idNumber) {
      const mrzLine2 = mrzLines[1]
      // ID number is often in the second MRZ line after some characters
      const mrzIdMatch2 = mrzLine2.match(/[<B](\d{8,9})/)
      if (mrzIdMatch2) {
        idNumber = mrzIdMatch2[1]
      }
    }
  }
  
  // Extract DOB from MRZ if not found yet
  if (!dateOfBirth && mrzLines.length >= 2) {
    // MRZ format: 0208264M2011138<B039467381U<<8
    const mrzLine2 = mrzLines[1]
    // Extract DOB from MRZ (YYMMDD format)
    const mrzDobMatch = mrzLine2.match(/(\d{6})[MF]/)
    if (mrzDobMatch) {
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
