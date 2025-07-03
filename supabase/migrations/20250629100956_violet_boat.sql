/*
  # Fix Committee Members RLS Policies

  1. Problem
    - Current RLS policies on committee_members table are preventing inserts
    - Error: "new row violates row-level security policy for table committee_members"
    - Need to allow authenticated admin users to manage committee members

  2. Solution
    - Drop existing problematic policies
    - Create new policies that properly check user roles
    - Allow admins to manage committee members
    - Allow public read access for committee member information

  3. Changes
    - Fix INSERT policy to check for admin role
    - Fix UPDATE policy to check for admin role  
    - Fix DELETE policy to check for admin role
    - Keep SELECT policy open for public access
*/

-- Drop all existing policies on committee_members table
DROP POLICY IF EXISTS "Allow committee member management" ON committee_members;
DROP POLICY IF EXISTS "Allow reading committee members" ON committee_members;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON committee_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON committee_members;
DROP POLICY IF EXISTS "Enable read access for all users" ON committee_members;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON committee_members;
DROP POLICY IF EXISTS "Allow committee member creation" ON committee_members;
DROP POLICY IF EXISTS "Allow committee member updates" ON committee_members;
DROP POLICY IF EXISTS "Allow committee member deletion" ON committee_members;

-- Create new working policies

-- 1. Allow public read access to committee members (public information)
CREATE POLICY "Allow reading committee members"
  ON committee_members
  FOR SELECT
  TO public
  USING (true);

-- 2. Allow authenticated users with admin role to insert committee members
CREATE POLICY "Allow committee member creation"
  ON committee_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
    )
  );

-- 3. Allow authenticated users with admin role to update committee members
CREATE POLICY "Allow committee member updates"
  ON committee_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
    )
  );

-- 4. Allow authenticated users with admin role to delete committee members
CREATE POLICY "Allow committee member deletion"
  ON committee_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
    )
  );