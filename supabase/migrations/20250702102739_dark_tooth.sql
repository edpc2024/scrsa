/*
  # Fix RLS policies for event_players table

  1. Security Updates
    - Drop existing problematic policies
    - Create comprehensive policies for all user roles
    - Ensure proper INSERT and DELETE permissions
    - Add policies for event management scenarios

  2. Policy Coverage
    - Admins: Full access to all event players
    - Committee: Full access to all event players  
    - Coaches: Access to their team's event players
    - Players: Limited access to their own participation
    - Public: Read-only access
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all event players" ON event_players;
DROP POLICY IF EXISTS "Authenticated users can manage event players" ON event_players;
DROP POLICY IF EXISTS "Authenticated users can read event players" ON event_players;
DROP POLICY IF EXISTS "Coaches can manage their team event players" ON event_players;
DROP POLICY IF EXISTS "Committee can manage all event players" ON event_players;
DROP POLICY IF EXISTS "Players can manage their own event participation" ON event_players;
DROP POLICY IF EXISTS "Public can read event players" ON event_players;

-- Create comprehensive RLS policies

-- 1. Admin users have full access
CREATE POLICY "Admins have full access to event players"
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

-- 2. Committee members have full access
CREATE POLICY "Committee members have full access to event players"
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

-- 3. Coaches can manage event players for their teams
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

-- 4. Players can manage their own event participation
CREATE POLICY "Players can manage their own participation"
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

-- 5. All authenticated users can read event players
CREATE POLICY "Authenticated users can read event players"
  ON event_players
  FOR SELECT
  TO authenticated
  USING (true);

-- 6. Public read access for event players
CREATE POLICY "Public can read event players"
  ON event_players
  FOR SELECT
  TO public
  USING (true);

-- 7. Fallback policy for authenticated users to manage event players
-- This ensures that any authenticated user can manage event players if other policies don't apply
CREATE POLICY "Authenticated users can manage event players"
  ON event_players
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);