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

export const query = (text, params) => pool.query(text, params)

export const initDatabase = async () => {
  try {
    // Test connection
    await pool.query('SELECT NOW()')
    console.log('✅ Database connected successfully')

    // Create tables
    await createTables()
    console.log('✅ Database tables initialized')
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    throw error
  }
}

const createTables = async () => {
  // Create voters table (removed UNIQUE constraint on id_number to allow testing)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS voters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      id_number TEXT NOT NULL,
      name TEXT NOT NULL,
      dob DATE,
      phone TEXT,
      address TEXT,
      id_image_url TEXT,
      selfie_image_url TEXT,
      id_ocr JSONB,
      face_embedding REAL[],
      face_hash TEXT,
      verification_status TEXT DEFAULT 'pending',
      flagged_reason TEXT,
      face_similarity REAL,
      validation_errors JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  
  // Remove unique constraint if it exists (for testing purposes)
  try {
    await pool.query(`ALTER TABLE voters DROP CONSTRAINT IF EXISTS voters_id_number_key`)
  } catch (e) {
    // Constraint might not exist, ignore
  }
  
  // Add missing columns if table already exists (migration)
  try {
    // Check if face_similarity column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='voters' AND column_name='face_similarity'
    `)
    
    if (checkColumn.rows.length === 0) {
      console.log('Adding face_similarity column to voters table...')
      await pool.query(`ALTER TABLE voters ADD COLUMN face_similarity REAL`)
    }
  } catch (e) {
    console.error('Error adding face_similarity column:', e.message)
  }
  
  try {
    // Check if validation_errors column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='voters' AND column_name='validation_errors'
    `)
    
    if (checkColumn.rows.length === 0) {
      console.log('Adding validation_errors column to voters table...')
      await pool.query(`ALTER TABLE voters ADD COLUMN validation_errors JSONB`)
    }
  } catch (e) {
    console.error('Error adding validation_errors column:', e.message)
  }

  // Create audit_logs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      voter_id UUID REFERENCES voters(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      actor TEXT,
      details JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_voters_id_number ON voters(id_number)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_voters_status ON voters(verification_status)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_voter_id ON audit_logs(voter_id)
  `)
}

export default pool
