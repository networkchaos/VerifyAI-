-- Voter Registration Database Schema

-- Create voters table
CREATE TABLE IF NOT EXISTS voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_number TEXT UNIQUE NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES voters(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_voters_id_number ON voters(id_number);
CREATE INDEX IF NOT EXISTS idx_voters_status ON voters(verification_status);
CREATE INDEX IF NOT EXISTS idx_voters_phone ON voters(phone);
CREATE INDEX IF NOT EXISTS idx_audit_voter_id ON audit_logs(voter_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_voters_updated_at BEFORE UPDATE ON voters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
