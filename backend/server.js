import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import registerRoutes from './routes/register.js'
import extractIdDataRoutes from './routes/extractIdData.js'
import ocrModelsRoutes from './routes/ocrModels.js'
import faceModelsRoutes from './routes/faceModels.js'
import verificationsRoutes from './routes/verifications.js'
import { initDatabase } from './db/init.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// Routes
app.use('/api/register', registerRoutes)
app.use('/api/extract-id-data', extractIdDataRoutes)
app.use('/api/ocr-models', ocrModelsRoutes)
app.use('/api/face-models', faceModelsRoutes)
app.use('/api/verifications', verificationsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  })
