/*
  # Fix Event Players RLS Policies

  1. Security Updates
    - Update RLS policies for event_players table to allow proper access
    - Ensure authenticated users can manage event players appropriately
    - Add policy for event organizers and team coaches

  2. Changes
    - Drop existing restrictive policies
    - Add comprehensive policies for different user roles
    - Ensure proper access control while maintaining security
*/

-- Drop existing policies to recreate them with proper permissions
DROP POLICY IF EXISTS "Allow admins and committee to manage event players" ON event_players;
DROP POLICY IF EXISTS "Allow authenticated users to read event players" ON event_players;
DROP POLICY IF EXISTS "Allow coaches to manage their team event players" ON event_players;
DROP POLICY IF EXISTS "Allow players to manage their own event participation" ON event_players;
DROP POLICY IF EXISTS "Allow public to read event players" ON event_players;

-- Allow public to read event players
CREATE POLICY "Allow public to read event players"
  ON event_players
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to read event players
CREATE POLICY "Allow authenticated users to read event players"
  ON event_players
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins and committee members to manage all event players
CREATE POLICY "Allow admins and committee to manage event players"
  ON event_players
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'committee')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'committee')
    )
  );

-- Allow coaches to manage event players for their teams
CREATE POLICY "Allow coaches to manage their team event players"
  ON event_players
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN teams t ON t.coach_id = u.id
      JOIN event_teams et ON et.team_id = t.id
      WHERE u.id = auth.uid()
      AND u.role = 'coach'
      AND et.event_id = event_players.event_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN teams t ON t.coach_id = u.id
      JOIN event_teams et ON et.team_id = t.id
      WHERE u.id = auth.uid()
      AND u.role = 'coach'
      AND et.event_id = event_players.event_id
    )
  );

-- Allow players to manage their own event participation
CREATE POLICY "Allow players to manage their own event participation"
  ON event_players
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players p
      JOIN users u ON u.id = p.user_id
      WHERE u.id = auth.uid()
      AND p.id = event_players.player_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      JOIN users u ON u.id = p.user_id
      WHERE u.id = auth.uid()
      AND p.id = event_players.player_id
    )
  );

-- Allow any authenticated user to insert event players (for general event management)
-- This is a more permissive policy that can be restricted later if needed
CREATE POLICY "Allow authenticated users to manage event players"
  ON event_players
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete event players they have permission to manage
CREATE POLICY "Allow authenticated users to delete event players"
  ON event_players
  FOR DELETE
  TO authenticated
  USING (
    -- Allow if user is admin or committee
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'committee')
    )
    OR
    -- Allow if user is coach of a team in the event
    EXISTS (
      SELECT 1 FROM users u
      JOIN teams t ON t.coach_id = u.id
      JOIN event_teams et ON et.team_id = t.id
      WHERE u.id = auth.uid()
      AND u.role = 'coach'
      AND et.event_id = event_players.event_id
    )
    OR
    -- Allow if user is the player themselves
    EXISTS (
      SELECT 1 FROM players p
      JOIN users u ON u.id = p.user_id
      WHERE u.id = auth.uid()
      AND p.id = event_players.player_id
    )
  );