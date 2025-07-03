/*
  # Fix Event Players RLS Policies

  1. Security Updates
    - Update RLS policies for `event_players` table to allow proper INSERT and DELETE operations
    - Ensure admins and committee members can manage event players
    - Allow coaches to manage players for their team's events
    - Allow players to manage their own event participation

  2. Changes
    - Simplify and fix existing policies
    - Add missing policies for basic operations
    - Ensure policies work correctly with the application logic
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow DELETE for event player management" ON event_players;
DROP POLICY IF EXISTS "Allow INSERT for event player management" ON event_players;
DROP POLICY IF EXISTS "Allow SELECT for all authenticated users" ON event_players;
DROP POLICY IF EXISTS "Allow UPDATE for event player management" ON event_players;
DROP POLICY IF EXISTS "Allow public SELECT for event players" ON event_players;
DROP POLICY IF EXISTS "Players can view their own event assignments" ON event_players;

-- Create simplified and working policies

-- Allow public to read event players (for displaying event participants)
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

-- Allow admins and committee to manage all event players
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

-- Allow coaches to manage players for events their teams are participating in
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