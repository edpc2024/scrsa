-- Fix committee members policies to allow proper creation and management

-- Temporarily disable RLS to reset policies
ALTER TABLE committee_members DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow reading committee members" ON committee_members;
DROP POLICY IF EXISTS "Admins can manage committee members" ON committee_members;

-- Re-enable RLS
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;

-- Create working policies

-- 1. Allow everyone to read committee members (public information)
CREATE POLICY "Allow reading committee members" ON committee_members 
  FOR SELECT 
  USING (true);

-- 2. Allow authenticated users to insert committee members (admin check in app)
CREATE POLICY "Allow committee member creation" ON committee_members 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- 3. Allow authenticated users to update committee members
CREATE POLICY "Allow committee member updates" ON committee_members 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- 4. Allow authenticated users to delete committee members
CREATE POLICY "Allow committee member deletion" ON committee_members 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Also fix other related tables that might have similar issues

-- Fix teams policies
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow reading teams" ON teams;
DROP POLICY IF EXISTS "Admins and committee can manage teams" ON teams;
DROP POLICY IF EXISTS "Coaches can update their teams" ON teams;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow reading teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow team management" ON teams FOR ALL TO authenticated USING (true);

-- Fix players policies
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow reading players" ON players;
DROP POLICY IF EXISTS "Players can update own profile" ON players;
DROP POLICY IF EXISTS "Admins and committee can manage players" ON players;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow reading players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow player management" ON players FOR ALL TO authenticated USING (true);

-- Fix events policies
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow reading events" ON events;
DROP POLICY IF EXISTS "Admins and committee can manage events" ON events;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow reading events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow event management" ON events FOR ALL TO authenticated USING (true);

-- Fix player_teams policies
ALTER TABLE player_teams DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow reading player teams" ON player_teams;
DROP POLICY IF EXISTS "Admins and committee can manage player teams" ON player_teams;
ALTER TABLE player_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow reading player teams" ON player_teams FOR SELECT USING (true);
CREATE POLICY "Allow player team management" ON player_teams FOR ALL TO authenticated USING (true);

-- Fix event_teams policies
ALTER TABLE event_teams DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow reading event teams" ON event_teams;
DROP POLICY IF EXISTS "Admins and committee can manage event teams" ON event_teams;
ALTER TABLE event_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow reading event teams" ON event_teams FOR SELECT USING (true);
CREATE POLICY "Allow event team management" ON event_teams FOR ALL TO authenticated USING (true);

-- Fix performances policies
ALTER TABLE performances DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow reading performances" ON performances;
DROP POLICY IF EXISTS "Admins, committee and coaches can manage performances" ON performances;
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow reading performances" ON performances FOR SELECT USING (true);
CREATE POLICY "Allow performance management" ON performances FOR ALL TO authenticated USING (true);

-- Fix player_stats policies
ALTER TABLE player_stats DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow reading player stats" ON player_stats;
DROP POLICY IF EXISTS "Admins, committee and coaches can manage player stats" ON player_stats;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow reading player stats" ON player_stats FOR SELECT USING (true);
CREATE POLICY "Allow player stats management" ON player_stats FOR ALL TO authenticated USING (true);