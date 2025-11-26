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

// Store the working Python command globally
let WORKING_PYTHON = null

/**
 * Check if Python is available and has required packages
 */
const checkPythonAvailable = () => {
  return new Promise((resolve) => {
    // If we already found a working Python, use it
    if (WORKING_PYTHON) {
      resolve(true)
      return
    }
    
    // Try multiple Python commands in order of preference
    // On Windows, also try common Python installation paths
    const pythonCommands = process.platform === 'win32' 
      ? [
          'python',
          'py',
          'python3',
          'C:\\Users\\HP\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
          'C:\\Users\\HP\\AppData\\Local\\Programs\\Python\\Python314\\python.exe',
        ]
      : ['python3', 'python']
    
    let tried = 0
    const tryNext = () => {
      if (tried >= pythonCommands.length) {
        console.error('❌ No Python interpreter found with OpenCV and NumPy installed')
        resolve(false)
        return
      }
      
      const python = pythonCommands[tried++]
      const check = spawn(python, ['--version'], {
        stdio: 'pipe',
      })
      
      let versionOutput = ''
      check.stdout?.on('data', (data) => {
        versionOutput += data.toString()
      })
      
      check.on('close', (code) => {
        if (code === 0) {
          // Also verify it can import cv2, numpy, and optionally deepface
          const importCheck = spawn(python, ['-c', 'import cv2; import numpy; import sys; print(sys.executable)'], {
            stdio: 'pipe',
          })
          
          let importOutput = ''
          importCheck.stdout?.on('data', (data) => {
            importOutput += data.toString()
          })
          
          importCheck.on('close', (importCode) => {
            if (importCode === 0) {
              // Store the working Python command for later use
              WORKING_PYTHON = python
              const pythonPath = importOutput.trim() || python
              console.log(`✅ Found working Python: ${python} at ${pythonPath}`)
              
              // Also check if DeepFace is available (optional, but log it)
              const deepfaceCheck = spawn(python, ['-c', 'import deepface'], {
                stdio: 'pipe',
              })
              deepfaceCheck.on('close', (dfCode) => {
                if (dfCode === 0) {
                  console.log(`✅ DeepFace is available in this Python environment`)
                } else {
                  console.log(`⚠️ DeepFace not available in this Python (optional)`)
                }
              })
              
              resolve(true)
            } else {
              console.log(`⚠️ Python ${python} found but cannot import cv2/numpy, trying next...`)
              tryNext()
            }
          })
          
          importCheck.on('error', () => {
            tryNext()
          })
        } else {
          tryNext()
        }
      })
      
      check.on('error', () => {
        tryNext()
      })
    }
    
    tryNext()
  })
}

/**
 * Check if required Python package is installed
 * Maps pip package names to their actual import names
 */
