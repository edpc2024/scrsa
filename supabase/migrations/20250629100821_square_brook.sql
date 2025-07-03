/*
  # Fix Committee Members RLS Policy

  1. Security Updates
    - Drop existing restrictive policies on committee_members table
    - Add new policies that allow proper CRUD operations for authenticated users
    - Ensure admin users can manage all committee members
    - Allow users to view committee member information

  2. Policy Changes
    - Allow authenticated users to insert committee members
    - Allow authenticated users to update committee members
    - Allow authenticated users to delete committee members
    - Allow public read access to committee member information
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON committee_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON committee_members;
DROP POLICY IF EXISTS "Enable read access for all users" ON committee_members;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON committee_members;

-- Create new policies with proper permissions
CREATE POLICY "Allow reading committee members"
  ON committee_members
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow committee member management"
  ON committee_members
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);