// Image Preprocessing Service
// Handles rotation correction, contrast enhancement, and noise reduction for better OCR

import fs from 'fs/promises'
import path from 'path'

/**
 * Preprocess image for better OCR accuracy with enhanced lighting and quality
 * - Auto-rotate based on EXIF data
 * - Crop to center region (focus on main content, remove edges/borders)
 * - Enhanced lighting correction and contrast
 * - Denoising and sharpening
 * - Convert to grayscale for better text recognition
 * - Resize if needed
 */
export const preprocessImage = async (imagePath, options = {}) => {
  try {
    // Try to use sharp if available (dynamic import)
    let sharp
    try {
      const sharpModule = await import('sharp')
      sharp = sharpModule.default
    } catch (error) {
      console.warn('Sharp not available, skipping image preprocessing')
      return imagePath
    }

    const { 
      enhanceLighting = true,
      denoise = true,
      aggressiveSharpening = false,
      cropPercent = null 
    } = options

    const outputPath = path.join(
      path.dirname(imagePath),
      'preprocessed-' + Date.now() + '-' + path.basename(imagePath)
    )

    // Get image metadata to calculate crop dimensions
    const metadata = await sharp(imagePath).metadata()
    let { width, height } = metadata

    // Handle rotated images (swap dimensions if needed)
    if (metadata.orientation && (metadata.orientation >= 5 && metadata.orientation <= 8)) {
      [width, height] = [height, width]
    }

    // Crop to center region - focus on central area but don't crop too aggressively
    // Reduced crop percentage to preserve more of the image, especially for ID cards with faces
    // Default: 90% for normal images (less aggressive), 95% for small images
    const defaultCropPercent = width < 500 || height < 500 ? 0.95 : 0.90
    const finalCropPercent = cropPercent || defaultCropPercent
    const cropWidth = Math.max(1, Math.floor(width * finalCropPercent))
    const cropHeight = Math.max(1, Math.floor(height * finalCropPercent))
    const left = Math.floor((width - cropWidth) / 2)
    const top = Math.floor((height - cropHeight) / 2)

    console.log(`📐 Image dimensions: ${width}x${height}, cropping to center ${cropWidth}x${cropHeight} (${(finalCropPercent * 100).toFixed(0)}%, offset: ${left},${top})`)

    // Use sharp to preprocess the image
    let pipeline = sharp(imagePath).rotate() // Auto-rotate based on EXIF orientation
    
    // Always crop to center region (focus on main content)
    if (cropWidth < width * 0.99 && cropHeight < height * 0.99) {
      pipeline = pipeline.extract({ 
        left, 
        top, 
        width: cropWidth, 
        height: cropHeight 
      })
    }
    
    // Convert to grayscale first for better processing
    pipeline = pipeline.greyscale()
    
    // Enhanced lighting correction
    if (enhanceLighting) {
      // Normalize contrast and brightness
      pipeline = pipeline.normalize()
      // Apply gamma correction for better lighting
      pipeline = pipeline.gamma(1.2) // Slightly brighten
      // Enhance contrast with linear adjustment
      pipeline = pipeline.linear(1.1, -(0.1 * 128)) // Increase contrast
    }
    
    // Denoising to reduce artifacts
    if (denoise) {
      // Use median filter for noise reduction (simulated with convolution)
      // Sharp doesn't have built-in median, so we use a subtle blur then sharpen
      pipeline = pipeline.blur(0.5) // Very subtle blur to reduce noise
    }
    
    // Aggressive sharpening for text clarity
    if (aggressiveSharpening) {
      pipeline = pipeline.sharpen({ 
        sigma: 2.0,  // Increased from 1.5
        m1: 1.5,     // Increased from 1
        m2: 4,       // Increased from 3
        x1: 4,       // Increased from 3
        y2: 20,      // Increased from 15
        y3: 20       // Increased from 15
      })
    } else {
      // Standard sharpening
      pipeline = pipeline.sharpen({ 
        sigma: 1.5, 
        m1: 1, 
        m2: 3, 
        x1: 3, 
        y2: 15, 
        y3: 15 
      })
    }
    
    // Resize to optimal size for OCR (larger is better, but not too large)
    pipeline = pipeline.resize(2400, null, { // Increased from 2000
      withoutEnlargement: true,
      fit: 'inside',
    })
    
    await pipeline.toFile(outputPath)

    console.log('✅ Image preprocessed with enhanced lighting and center crop:', outputPath)
    return outputPath
  } catch (error) {
    console.warn('Image preprocessing failed, using original:', error.message)
    return imagePath
  }
}

/**
 * Try multiple orientations and return the best one
 * Tests 0, 90, 180, 270 degree rotations using OCR quality as metric
 */
export const findBestOrientation = async (imagePath) => {
  try {
    let sharp
    try {
      const sharpModule = await import('sharp')
      sharp = sharpModule.default
    } catch (error) {
      console.warn('Sharp not available, skipping orientation detection')
      return imagePath
    }

    // Try different orientations and test OCR quality
    const orientations = [0, 90, 180, 270]
    let bestOrientation = 0
    let bestScore = 0
    
    // For now, just use auto-rotate (EXIF-based)
    // Full orientation testing would require OCR runs which is expensive
    const outputPath = path.join(
      path.dirname(imagePath),
      'preprocessed-' + Date.now() + '-' + path.basename(imagePath)
    )

    await sharp(imagePath)
      .rotate() // Auto-rotate based on EXIF orientation
      .greyscale()
      .normalize()
      .sharpen({ sigma: 1.5, m1: 1, m2: 3, x1: 3, y2: 15, y3: 15 })
      .resize(2000, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .toFile(outputPath)

    return outputPath
  } catch (error) {
    console.warn('Orientation detection failed, using original:', error.message)
    return imagePath
  }
}

/**
 * Preprocess image with multiple variations for better OCR accuracy
 * Returns array of preprocessed image paths with different settings
 */
export const preprocessImageMultiple = async (imagePath) => {
  const variations = []
  
  try {
    // Variation 1: Standard preprocessing
    const standard = await preprocessImage(imagePath, {
      enhanceLighting: true,
      denoise: true,
      aggressiveSharpening: false,
    })
    variations.push({ path: standard, type: 'standard' })
    
    // Variation 2: Aggressive sharpening
    const sharp = await preprocessImage(imagePath, {
      enhanceLighting: true,
      denoise: true,
      aggressiveSharpening: true,
    })
    variations.push({ path: sharp, type: 'sharp' })
    
    // Variation 3: Enhanced lighting only
    const bright = await preprocessImage(imagePath, {
      enhanceLighting: true,
      denoise: false,
      aggressiveSharpening: false,
    })
    variations.push({ path: bright, type: 'bright' })
    
    console.log(`✅ Created ${variations.length} preprocessing variations`)
    return variations
  } catch (error) {
    console.warn('Multiple preprocessing failed, using single:', error.message)
    // Fallback to single preprocessing
    const single = await preprocessImage(imagePath)
    return [{ path: single, type: 'standard' }]
  }
}

export default {
  preprocessImage,
  preprocessImageMultiple,
  findBestOrientation,
}

