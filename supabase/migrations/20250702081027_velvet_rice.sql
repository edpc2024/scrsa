/*
  # Add Event Players Table

  1. New Table
    - `event_players` - Junction table for event-player relationships
    - Links events to specific players who will participate

  2. Security
    - Enable RLS on event_players table
    - Add policies for authenticated access

  3. Features
    - Track which players are selected for each event
    - Support for performance tracking workflow
*/

-- Create event_players table
CREATE TABLE IF NOT EXISTS event_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_players_event_id ON event_players(event_id);
CREATE INDEX IF NOT EXISTS idx_event_players_player_id ON event_players(player_id);

-- Enable Row Level Security
ALTER TABLE event_players ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow reading event players" ON event_players FOR SELECT USING (true);
CREATE POLICY "Allow event player management" ON event_players FOR ALL TO authenticated USING (true);