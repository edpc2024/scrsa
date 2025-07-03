/*
  # Complete SCRSA Sports Management Database Schema

  1. New Tables
    - `users` - System users with roles (admin, committee, coach, player)
    - `sports` - Available sports (Cricket, Volleyball, Football, etc.)
    - `teams` - Sports teams with gender categories
    - `players` - Player profiles with statistics
    - `player_teams` - Junction table for player-team relationships
    - `committee_members` - Committee positions and members
    - `events` - Sports events and competitions
    - `event_teams` - Junction table for event-team relationships
    - `performances` - Individual/team performance records
    - `player_stats` - Seasonal player statistics

  2. Security
    - Enable RLS on all tables
    - Role-based access policies
    - Secure data access based on user roles

  3. Features
    - Automatic timestamp updates
    - Performance tracking
    - Committee management
    - Event scheduling
*/

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'committee', 'coach', 'player');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE committee_position AS ENUM ('president', 'secretary', 'treasurer', 'executive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_category AS ENUM ('men', 'women', 'mixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('tournament', 'league', 'friendly', 'training');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create update timestamp function (replace if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'player',
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sports table
CREATE TABLE IF NOT EXISTS sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'team',
  icon text DEFAULT 'Trophy',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  sport_id uuid REFERENCES sports(id) ON DELETE CASCADE,
  gender gender_category NOT NULL,
  coach_id uuid REFERENCES users(id) ON DELETE SET NULL,
  founded_year integer NOT NULL,
  is_active boolean DEFAULT true,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  draws integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  position text,
  jersey_number integer,
  date_joined date NOT NULL,
  is_active boolean DEFAULT true,
  matches_played integer DEFAULT 0,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  draws integer DEFAULT 0,
  personal_best text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Player teams junction table
CREATE TABLE IF NOT EXISTS player_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  joined_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(player_id, team_id)
);

-- Committee members table
CREATE TABLE IF NOT EXISTS committee_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  position committee_position NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sport_id uuid REFERENCES sports(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  event_time time NOT NULL,
  location text NOT NULL,
  type event_type NOT NULL,
  status event_status DEFAULT 'scheduled',
  result text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event teams junction table
CREATE TABLE IF NOT EXISTS event_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, team_id)
);

-- Performances table
CREATE TABLE IF NOT EXISTS performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  score numeric,
  position integer,
  notes text,
  metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Player stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  sport_id uuid REFERENCES sports(id) ON DELETE CASCADE,
  season_year integer NOT NULL,
  stats jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(player_id, sport_id, season_year)
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_teams_sport_id ON teams(sport_id);
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_player_teams_player_id ON player_teams(player_id);
CREATE INDEX IF NOT EXISTS idx_player_teams_team_id ON player_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_user_id ON committee_members(user_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_position ON committee_members(position);
CREATE INDEX IF NOT EXISTS idx_events_sport_id ON events(sport_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_teams_event_id ON event_teams(event_id);
CREATE INDEX IF NOT EXISTS idx_event_teams_team_id ON event_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_performances_event_id ON performances(event_id);
CREATE INDEX IF NOT EXISTS idx_performances_player_id ON performances(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats(player_id);

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can read all profiles" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    DROP POLICY IF EXISTS "Admins can manage all users" ON users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Everyone can read sports" ON sports;
    DROP POLICY IF EXISTS "Admins can manage sports" ON sports;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Everyone can read teams" ON teams;
    DROP POLICY IF EXISTS "Admins and committee can manage teams" ON teams;
    DROP POLICY IF EXISTS "Coaches can update their teams" ON teams;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Everyone can read players" ON players;
    DROP POLICY IF EXISTS "Players can update own profile" ON players;
    DROP POLICY IF EXISTS "Admins and committee can manage players" ON players;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Everyone can read player teams" ON player_teams;
    DROP POLICY IF EXISTS "Admins and committee can manage player teams" ON player_teams;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Everyone can read committee members" ON committee_members;
    DROP POLICY IF EXISTS "Admins can manage committee members" ON committee_members;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Everyone can read events" ON events;
    DROP POLICY IF EXISTS "Admins and committee can manage events" ON events;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Everyone can read event teams" ON event_teams;
    DROP POLICY IF EXISTS "Admins and committee can manage event teams" ON event_teams;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Everyone can read performances" ON performances;
    DROP POLICY IF EXISTS "Admins, committee and coaches can manage performances" ON performances;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Everyone can read player stats" ON player_stats;
    DROP POLICY IF EXISTS "Admins, committee and coaches can manage player stats" ON player_stats;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create new policies with proper enum casting
-- Users policies
CREATE POLICY "Users can read all profiles" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'::user_role)
);

-- Sports policies
CREATE POLICY "Everyone can read sports" ON sports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sports" ON sports FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'::user_role)
);

-- Teams policies
CREATE POLICY "Everyone can read teams" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and committee can manage teams" ON teams FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'committee'::user_role]))
);
CREATE POLICY "Coaches can update their teams" ON teams FOR UPDATE TO authenticated USING (coach_id = auth.uid());

-- Players policies
CREATE POLICY "Everyone can read players" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Players can update own profile" ON players FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins and committee can manage players" ON players FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'committee'::user_role]))
);

-- Player teams policies
CREATE POLICY "Everyone can read player teams" ON player_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and committee can manage player teams" ON player_teams FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'committee'::user_role]))
);

-- Committee members policies
CREATE POLICY "Everyone can read committee members" ON committee_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage committee members" ON committee_members FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'::user_role)
);

-- Events policies
CREATE POLICY "Everyone can read events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and committee can manage events" ON events FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'committee'::user_role]))
);

-- Event teams policies
CREATE POLICY "Everyone can read event teams" ON event_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and committee can manage event teams" ON event_teams FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'committee'::user_role]))
);

-- Performances policies
CREATE POLICY "Everyone can read performances" ON performances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins, committee and coaches can manage performances" ON performances FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'committee'::user_role, 'coach'::user_role]))
);

-- Player stats policies
CREATE POLICY "Everyone can read player stats" ON player_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins, committee and coaches can manage player stats" ON player_stats FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'committee'::user_role, 'coach'::user_role]))
);

-- Drop existing triggers if they exist, then create new ones
DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
    DROP TRIGGER IF EXISTS update_players_updated_at ON players;
    DROP TRIGGER IF EXISTS update_committee_members_updated_at ON committee_members;
    DROP TRIGGER IF EXISTS update_events_updated_at ON events;
    DROP TRIGGER IF EXISTS update_performances_updated_at ON performances;
    DROP TRIGGER IF EXISTS update_player_stats_updated_at ON player_stats;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_committee_members_updated_at BEFORE UPDATE ON committee_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performances_updated_at BEFORE UPDATE ON performances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial sports data (safe with conflict handling)
INSERT INTO sports (name, category, icon) VALUES
  ('Cricket', 'team', 'Trophy'),
  ('Volleyball', 'team', 'Circle'),
  ('Football', 'team', 'Target'),
  ('Handball', 'team', 'Hand'),
  ('Athletics', 'individual', 'Zap'),
  ('Gymnastics', 'individual', 'Star')
ON CONFLICT (name) DO NOTHING;

-- Insert initial admin user (safe with conflict handling)
INSERT INTO users (email, name, role, is_active) VALUES
  ('admin@scrsa.com', 'System Administrator', 'admin', true)
ON CONFLICT (email) DO NOTHING;