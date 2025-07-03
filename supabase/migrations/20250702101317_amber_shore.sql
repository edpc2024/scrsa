/*
  # Fix RLS policies for event_players table

  1. Security Updates
    - Drop existing restrictive policies on event_players table
    - Add comprehensive policies for different user roles
    - Allow admins and committee members to manage event players
    - Allow coaches to manage players for their teams' events
    - Allow players to view event assignments

  2. Policy Details
    - Admins can perform all operations
    - Committee members can perform all operations
    - Coaches can manage players for events involving their teams
    - All authenticated users can read event player assignments
    - Players can view their own event assignments
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow event player management" ON event_players;
DROP POLICY IF EXISTS "Allow reading event players" ON event_players;

-- Create comprehensive policies for event_players table

-- Policy 1: Allow admins and committee members full access
CREATE POLICY "Admins and committee can manage event players"
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

-- Policy 2: Allow coaches to manage players for events involving their teams
CREATE POLICY "Coaches can manage players for their team events"
  ON event_players
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'coach'
      AND EXISTS (
        SELECT 1 FROM event_teams et
        JOIN teams t ON et.team_id = t.id
        WHERE et.event_id = event_players.event_id
        AND t.coach_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'coach'
      AND EXISTS (
        SELECT 1 FROM event_teams et
        JOIN teams t ON et.team_id = t.id
        WHERE et.event_id = event_players.event_id
        AND t.coach_id = auth.uid()
      )
    )
  );

-- Policy 3: Allow all authenticated users to read event player assignments
CREATE POLICY "Authenticated users can read event players"
  ON event_players
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 4: Allow public read access for transparency
CREATE POLICY "Public can read event players"
  ON event_players
  FOR SELECT
  TO public
  USING (true);

-- Policy 5: Allow players to view their own event assignments
CREATE POLICY "Players can view their own event assignments"
  ON event_players
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = event_players.player_id
      AND p.user_id = auth.uid()
    )
  );