/*
  # Fix User Creation RLS Policies

  1. Problem Analysis
    - 406 error indicates RLS policy rejection
    - 401 error on select after insert suggests policy mismatch
    - Current policies are too restrictive for user creation

  2. Solution
    - Update RLS policies to allow proper user creation flow
    - Fix the chicken-and-egg problem with admin user creation
    - Ensure policies work for both authenticated and service operations

  3. Changes
    - Simplify user creation policy
    - Allow service role operations
    - Fix policy logic for initial admin creation
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow user creation" ON users;
DROP POLICY IF EXISTS "Allow reading all user profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create new, working policies

-- Allow reading all user profiles (needed for dropdowns, etc.)
CREATE POLICY "Allow reading all user profiles" ON users 
  FOR SELECT 
  TO public
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- Allow user creation with proper logic
CREATE POLICY "Allow user creation" ON users 
  FOR INSERT 
  TO public
  WITH CHECK (
    -- Always allow if no admin exists (initial setup)
    (NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin'::user_role))
    OR
    -- Allow if current user is admin
    (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'::user_role))
    OR
    -- Allow service role operations
    (auth.role() = 'service_role')
  );

-- Allow admins to manage all users (separate from creation)
CREATE POLICY "Admins can manage all users" ON users 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
    )
  );

-- Ensure we have demo users for testing
INSERT INTO users (email, name, role, is_active) VALUES
  ('admin@scrsa.com', 'System Administrator', 'admin', true),
  ('president@scrsa.com', 'Committee President', 'committee', true),
  ('coach@scrsa.com', 'Team Coach', 'coach', true),
  ('player@scrsa.com', 'Team Player', 'player', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;