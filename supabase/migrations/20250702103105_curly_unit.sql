/*
  # Fix event_players RLS policies - Final Solution

  1. Problem Analysis
    - Multiple conflicting policies on event_players table
    - Complex policy logic causing permission denials
    - Need to simplify to match working tables

  2. Solution
    - Drop ALL existing policies on event_players
    - Create simple policies that match other working tables
    - Ensure proper RLS configuration

  3. Changes
    - Remove all complex role-based policies
    - Create simple authenticated user policies
    - Match the permission model of other tables
*/

-- Disable RLS temporarily to clean up
ALTER TABLE event_players DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on event_players table
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'event_players' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON event_players';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE event_players ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies that match other tables

-- 1. Allow public to read event players (for transparency)
CREATE POLICY "Allow reading event players"
  ON event_players
  FOR SELECT
  USING (true);

-- 2. Allow authenticated users to manage event players (same as other tables)
CREATE POLICY "Allow event player management"
  ON event_players
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify the table structure and constraints
DO $$
BEGIN
    -- Check if the table exists and has proper structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_players'
    ) THEN
        RAISE EXCEPTION 'event_players table does not exist';
    END IF;
    
    -- Check if required columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_players' 
        AND column_name = 'event_id'
    ) THEN
        RAISE EXCEPTION 'event_players table missing event_id column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_players' 
        AND column_name = 'player_id'
    ) THEN
        RAISE EXCEPTION 'event_players table missing player_id column';
    END IF;
    
    RAISE NOTICE 'event_players table structure verified successfully';
END $$;

-- Test the policies by checking if they exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'event_players' 
        AND policyname = 'Allow reading event players'
    ) THEN
        RAISE EXCEPTION 'Reading policy not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'event_players' 
        AND policyname = 'Allow event player management'
    ) THEN
        RAISE EXCEPTION 'Management policy not created';
    END IF;
    
    RAISE NOTICE 'All policies created successfully';
END $$;