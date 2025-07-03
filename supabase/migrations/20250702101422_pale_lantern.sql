/*
  # Fix RLS policies for event_players table

  1. Security Updates
    - Drop existing restrictive policies that may be blocking legitimate operations
    - Add comprehensive policies for INSERT and DELETE operations
    - Ensure admins and committee members can manage event players
    - Allow coaches to manage players for their team events
    - Maintain read access for authenticated users

  2. Policy Changes
    - Allow INSERT for admins, committee, and coaches (for their teams)
    - Allow DELETE for admins, committee, and coaches (for their teams)
    - Maintain existing SELECT policies
    - Ensure policies work with the current application flow
*/

-- Drop existing policies to recreate them with proper permissions
DROP POLICY IF EXISTS "Admins and committee can manage event players" ON event_players;
DROP POLICY IF EXISTS "Coaches can manage players for their team events" ON event_players;
DROP POLICY IF EXISTS "Authenticated users can read event players" ON event_players;
DROP POLICY IF EXISTS "Players can view their own event assignments" ON event_players;
DROP POLICY IF EXISTS "Public can read event players" ON event_players;

-- Create comprehensive INSERT policy for event_players
CREATE POLICY "Allow INSERT for authorized users" ON event_players
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow admins and committee members to insert any event player
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'committee')
    )
    OR
    -- Allow coaches to insert players for events where their team is participating
    EXISTS (
      SELECT 1 FROM users u
      JOIN teams t ON t.coach_id = u.id
      JOIN event_teams et ON et.team_id = t.id
      WHERE u.id = auth.uid() 
      AND u.role = 'coach'
      AND et.event_id = event_players.event_id
    )
  );

-- Create comprehensive DELETE policy for event_players
CREATE POLICY "Allow DELETE for authorized users" ON event_players
  FOR DELETE
  TO authenticated
  USING (
    -- Allow admins and committee members to delete any event player
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'committee')
    )
    OR
    -- Allow coaches to delete players for events where their team is participating
    EXISTS (
      SELECT 1 FROM users u
      JOIN teams t ON t.coach_id = u.id
      JOIN event_teams et ON et.team_id = t.id
      WHERE u.id = auth.uid() 
      AND u.role = 'coach'
      AND et.event_id = event_players.event_id
    )
  );

-- Create comprehensive SELECT policy for event_players
CREATE POLICY "Allow SELECT for all authenticated users" ON event_players
  FOR SELECT
  TO authenticated
  USING (true);

-- Create public SELECT policy for event_players (for public viewing of events)
CREATE POLICY "Allow public SELECT for event players" ON event_players
  FOR SELECT
  TO public
  USING (true);

-- Create policy for players to view their own assignments
CREATE POLICY "Players can view their own event assignments" ON event_players
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = event_players.player_id 
      AND p.user_id = auth.uid()
    )
  );

-- Ensure RLS is enabled on the event_players table
ALTER TABLE event_players ENABLE ROW LEVEL SECURITY;