-- ============================================================
-- IBV Gold — User Roles Table
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role       user_role DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Auto-update updated_at
DROP TRIGGER IF EXISTS user_roles_updated_at ON user_roles;
CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;

-- Everyone can read their own role (needed for frontend role checks)
CREATE POLICY "Users can read own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all roles
CREATE POLICY "Admins can read all roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles r
      WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
  );

-- Admins can update roles
CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles r
      WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
  );

-- 5. Admins can read ALL verifications (needed for admin dashboard)
DROP POLICY IF EXISTS "Admins can read all verifications" ON user_verifications;
DROP POLICY IF EXISTS "Admins can update any verification" ON user_verifications;

CREATE POLICY "Admins can read all verifications"
  ON user_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles r
      WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any verification"
  ON user_verifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles r
      WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
  );

-- 6. Admins can read all verification docs from storage
DROP POLICY IF EXISTS "Admins can read all verification docs" ON storage.objects;

CREATE POLICY "Admins can read all verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-documents' AND
    EXISTS (
      SELECT 1 FROM user_roles r
      WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
  );

-- ============================================================
-- To make a user an admin, run:
--   INSERT INTO user_roles (user_id, role)
--   VALUES ('<paste-user-uuid-here>', 'admin')
--   ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
-- Find user UUIDs in: Authentication → Users
-- ============================================================
