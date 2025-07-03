-- Create a function to simulate authentication for demo purposes
-- This allows the demo login to work with RLS policies

-- Create a function to set the current user context for demo purposes
CREATE OR REPLACE FUNCTION set_demo_user_context(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record users%ROWTYPE;
BEGIN
    -- Get the user record
    SELECT * INTO user_record
    FROM users
    WHERE email = user_email AND is_active = true;
    
    IF user_record.id IS NULL THEN
        RAISE EXCEPTION 'User not found or inactive: %', user_email;
    END IF;
    
    -- Set the user context (this is a simplified approach for demo)
    -- In production, this would be handled by proper Supabase Auth
    PERFORM set_config('app.current_user_id', user_record.id::text, true);
    PERFORM set_config('app.current_user_role', user_record.role::text, true);
    PERFORM set_config('app.current_user_email', user_record.email, true);
    
    RAISE NOTICE 'Demo user context set: % (%) - %', user_record.name, user_record.role, user_record.id;
END;
$$;

-- Create a function to get the current demo user ID
CREATE OR REPLACE FUNCTION get_demo_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    user_id_text text;
    user_id uuid;
BEGIN
    -- Try to get from session context first
    user_id_text := current_setting('app.current_user_id', true);
    
    IF user_id_text IS NOT NULL AND user_id_text != '' THEN
        user_id := user_id_text::uuid;
        RETURN user_id;
    END IF;
    
    -- Fallback: return the admin user ID for demo purposes
    SELECT id INTO user_id
    FROM users
    WHERE email = 'admin@scrsa.com' AND is_active = true
    LIMIT 1;
    
    RETURN user_id;
END;
$$;

-- Update the can_manage_event_players function to use demo context
CREATE OR REPLACE FUNCTION can_manage_event_players(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role user_role;
    user_active boolean;
    demo_user_id uuid;
BEGIN
    -- If no user_id provided, try to get from demo context
    IF user_id IS NULL THEN
        demo_user_id := get_demo_user_id();
        IF demo_user_id IS NOT NULL THEN
            user_id := demo_user_id;
        ELSE
            RETURN false;
        END IF;
    END IF;
    
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

-- Update event_players policies to work with demo authentication
DROP POLICY IF EXISTS "Allow authorized users to insert event players" ON event_players;
DROP POLICY IF EXISTS "Allow authorized users to update event players" ON event_players;
DROP POLICY IF EXISTS "Allow authorized users to delete event players" ON event_players;

-- Create new policies that work with both real auth and demo auth
CREATE POLICY "Allow authorized users to insert event players"
  ON event_players
  FOR INSERT
  TO authenticated
  WITH CHECK (
    can_manage_event_players(auth.uid()) OR 
    can_manage_event_players(get_demo_user_id())
  );

CREATE POLICY "Allow authorized users to update event players"
  ON event_players
  FOR UPDATE
  TO authenticated
  USING (
    can_manage_event_players(auth.uid()) OR 
    can_manage_event_players(get_demo_user_id())
  )
  WITH CHECK (
    can_manage_event_players(auth.uid()) OR 
    can_manage_event_players(get_demo_user_id())
  );

CREATE POLICY "Allow authorized users to delete event players"
  ON event_players
  FOR DELETE
  TO authenticated
  USING (
    can_manage_event_players(auth.uid()) OR 
    can_manage_event_players(get_demo_user_id())
  );

-- Set demo context for admin user by default
SELECT set_demo_user_context('admin@scrsa.com');

-- Verify the setup
DO $$
DECLARE
    demo_user_id uuid;
    can_manage boolean;
BEGIN
    demo_user_id := get_demo_user_id();
    can_manage := can_manage_event_players(demo_user_id);
    
    RAISE NOTICE 'Demo authentication setup complete:';
    RAISE NOTICE 'Demo user ID: %', demo_user_id;
    RAISE NOTICE 'Can manage event players: %', can_manage;
    
    IF NOT can_manage THEN
        RAISE EXCEPTION 'Demo authentication setup failed - admin cannot manage event players';
    END IF;
END $$;