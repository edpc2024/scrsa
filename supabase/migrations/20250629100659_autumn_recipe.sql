/*
  # Fix Committee Members RLS Policies

  1. Security Updates
    - Drop existing problematic RLS policies on committee_members table
    - Create new RLS policies that allow proper CRUD operations
    - Allow authenticated users to manage committee members
    - Allow public read access to committee members

  2. Policy Details
    - INSERT: Allow authenticated users to create committee members
    - SELECT: Allow public read access
    - UPDATE: Allow authenticated users to update committee members  
    - DELETE: Allow authenticated users to delete committee members
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow committee member creation" ON committee_members;
DROP POLICY IF EXISTS "Allow reading committee members" ON committee_members;
DROP POLICY IF EXISTS "Allow committee member updates" ON committee_members;
DROP POLICY IF EXISTS "Allow committee member deletion" ON committee_members;

-- Create new RLS policies for committee_members table
CREATE POLICY "Enable insert for authenticated users"
  ON committee_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read access for all users"
  ON committee_members
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable update for authenticated users"
  ON committee_members
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON committee_members
  FOR DELETE
  TO authenticated
  USING (true);