-- ============================================================
-- IBV Gold — User Verification Table + Storage Setup
-- Run this once in your Supabase SQL Editor
-- ============================================================

-- 1. Verification status enum
CREATE TYPE verification_status AS ENUM (
  'not_submitted',
  'pending',
  'under_review',
  'verified',
  'rejected'
);

-- 2. User verifications table
CREATE TABLE IF NOT EXISTS user_verifications (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status              verification_status DEFAULT 'not_submitted' NOT NULL,
  id_number           TEXT,
  id_document_url     TEXT,
  utility_bill_url    TEXT,
  submitted_at        TIMESTAMPTZ,
  reviewed_at         TIMESTAMPTZ,
  reviewer_notes      TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_verifications_updated_at ON user_verifications;
CREATE TRIGGER user_verifications_updated_at
  BEFORE UPDATE ON user_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. Row Level Security
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own verification" ON user_verifications;
DROP POLICY IF EXISTS "Users can insert own verification" ON user_verifications;
DROP POLICY IF EXISTS "Users can update own pending verification" ON user_verifications;

CREATE POLICY "Users can view own verification"
  ON user_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification"
  ON user_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending verification"
  ON user_verifications FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('not_submitted', 'rejected'));

-- 5. Storage bucket for verification documents (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false,
  10485760, -- 10 MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage RLS — users can only access their own folder (/{user_id}/...)
DROP POLICY IF EXISTS "Users can upload own verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can replace own verification docs" ON storage.objects;

CREATE POLICY "Users can upload own verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can replace own verification docs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
