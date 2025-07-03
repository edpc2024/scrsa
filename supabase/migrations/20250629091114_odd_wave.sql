/*
  # SCRSA Sports Management Database Schema

  1. New Tables
    - `users` - System users with roles (admin, committee, coach, player)
    - `committee_members` - Committee positions and terms
    - `sports` - Available sports in the association
    - `teams` - Sports teams with coaches and details
    - `players` - Player profiles and team assignments
    - `events` - Sports events, matches, and training sessions
    - `performances` - Individual and team performance records
    - `player_stats` - Detailed player statistics

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure data access based on user roles

  3. Features
    - User management with role-based access
    - Committee member tracking with terms
    - Team and player management
    - Event scheduling and results
    - Performance tracking and analytics
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'committee', 'coach', 'player');
CREATE TYPE committee_position AS ENUM ('president', 'secretary', 'treasurer', 'executive');
CREATE TYPE gender_category AS ENUM ('men', 'women', 'mixed');
CREATE TYPE event_type AS ENUM ('tournament', 'league', 'friendly', 'training');
CREATE TYPE event_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');

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

-- Player team assignments
CREATE TABLE IF NOT EXISTS player_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  joined_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(player_id, team_id)
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

-- Event team participants
CREATE TABLE IF NOT EXISTS event_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, team_id)
);

-- Performance records
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

-- Player statistics
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

-- Insert default sports
INSERT INTO sports (name, category, icon) VALUES
  ('Cricket', 'team', 'Trophy'),
  ('Volleyball', 'team', 'Circle'),
  ('Football', 'team', 'Target'),
  ('Handball', 'team', 'Hand'),
  ('Athletics', 'individual', 'Zap'),
  ('Gymnastics', 'individual', 'Star')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for committee_members table
CREATE POLICY "Everyone can read committee members"
  ON committee_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage committee members"
  ON committee_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for sports table
CREATE POLICY "Everyone can read sports"
  ON sports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sports"
  ON sports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin')
    )
  );

-- RLS Policies for teams table
CREATE POLICY "Everyone can read teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and committee can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'committee')
    )
  );

CREATE POLICY "Coaches can update their teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (coach_id = auth.uid());

-- RLS Policies for players table
CREATE POLICY "Everyone can read players"
  ON players FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and committee can manage players"
  ON players FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'committee')
    )
  );

CREATE POLICY "Players can update own profile"
  ON players FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for player_teams table
CREATE POLICY "Everyone can read player teams"
  ON player_teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and committee can manage player teams"
  ON player_teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'committee')
    )
  );

-- RLS Policies for events table
CREATE POLICY "Everyone can read events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and committee can manage events"
  ON events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'committee')
    )
  );

-- RLS Policies for event_teams table
CREATE POLICY "Everyone can read event teams"
  ON event_teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and committee can manage event teams"
  ON event_teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'committee')
    )
  );

-- RLS Policies for performances table
CREATE POLICY "Everyone can read performances"
  ON performances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins, committee and coaches can manage performances"
  ON performances FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'committee', 'coach')
    )
  );

-- RLS Policies for player_stats table
CREATE POLICY "Everyone can read player stats"
  ON player_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins, committee and coaches can manage player stats"
  ON player_stats FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'committee', 'coach')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_committee_members_user_id ON committee_members(user_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_position ON committee_members(position);
CREATE INDEX IF NOT EXISTS idx_teams_sport_id ON teams(sport_id);
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_player_teams_player_id ON player_teams(player_id);
CREATE INDEX IF NOT EXISTS idx_player_teams_team_id ON player_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_events_sport_id ON events(sport_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_teams_event_id ON event_teams(event_id);
CREATE INDEX IF NOT EXISTS idx_event_teams_team_id ON event_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_performances_event_id ON performances(event_id);
CREATE INDEX IF NOT EXISTS idx_performances_player_id ON performances(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats(player_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_committee_members_updated_at BEFORE UPDATE ON committee_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performances_updated_at BEFORE UPDATE ON performances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();