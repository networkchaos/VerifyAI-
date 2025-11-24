// Face Detection Service - Node.js wrapper for Python face detection models
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PYTHON_SCRIPT = path.join(__dirname, 'faceDetection.py')

/**
 * Available face detection models
 */
export const FACE_DETECTION_MODELS = {
  'yolov8-face': {
    name: 'YOLOv8 Face Detection',
    description: 'Ultra-fast, accurate face detection. Best overall performance.',
    requiresApiKey: false,
    requiresPython: true,
    pythonPackage: 'ultralytics',
  },
  'yolov8n-face': {
    name: 'YOLOv8 Nano Face',
    description: 'Lightweight, fastest model. Great for mobile/webcam.',
    requiresApiKey: false,
    requiresPython: true,
    pythonPackage: 'ultralytics',
  },
  'yolov8s-face': {
    name: 'YOLOv8 Small Face',
    description: 'More accurate than nano, still fast.',
    requiresApiKey: false,
    requiresPython: true,
    pythonPackage: 'ultralytics',
  },
  'deepface': {
    name: 'DeepFace (Recommended)',
    description: 'Best accuracy for face verification. Uses face embeddings for true similarity.',
    requiresApiKey: false,
    requiresPython: true,
    pythonPackage: 'deepface',
  },
  'insightface': {
    name: 'InsightFace',
    description: 'Modern, accurate face detection with embeddings. No TensorFlow dependency.',
    requiresApiKey: false,
    requiresPython: true,
    pythonPackage: 'insightface',
  },
  'mediapipe': {
    name: 'MediaPipe Face Detection',
    description: 'Lightweight, mobile-friendly. Good for simple apps.',
    requiresApiKey: false,
    requiresPython: true,
    pythonPackage: 'mediapipe',
  },
  'auto': {
    name: 'Auto (Best Available)',
    description: 'Automatically selects the best available model for face verification.',
    requiresApiKey: false,
    requiresPython: true,
    pythonPackage: 'deepface',
  },
}

/**
 * Check if Python is available
 */
const checkPythonAvailable = () => {
  return new Promise((resolve) => {
    const python = process.platform === 'win32' ? 'python' : 'python3'
    const check = spawn(python, ['--version'])
    
    check.on('close', (code) => {
      resolve(code === 0)
    })
    
    check.on('error', () => {
      resolve(false)
    })
  })
}

/**
 * Check if required Python package is installed
 */
const checkPythonPackage = async (packageName) => {
  return new Promise((resolve) => {
    const python = process.platform === 'win32' ? 'python' : 'python3'
    const check = spawn(python, ['-c', `import ${packageName}`])
    
    check.on('close', (code) => {
      resolve(code === 0)
    })
    
    check.on('error', () => {
      resolve(false)
    })
  })
}

/**
 * Run Python face detection script
 */
const runPythonScript = (args) => {
  return new Promise((resolve, reject) => {
    const python = process.platform === 'win32' ? 'python' : 'python3'
    
    const script = spawn(python, [PYTHON_SCRIPT, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    
    let stdout = ''
    let stderr = ''
    
    script.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    script.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    script.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim())
          resolve(result)
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error.message}`))
        }
      } else {
        reject(new Error(`Python script failed: ${stderr || stdout}`))
      }
    })
    
    script.on('error', (error) => {
      reject(new Error(`Failed to run Python script: ${error.message}. Make sure Python is installed.`))
    })
  })
}

/**
 * Detect faces in an image
 */
export const detectFaces = async (imagePath, model = 'yolov8-face') => {
  try {
    // Validate model
    if (!FACE_DETECTION_MODELS[model]) {
      throw new Error(`Unknown face detection model: ${model}`)
    }
    
    // Check Python availability
    const pythonAvailable = await checkPythonAvailable()
    if (!pythonAvailable) {
      throw new Error('Python is not available. Please install Python 3.8+ to use face detection models.')
    }
    
    // Run detection
    const result = await runPythonScript([
      '--action', 'detect',
      '--model', model,
      '--image', imagePath,
    ])
    
    return result
  } catch (error) {
    console.error('Face detection error:', error)
    return {
      face_count: 0,
      faces: [],
      model,
      error: error.message,
    }
  }
}

/**
 * Compare faces between ID and selfie images
 */
export const compareFaces = async (idImagePath, selfieImagePath, model = 'yolov8-face') => {
  try {
    // Validate model
    if (!FACE_DETECTION_MODELS[model]) {
      throw new Error(`Unknown face detection model: ${model}`)
    }
    
    // Check Python availability
    const pythonAvailable = await checkPythonAvailable()
    if (!pythonAvailable) {
      throw new Error('Python is not available. Please install Python 3.8+ to use face detection models.')
    }
    
    // Run comparison
    const result = await runPythonScript([
      '--action', 'compare',
      '--model', model,
      '--id-image', idImagePath,
      '--selfie-image', selfieImagePath,
    ])
    
    return result
  } catch (error) {
    console.error('Face comparison error:', error)
    return {
      similarity: 0,
      id_has_face: false,
      selfie_has_face: false,
      message: `Error comparing faces: ${error.message}`,
      model,
      error: error.message,
    }
  }
}

/**
 * Check if a face detection model is available
 */
export const isModelAvailable = async (model) => {
  if (!FACE_DETECTION_MODELS[model]) {
    return false
  }
  
  const modelInfo = FACE_DETECTION_MODELS[model]
  
  // Check Python
  const pythonAvailable = await checkPythonAvailable()
  if (!pythonAvailable) {
    return false
  }
  
  // Check Python package
  if (modelInfo.requiresPython && modelInfo.pythonPackage) {
    const packageAvailable = await checkPythonPackage(modelInfo.pythonPackage)
    return packageAvailable
  }
  
  return true
}

/**
 * Get available face detection models
 */
export const getAvailableModels = async () => {
  const pythonAvailable = await checkPythonAvailable()
  
  const models = Object.entries(FACE_DETECTION_MODELS).map(([id, info]) => ({
    id,
    name: info.name,
    description: info.description,
    requiresApiKey: info.requiresApiKey,
    requiresPython: info.requiresPython,
  }))
  
  // Check availability for each model
  const availableModels = []
  for (const model of models) {
    if (pythonAvailable) {
      const available = await isModelAvailable(model.id)
      availableModels.push({
        ...model,
        isAvailable: available,
      })
    } else {
      availableModels.push({
        ...model,
        isAvailable: false,
      })
    }
  }
  
  return availableModels
}

export default {
  detectFaces,
  compareFaces,
  isModelAvailable,
  getAvailableModels,
  FACE_DETECTION_MODELS,
}

