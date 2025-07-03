/*
  # Create Demo Users for SCRSA Sports Management

  1. New Demo Users
    - Admin user: admin@scrsa.com
    - Committee member: president@scrsa.com  
    - Coach: coach@scrsa.com
    - Player: player@scrsa.com

  2. Security
    - All users are active by default
    - Proper role assignments for testing different access levels

  3. Notes
    - These are demo users for testing purposes
    - Default password will be 'password' for all demo users
    - Users can be created through Supabase Auth dashboard or via the application
*/

-- Insert demo users into the users table
INSERT INTO users (email, name, role, is_active) VALUES
  ('admin@scrsa.com', 'System Administrator', 'admin', true),
  ('president@scrsa.com', 'Club President', 'committee', true),
  ('coach@scrsa.com', 'Head Coach', 'coach', true),
  ('player@scrsa.com', 'Demo Player', 'player', true)
ON CONFLICT (email) DO NOTHING;

-- Insert committee member record for the president
INSERT INTO committee_members (user_id, position, start_date, is_active)
SELECT 
  u.id,
  'president'::committee_position,
  CURRENT_DATE,
  true
FROM users u 
WHERE u.email = 'president@scrsa.com'
ON CONFLICT DO NOTHING;

-- Insert player record for the demo player
INSERT INTO players (user_id, position, jersey_number, date_joined, is_active)
SELECT 
  u.id,
  'Forward',
  10,
  CURRENT_DATE,
  true
FROM users u 
WHERE u.email = 'player@scrsa.com'
ON CONFLICT DO NOTHING;

-- Insert some demo sports
INSERT INTO sports (name, category, icon, is_active) VALUES
  ('Football', 'team', 'Trophy', true),
  ('Basketball', 'team', 'Trophy', true),
  ('Tennis', 'individual', 'Trophy', true),
  ('Swimming', 'individual', 'Trophy', true)
ON CONFLICT (name) DO NOTHING;