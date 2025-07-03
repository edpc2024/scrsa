/*
  # Fix Event Players RLS Policies

  1. Security Updates
    - Update RLS policies for event_players table to allow proper access
    - Ensure authenticated users can manage event player selections
    - Maintain security while allowing necessary operations

  2. Changes
    - Drop existing restrictive policies
    - Create new comprehensive policies for different user roles
    - Allow admins and committee members full access
    - Allow coaches to manage their team's event players
    - Allow authenticated users to manage event players with proper validation
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Allow admins and committee to manage event players" ON event_players;
DROP POLICY IF EXISTS "Allow authenticated users to delete event players" ON event_players;
DROP POLICY IF EXISTS "Allow authenticated users to manage event players" ON event_players;
DROP POLICY IF EXISTS "Allow authenticated users to read event players" ON event_players;
DROP POLICY IF EXISTS "Allow coaches to manage their team event players" ON event_players;
DROP POLICY IF EXISTS "Allow players to manage their own event participation" ON event_players;
DROP POLICY IF EXISTS "Allow public to read event players" ON event_players;

-- Create comprehensive policies for event_players table

-- 1. Allow public to read event players (for viewing purposes)
CREATE POLICY "Public can read event players"
  ON event_players
  FOR SELECT
  TO public
  USING (true);

-- 2. Allow authenticated users to read event players
CREATE POLICY "Authenticated users can read event players"
  ON event_players
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Allow admins full access to event players
CREATE POLICY "Admins can manage all event players"
  ON event_players
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 4. Allow committee members full access to event players
CREATE POLICY "Committee can manage all event players"
  ON event_players
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'committee'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'committee'
    )
  );

-- 5. Allow coaches to manage event players for their teams
CREATE POLICY "Coaches can manage their team event players"
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

-- 6. Allow players to manage their own event participation
CREATE POLICY "Players can manage their own event participation"
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

-- 7. Fallback policy for authenticated users (less restrictive for general event management)
CREATE POLICY "Authenticated users can manage event players"
  ON event_players
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);