const checkPythonPackage = async (packageName) => {
  return new Promise((resolve) => {
    // Use the working Python command if available, otherwise try default
    const python = WORKING_PYTHON || (process.platform === 'win32' ? 'python' : 'python3')
    
    // Map pip package names to import names
    const importNameMap = {
      'opencv-python': 'cv2',
      'ultralytics': 'ultralytics',
      'deepface': 'deepface',
      'insightface': 'insightface',
      'mediapipe': 'mediapipe',
      'numpy': 'numpy',
      'scipy': 'scipy',
    }
    
    const importName = importNameMap[packageName] || packageName
    
    // Use pip show to check if package is installed (more reliable)
    const check = spawn(python, ['-m', 'pip', 'show', packageName], {
      stdio: 'pipe',
    })
    
    let stdout = ''
    let stderr = ''
    
    check.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    check.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    check.on('close', (code) => {
      // pip show returns 0 if package is found
      if (code === 0 && stdout.includes('Name:')) {
        resolve(true)
      } else {
        // Fallback: try importing the package
        const importCheck = spawn(python, ['-c', `import ${importName}`], {
          stdio: 'pipe',
        })
        
        importCheck.on('close', (importCode) => {
          resolve(importCode === 0)
        })
        
        importCheck.on('error', () => {
          resolve(false)
        })
      }
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
    // Use the working Python command if available, otherwise try default
    const python = WORKING_PYTHON || (process.platform === 'win32' ? 'python' : 'python3')
    
    if (!python) {
      reject(new Error('No working Python interpreter found. Please install Python 3.8+ and ensure opencv-python and numpy are installed.'))
      return
    }
    
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
          // Try to parse stdout as JSON
          const output = stdout.trim()
          if (!output) {
            // If stdout is empty, check stderr for JSON error response
            const stderrOutput = stderr.trim()
            if (stderrOutput) {
              try {
                const errorResult = JSON.parse(stderrOutput)
                resolve(errorResult) // Return error result as valid response
              } catch {
                reject(new Error(`Python script returned empty output. stderr: ${stderrOutput}`))
              }
            } else {
              reject(new Error('Python script returned empty output'))
            }
          } else {
            const result = JSON.parse(output)
            resolve(result)
          }
        } catch (error) {
          // If parsing fails, include both stdout and stderr in error
          const errorMsg = `Failed to parse Python output: ${error.message}`
          const details = `stdout: ${stdout.substring(0, 500)}\nstderr: ${stderr.substring(0, 500)}`
          reject(new Error(`${errorMsg}\n${details}`))
        }
      } else {
        // Non-zero exit code - try to parse stderr as JSON first
        let errorMessage = stderr || stdout || 'Unknown error'
        try {
          // Check if stderr contains JSON error response
          const errorResult = JSON.parse(stderr.trim())
          if (errorResult.error) {
            errorMessage = errorResult.error
          }
          // Return the error result so it can be handled gracefully
          resolve(errorResult)
        } catch {
          // Not JSON, use the raw error message
          reject(new Error(`Python script failed (exit code ${code}): ${errorMessage}`))
        }
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
      return {
        face_count: 0,
        faces: [],
        model,
        error: 'Python is not available. Please install Python 3.8+ to use face detection models.',
      }
    }
    
    // Run detection
    const result = await runPythonScript([
      '--action', 'detect',
      '--model', model,
      '--image', imagePath,
    ])
    
    // If result has an error, return it gracefully
    if (result.error) {
      console.error('Face detection Python error:', result.error)
      return {
        face_count: 0,
        faces: [],
        model: result.model || model,
        error: result.error,
      }
    }
    
    return result
  } catch (error) {
    console.error('Face detection error:', error)
    // Extract more detailed error message
    let errorMessage = error.message
    if (errorMessage.includes('Python script failed')) {
      // Try to extract the actual error from the message
      const match = errorMessage.match(/Python script failed[^:]*:\s*(.+)/)
      if (match) {
        errorMessage = match[1]
      }
    }
    
    return {
      face_count: 0,
      faces: [],
      model,
      error: errorMessage,
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
    if (!packageAvailable) {
      return false
    }
    
    // YOLOv8 models also require opencv-python and numpy
    if (model === 'yolov8-face' || model.startsWith('yolov8')) {
      const opencvAvailable = await checkPythonPackage('opencv-python')
      const numpyAvailable = await checkPythonPackage('numpy')
      return opencvAvailable && numpyAvailable
    }
    
    // DeepFace also requires opencv-python and numpy
    if (model === 'deepface' || model.includes('deepface')) {
      const opencvAvailable = await checkPythonPackage('opencv-python')
      const numpyAvailable = await checkPythonPackage('numpy')
      return opencvAvailable && numpyAvailable && packageAvailable
    }
    
    return packageAvailable
  }
  
  return true
}

/**
 * Get available face detection models
 * Filters out duplicate YOLOv8 variants and only shows the main one
 */
export const getAvailableModels = async () => {
  const pythonAvailable = await checkPythonAvailable()
  
  // Filter models - only show main YOLOv8 model, hide variants unless specifically needed
  const modelsToShow = Object.entries(FACE_DETECTION_MODELS)
    .filter(([id]) => {
      // Show main yolov8-face, but hide variants (yolov8n-face, yolov8s-face, etc.)
      // Variants are only useful for advanced users
      if (id.startsWith('yolov8') && id !== 'yolov8-face') {
        return false // Hide YOLOv8 variants
      }
      return true
    })
    .map(([id, info]) => ({
      id,
      name: info.name,
      description: info.description,
      requiresApiKey: info.requiresApiKey,
      requiresPython: info.requiresPython,
    }))
  
  // Check availability for each model
  const availableModels = []
  for (const model of modelsToShow) {
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
  
  // Sort models: available first, then by name
  availableModels.sort((a, b) => {
    if (a.isAvailable && !b.isAvailable) return -1
    if (!a.isAvailable && b.isAvailable) return 1
    return a.name.localeCompare(b.name)
  })
  
  return availableModels
}

export default {
  detectFaces,
  compareFaces,
  isModelAvailable,
  getAvailableModels,
  FACE_DETECTION_MODELS,
}

