// Database migration script to add missing columns
// Run with: node db/migrate.js

import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'voter_registration',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
})

async function migrate() {
  try {
    console.log('🔄 Starting database migration...')
    
    // Check if face_similarity column exists
    const checkFaceSimilarity = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='voters' AND column_name='face_similarity'
    `)
    
    if (checkFaceSimilarity.rows.length === 0) {
      console.log('➕ Adding face_similarity column...')
      await pool.query(`ALTER TABLE voters ADD COLUMN face_similarity REAL`)
      console.log('✅ face_similarity column added')
    } else {
      console.log('✅ face_similarity column already exists')
    }
    
    // Check if validation_errors column exists
    const checkValidationErrors = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='voters' AND column_name='validation_errors'
    `)
    
    if (checkValidationErrors.rows.length === 0) {
      console.log('➕ Adding validation_errors column...')
      await pool.query(`ALTER TABLE voters ADD COLUMN validation_errors JSONB`)
      console.log('✅ validation_errors column added')
    } else {
      console.log('✅ validation_errors column already exists')
    }
    
    // Remove unique constraint if it exists
    try {
      await pool.query(`ALTER TABLE voters DROP CONSTRAINT IF EXISTS voters_id_number_key`)
      console.log('✅ Removed unique constraint on id_number (if it existed)')
    } catch (e) {
      // Ignore if constraint doesn't exist
    }
    
    console.log('✅ Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  }
}

migrate()

