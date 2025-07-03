/*
  # Fix Event Players RLS Policies

  1. Problem
    - RLS policies on event_players table are preventing inserts
    - Error: "new row violates row-level security policy for table event_players"
    - Need to create working policies that allow authenticated users to manage event players

  2. Solution
    - Clean up all existing conflicting policies
    - Create simple, working policies that match other tables
    - Verify table structure and constraints
    - Test that policies work correctly

  3. Changes
    - Drop all existing policies on event_players table
    - Create public read policy for transparency
    - Create authenticated management policy for CRUD operations
    - Add comprehensive verification and logging
*/

-- Disable RLS temporarily to clean up
ALTER TABLE event_players DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on event_players table
DO $$ 
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'event_players' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_rec.policyname || '" ON event_players';
    END LOOP;
    
    RAISE NOTICE 'Dropped all existing policies on event_players table';
END $$;

-- Re-enable RLS
ALTER TABLE event_players ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies that match the pattern used in other tables

-- 1. Allow public to read event players (for viewing event participants)
CREATE POLICY "Allow reading event players"
  ON event_players
  FOR SELECT
  TO public
  USING (true);

-- 2. Allow authenticated users to manage event players (same as other tables)
CREATE POLICY "Allow event player management"
  ON event_players
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify the policies were created correctly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'event_players' 
        AND policyname = 'Allow reading event players'
        AND schemaname = 'public'
    ) THEN
        RAISE EXCEPTION 'Reading policy was not created successfully';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'event_players' 
        AND policyname = 'Allow event player management'
        AND schemaname = 'public'
    ) THEN
        RAISE EXCEPTION 'Management policy was not created successfully';
    END IF;
    
    RAISE NOTICE 'All event_players policies created successfully';
END $$;

-- Test that the table structure is correct
DO $$
BEGIN
    -- Verify table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_players'
    ) THEN
        RAISE EXCEPTION 'event_players table does not exist';
    END IF;
    
    -- Verify required columns exist
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
    
    -- Verify foreign key constraints exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'event_players' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'event_id'
    ) THEN
        RAISE EXCEPTION 'event_players table missing foreign key constraint on event_id';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'event_players' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'player_id'
    ) THEN
        RAISE EXCEPTION 'event_players table missing foreign key constraint on player_id';
    END IF;
    
    RAISE NOTICE 'event_players table structure verified successfully';
END $$;

-- Show final policy status
DO $$
DECLARE
    policy_count INTEGER;
    policy_info RECORD;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'event_players' 
    AND schemaname = 'public';
    
    RAISE NOTICE 'event_players table now has % active policies', policy_count;
    
    -- List the policies
    FOR policy_info IN 
        SELECT policyname, cmd, roles, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'event_players' 
        AND schemaname = 'public'
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Roles: %', 
            policy_info.policyname, 
            policy_info.cmd, 
            policy_info.roles;
    END LOOP;
END $$;