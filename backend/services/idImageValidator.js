// ID Image Validator - Detects if uploaded image is actually an ID card vs selfie/portrait

import { detectFaces } from './faceDetectionService.js'

/**
 * Validate if uploaded image is an ID card (not a selfie/portrait)
 * @param {string} imagePath - Path to image file
 * @returns {Promise<Object>} Validation result with isIdCard flag and reason
 */
export const validateIdImage = async (imagePath) => {
  try {
    let sharp
    try {
      const sharpModule = await import('sharp')
      sharp = sharpModule.default
    } catch (error) {
      console.warn('Sharp not available, skipping ID validation')
      return { isIdCard: true, reason: 'Cannot validate (sharp not available)', confidence: 0.5 }
    }

    // Get image metadata
    const metadata = await sharp(imagePath).metadata()
    const { width, height } = metadata
    
    // Check 1: Aspect ratio - ID cards are typically landscape (wider than tall)
    const aspectRatio = width / height
    const isLandscape = aspectRatio > 1.2 // ID cards are usually 1.3-1.6 ratio
    
    // Check 2: Face detection - ID cards have small faces, selfies have large faces
    let faceInfo = null
    try {
      const faceResult = await detectFaces(imagePath, 'yolov8-face')
      if (faceResult && faceResult.face_count > 0) {
        faceInfo = {
          count: faceResult.face_count,
          faces: faceResult.faces || [],
        }
      }
    } catch (error) {
      console.warn('Face detection failed during validation:', error.message)
    }
    
    // Calculate face coverage (how much of image is covered by face)
    let faceCoverage = 0
    if (faceInfo && faceInfo.faces && faceInfo.faces.length > 0) {
      const totalFaceArea = faceInfo.faces.reduce((sum, face) => {
        // Face object might have width/height or bbox coordinates
        let faceWidth = face.width || (face.bbox && face.bbox[2] - face.bbox[0]) || 0
        let faceHeight = face.height || (face.bbox && face.bbox[3] - face.bbox[1]) || 0
        const faceArea = faceWidth * faceHeight
        return sum + faceArea
      }, 0)
      const imageArea = width * height
      faceCoverage = imageArea > 0 ? totalFaceArea / imageArea : 0
    }
    
    // Check 3: Image size - ID cards are usually larger files (more detail/text)
    const fs = await import('fs/promises')
    const stats = await fs.stat(imagePath)
    const fileSizeKB = stats.size / 1024
    
    // Scoring system
    let score = 0
    let reasons = []
    
    // Aspect ratio check (40% weight)
    if (isLandscape) {
      score += 0.4
      reasons.push('Landscape orientation (typical for ID cards)')
    } else {
      reasons.push('Portrait/square orientation (unusual for ID cards)')
    }
    
    // Face coverage check (40% weight)
    if (faceCoverage > 0.3) {
      // Large face coverage suggests selfie
      score -= 0.4
      reasons.push(`Large face detected (${(faceCoverage * 100).toFixed(0)}% coverage - suggests selfie)`)
    } else if (faceCoverage > 0.1) {
      // Medium face coverage - could be ID card
      score += 0.2
      reasons.push(`Small face detected (${(faceCoverage * 100).toFixed(0)}% coverage - typical for ID cards)`)
    } else if (faceCoverage === 0 && faceInfo) {
      // No face detected - might be ID card back or text-only
      score += 0.3
      reasons.push('No face detected (could be ID card back or text-only)')
    }
    
    // File size check (20% weight) - ID cards with text are usually larger
    if (fileSizeKB > 200) {
      score += 0.2
      reasons.push('Large file size (suggests detailed image with text)')
    } else if (fileSizeKB < 50) {
      score -= 0.1
      reasons.push('Small file size (might be low quality)')
    }
    
    // Final decision
    const isIdCard = score >= 0.3
    const confidence = Math.min(1.0, Math.max(0.0, Math.abs(score)))
    
    console.log(`🔍 ID Image Validation:`)
    console.log(`   Dimensions: ${width}x${height} (aspect ratio: ${aspectRatio.toFixed(2)})`)
    console.log(`   Face coverage: ${(faceCoverage * 100).toFixed(1)}%`)
    console.log(`   File size: ${fileSizeKB.toFixed(1)} KB`)
    console.log(`   Score: ${score.toFixed(2)}`)
    console.log(`   Is ID Card: ${isIdCard} (confidence: ${(confidence * 100).toFixed(0)}%)`)
    console.log(`   Reasons: ${reasons.join('; ')}`)
    
    return {
      isIdCard,
      confidence,
      reason: reasons.join('; '),
      details: {
        aspectRatio,
        isLandscape,
        faceCoverage,
        faceCount: faceInfo?.count || 0,
        fileSizeKB,
        score,
      },
    }
  } catch (error) {
    console.error('ID image validation error:', error)
    // Default to allowing (fail open) but warn
    return {
      isIdCard: true,
      confidence: 0.3,
      reason: `Validation failed: ${error.message}`,
    }
  }
}

export default {
  validateIdImage,
}

