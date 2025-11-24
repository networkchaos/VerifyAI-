import fs from 'fs/promises'
import { parseKenyanID } from './idParser.js'

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY
const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate'

// Note: fetch is available in Node.js 18+ globally
// For older versions, you may need to install node-fetch

// Check if Google Vision API is configured
const isGoogleVisionConfigured = () => {
  return !!GOOGLE_VISION_API_KEY && GOOGLE_VISION_API_KEY.trim() !== '' && GOOGLE_VISION_API_KEY !== 'your_google_vision_api_key_here'
}

// Extract text from image using Google Vision OCR via REST API
export const extractTextWithGoogleVision = async (imagePath) => {
  try {
    if (!isGoogleVisionConfigured()) {
      const error = new Error('Google Vision API key not configured. Set GOOGLE_VISION_API_KEY in .env')
      error.code = 'API_KEY_MISSING'
      throw error
    }

    // Read image file and convert to base64
    const imageBuffer = await fs.readFile(imagePath)
    const base64Image = imageBuffer.toString('base64')
    
    // Call Google Vision API
    const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(`Google Vision API error: ${response.status} - ${JSON.stringify(errorData)}`)
      error.code = 'API_ERROR'
      error.status = response.status
      throw error
    }

    const data = await response.json()
    
    // Extract text from response
    const textAnnotations = data.responses?.[0]?.textAnnotations || []
    const fullText = textAnnotations.length > 0 ? textAnnotations[0].description : ''
    
    // Parse Kenyan ID using specialized parser
    const parsed = parseKenyanID(fullText)
    
    return {
      text: fullText,
      idNumber: parsed.idNumber,
      name: parsed.fullName,
      dob: parsed.dateOfBirth,
      fullName: parsed.fullName,
      dateOfBirth: parsed.dateOfBirth,
      sex: parsed.sex,
      districtOfBirth: parsed.districtOfBirth,
      placeOfIssue: parsed.placeOfIssue,
      dateOfIssue: parsed.dateOfIssue,
      method: 'google-vision',
    }
  } catch (error) {
    console.error('Google Vision OCR Error:', error)
    throw error
  }
}

// Detect faces in image using Google Vision via REST API
export const detectFacesWithGoogleVision = async (imagePath) => {
  try {
    if (!isGoogleVisionConfigured()) {
      const error = new Error('Google Vision API key not configured. Set GOOGLE_VISION_API_KEY in .env')
      error.code = 'API_KEY_MISSING'
      throw error
    }

    // Read image file and convert to base64
    const imageBuffer = await fs.readFile(imagePath)
    const base64Image = imageBuffer.toString('base64')
    
    // Call Google Vision API for face detection
    const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'FACE_DETECTION',
                maxResults: 10,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(`Google Vision API error: ${response.status} - ${JSON.stringify(errorData)}`)
      error.code = 'API_ERROR'
      error.status = response.status
      throw error
    }

    const data = await response.json()
    const faceAnnotations = data.responses?.[0]?.faceAnnotations || []
    
    return {
      faceCount: faceAnnotations.length,
      faces: faceAnnotations.map(face => ({
        detected: true,
        boundingPoly: face.boundingPoly,
        landmarks: face.landmarks,
        detectionConfidence: face.detectionConfidence,
        joyLikelihood: face.joyLikelihood,
        sorrowLikelihood: face.sorrowLikelihood,
        angerLikelihood: face.angerLikelihood,
        surpriseLikelihood: face.surpriseLikelihood,
      })),
    }
  } catch (error) {
    console.error('Google Vision Face Detection Error:', error)
    throw error
  }
}

// Check if face exists in image
export const hasFaceInImage = async (imagePath) => {
  try {
    const faceData = await detectFacesWithGoogleVision(imagePath)
    return faceData.faceCount > 0
  } catch (error) {
    console.error('Face detection error:', error)
    return false
  }
}

// Compare faces between two images (basic implementation)
export const compareFaces = async (idImagePath, selfieImagePath) => {
  try {
    const idFaces = await detectFacesWithGoogleVision(idImagePath)
    const selfieFaces = await detectFacesWithGoogleVision(selfieImagePath)
    
    // Both images should have at least one face
    if (idFaces.faceCount === 0 || selfieFaces.faceCount === 0) {
      return {
        similarity: 0,
        idHasFace: idFaces.faceCount > 0,
        selfieHasFace: selfieFaces.faceCount > 0,
        message: idFaces.faceCount === 0 
          ? 'No face detected in ID image' 
          : 'No face detected in selfie',
      }
    }
    
    // For now, return a basic similarity score based on face detection confidence
    // In production, you would use face landmarks or embeddings for better comparison
    const idConfidence = idFaces.faces[0]?.detectionConfidence || 0
    const selfieConfidence = selfieFaces.faces[0]?.detectionConfidence || 0
    
    // Average confidence as similarity indicator
    const similarity = (idConfidence + selfieConfidence) / 2
    
    return {
      similarity,
      idHasFace: true,
      selfieHasFace: true,
      idConfidence,
      selfieConfidence,
      message: 'Faces detected in both images',
    }
  } catch (error) {
    console.error('Face comparison error:', error)
    return {
      similarity: 0,
      idHasFace: false,
      selfieHasFace: false,
      message: 'Error comparing faces',
    }
  }
}
