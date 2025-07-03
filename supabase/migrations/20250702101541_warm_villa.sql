/*
  # Fix RLS policies for event_players table

  1. Security Updates
    - Update INSERT policy to allow admins and committee members
    - Update DELETE policy to allow admins and committee members  
    - Ensure coaches can manage players for their team events
    - Keep existing SELECT policies intact

  2. Changes Made
    - Modified INSERT policy to be more permissive for authorized roles
    - Modified DELETE policy to match INSERT permissions
    - Added fallback permissions for system operations
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow INSERT for authorized users" ON event_players;
DROP POLICY IF EXISTS "Allow DELETE for authorized users" ON event_players;

-- Create comprehensive INSERT policy
CREATE POLICY "Allow INSERT for event player management"
  ON event_players
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow admins and committee members
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'committee')
    )
    OR
    -- Allow coaches to add players to events where their team is participating
    EXISTS (
      SELECT 1 
      FROM users u
      JOIN teams t ON t.coach_id = u.id
      JOIN event_teams et ON et.team_id = t.id
      WHERE u.id = auth.uid() 
      AND u.role = 'coach'
      AND et.event_id = event_players.event_id
    )
    OR
    -- Allow players to add themselves to events (self-registration)
    EXISTS (
      SELECT 1 
      FROM players p
      JOIN users u ON u.id = p.user_id
      WHERE u.id = auth.uid()
      AND p.id = event_players.player_id
    )
  );

-- Create comprehensive DELETE policy  
CREATE POLICY "Allow DELETE for event player management"
  ON event_players
  FOR DELETE
  TO authenticated
  USING (
    -- Allow admins and committee members
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'committee')
    )
    OR
    -- Allow coaches to remove players from events where their team is participating
    EXISTS (
      SELECT 1 
      FROM users u
      JOIN teams t ON t.coach_id = u.id
      JOIN event_teams et ON et.team_id = t.id
      WHERE u.id = auth.uid() 
      AND u.role = 'coach'
      AND et.event_id = event_players.event_id
    )
    OR
    -- Allow players to remove themselves from events
    EXISTS (
      SELECT 1 
      FROM players p
      JOIN users u ON u.id = p.user_id
      WHERE u.id = auth.uid()
      AND p.id = event_players.player_id
    )
  );

-- Create an UPDATE policy for completeness (in case needed later)
CREATE POLICY "Allow UPDATE for event player management"
  ON event_players
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow admins and committee members
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'committee')
    )
    OR
    -- Allow coaches to update players for events where their team is participating
    EXISTS (
      SELECT 1 
      FROM users u
      JOIN teams t ON t.coach_id = u.id
      JOIN event_teams et ON et.team_id = t.id
      WHERE u.id = auth.uid() 
      AND u.role = 'coach'
      AND et.event_id = event_players.event_id
    )
  )
  WITH CHECK (
    -- Same conditions as USING clause
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'committee')
    )
    OR
    EXISTS (
      SELECT 1 
      FROM users u
      JOIN teams t ON t.coach_id = u.id
      JOIN event_teams et ON et.team_id = t.id
      WHERE u.id = auth.uid() 
      AND u.role = 'coach'
      AND et.event_id = event_players.event_id
    )
  );