/*
  # Fix User Creation and Authentication Policies

  1. Security Updates
    - Update RLS policies to allow proper user creation
    - Add policies for unauthenticated user registration
    - Fix admin user creation flow

  2. Policy Changes
    - Allow admins to create users
    - Allow initial admin user creation
    - Ensure proper authentication flow
*/

-- Temporarily disable RLS on users table to fix policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new, more permissive policies for users table
-- Allow reading all user profiles (for dropdowns, etc.)
CREATE POLICY "Allow reading all user profiles" ON users 
  FOR SELECT 
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- Allow admins to do everything with users
CREATE POLICY "Admins can manage all users" ON users 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'::user_role
    )
  );

-- Allow inserting users (for admin user creation and registration)
-- This is more permissive to allow the initial setup
CREATE POLICY "Allow user creation" ON users 
  FOR INSERT 
  WITH CHECK (
    -- Allow if no users exist (initial setup)
    NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin'::user_role)
    OR
    -- Allow if current user is admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'::user_role
    )
    OR
    -- Allow service role (for server-side operations)
    auth.role() = 'service_role'
  );

-- Update other table policies to be more permissive for reading
-- Sports policies (make reading public)
DROP POLICY IF EXISTS "Everyone can read sports" ON sports;
CREATE POLICY "Allow reading sports" ON sports FOR SELECT USING (true);

-- Teams policies (make reading public)
DROP POLICY IF EXISTS "Everyone can read teams" ON teams;
CREATE POLICY "Allow reading teams" ON teams FOR SELECT USING (true);

-- Players policies (make reading public)
DROP POLICY IF EXISTS "Everyone can read players" ON players;
CREATE POLICY "Allow reading players" ON players FOR SELECT USING (true);

-- Committee members policies (make reading public)
DROP POLICY IF EXISTS "Everyone can read committee members" ON committee_members;
CREATE POLICY "Allow reading committee members" ON committee_members FOR SELECT USING (true);

-- Events policies (make reading public)
DROP POLICY IF EXISTS "Everyone can read events" ON events;
CREATE POLICY "Allow reading events" ON events FOR SELECT USING (true);

-- Player teams policies (make reading public)
DROP POLICY IF EXISTS "Everyone can read player teams" ON player_teams;
CREATE POLICY "Allow reading player teams" ON player_teams FOR SELECT USING (true);

-- Event teams policies (make reading public)
DROP POLICY IF EXISTS "Everyone can read event teams" ON event_teams;
CREATE POLICY "Allow reading event teams" ON event_teams FOR SELECT USING (true);

-- Performances policies (make reading public)
DROP POLICY IF EXISTS "Everyone can read performances" ON performances;
CREATE POLICY "Allow reading performances" ON performances FOR SELECT USING (true);

-- Player stats policies (make reading public)
DROP POLICY IF EXISTS "Everyone can read player stats" ON player_stats;
CREATE POLICY "Allow reading player stats" ON player_stats FOR SELECT USING (true);

-- Ensure the admin user exists
INSERT INTO users (email, name, role, is_active) VALUES
  ('admin@scrsa.com', 'System Administrator', 'admin', true)
ON CONFLICT (email) DO NOTHING;