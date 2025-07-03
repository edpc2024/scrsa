-- Ensure admin user exists and has proper authentication setup
-- This migration verifies and fixes admin user authentication

-- First, ensure the admin user exists with correct data
INSERT INTO users (email, name, role, is_active) VALUES
  ('admin@scrsa.com', 'System Administrator', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Verify the admin user exists and log the result
DO $$
DECLARE
    admin_user_id uuid;
    admin_user_record RECORD;
BEGIN
    -- Get admin user details
    SELECT * INTO admin_user_record
    FROM users 
    WHERE email = 'admin@scrsa.com';
    
    IF admin_user_record IS NULL THEN
        RAISE EXCEPTION 'Admin user not found after insert/update';
    END IF;
    
    RAISE NOTICE 'Admin user verified: ID=%, Name=%, Role=%, Active=%', 
        admin_user_record.id, 
        admin_user_record.name, 
        admin_user_record.role, 
        admin_user_record.is_active;
        
    -- Verify the user has admin role
    IF admin_user_record.role != 'admin' THEN
        RAISE EXCEPTION 'Admin user does not have admin role: %', admin_user_record.role;
    END IF;
    
    -- Verify the user is active
    IF NOT admin_user_record.is_active THEN
        RAISE EXCEPTION 'Admin user is not active';
    END IF;
    
    RAISE NOTICE 'Admin user authentication setup verified successfully';
END $$;

-- Create a function to check if a user has permission to manage event players
CREATE OR REPLACE FUNCTION can_manage_event_players(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role user_role;
    user_active boolean;
BEGIN
    -- Get user role and active status
    SELECT role, is_active INTO user_role, user_active
    FROM users
    WHERE id = user_id;
    
    -- Return false if user doesn't exist or is inactive
    IF user_role IS NULL OR NOT user_active THEN
        RETURN false;
    END IF;
    
    -- Allow admin, committee, and coach roles to manage event players
    RETURN user_role IN ('admin', 'committee', 'coach');
END;
$$;

-- Test the permission function with the admin user
DO $$
DECLARE
    admin_user_id uuid;
    can_manage boolean;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id
    FROM users 
    WHERE email = 'admin@scrsa.com';
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found for permission test';
    END IF;
    
    -- Test permission function
    SELECT can_manage_event_players(admin_user_id) INTO can_manage;
    
    IF NOT can_manage THEN
        RAISE EXCEPTION 'Admin user does not have permission to manage event players';
    END IF;
    
    RAISE NOTICE 'Admin user permission test passed: user_id=%, can_manage=%', 
        admin_user_id, can_manage;
END $$;

-- Update event_players policies to use the permission function for better security
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to insert event players" ON event_players;
DROP POLICY IF EXISTS "Allow authenticated users to update event players" ON event_players;
DROP POLICY IF EXISTS "Allow authenticated users to delete event players" ON event_players;

-- Create new policies using the permission function
CREATE POLICY "Allow authorized users to insert event players"
  ON event_players
  FOR INSERT
  TO authenticated
  WITH CHECK (can_manage_event_players(auth.uid()));

CREATE POLICY "Allow authorized users to update event players"
  ON event_players
  FOR UPDATE
  TO authenticated
  USING (can_manage_event_players(auth.uid()))
  WITH CHECK (can_manage_event_players(auth.uid()));

CREATE POLICY "Allow authorized users to delete event players"
  ON event_players
  FOR DELETE
  TO authenticated
  USING (can_manage_event_players(auth.uid()));

-- Keep the existing SELECT policy as it works fine
-- The SELECT policy allows all authenticated users to read event players

-- Verify all policies are in place
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'event_players'
    AND schemaname = 'public';
    
    IF policy_count < 4 THEN
        RAISE EXCEPTION 'Not all event_players policies were created. Found % policies', policy_count;
    END IF;
    
    RAISE NOTICE 'All event_players policies verified: % policies active', policy_count;
END $$;

-- Final verification: Test that admin user can theoretically insert into event_players
-- (This doesn't actually insert data, just verifies the policy would allow it)
DO $$
DECLARE
    admin_user_id uuid;
    policy_check boolean;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id
    FROM users 
    WHERE email = 'admin@scrsa.com';
    
    -- Simulate policy check
    SELECT can_manage_event_players(admin_user_id) INTO policy_check;
    
    IF NOT policy_check THEN
        RAISE EXCEPTION 'Admin user would be blocked by RLS policies';
    END IF;
    
    RAISE NOTICE 'Final verification passed: Admin user can manage event players';
END $$;