/*
  # Fix RLS policies for event_players table

  1. Security Updates
    - Drop existing restrictive policies on event_players table
    - Add proper policies for INSERT and DELETE operations
    - Allow authenticated users with admin, committee, or coach roles to manage event players
    - Allow all authenticated users to read event players

  2. Policy Details
    - INSERT policy: Allow admins, committee members, and coaches to add players to events
    - DELETE policy: Allow admins, committee members, and coaches to remove players from events
    - SELECT policy: Allow all authenticated users to view event players
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Allow event player management" ON event_players;
DROP POLICY IF EXISTS "Allow reading event players" ON event_players;

-- Create new policies with proper permissions

-- Allow reading event players for all authenticated users
CREATE POLICY "Allow reading event players"
  ON event_players
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow inserting event players for admins, committee members, and coaches
CREATE POLICY "Allow inserting event players"
  ON event_players
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'committee', 'coach')
    )
  );

-- Allow deleting event players for admins, committee members, and coaches
CREATE POLICY "Allow deleting event players"
  ON event_players
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'committee', 'coach')
    )
  );

-- Allow updating event players for admins, committee members, and coaches
CREATE POLICY "Allow updating event players"
  ON event_players
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'committee', 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'committee', 'coach')
    )
  );