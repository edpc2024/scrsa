/*
  # Fix Committee Members RLS Policies

  1. Security Updates
    - Update INSERT policy for committee_members to properly check admin role
    - Ensure the policy correctly references the authenticated user
    - Add proper error handling for edge cases

  2. Policy Changes
    - Recreate INSERT policy with correct admin role verification
    - Ensure consistent policy naming and structure
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow committee member creation" ON committee_members;

-- Create new INSERT policy with proper admin role check
CREATE POLICY "Allow committee member creation"
  ON committee_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
      AND users.is_active = true
    )
  );

-- Also ensure the UPDATE policy is consistent
DROP POLICY IF EXISTS "Allow committee member updates" ON committee_members;

CREATE POLICY "Allow committee member updates"
  ON committee_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
      AND users.is_active = true
    )
  );

-- Ensure DELETE policy is also consistent
DROP POLICY IF EXISTS "Allow committee member deletion" ON committee_members;

CREATE POLICY "Allow committee member deletion"
  ON committee_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
      AND users.is_active = true
    )
  );