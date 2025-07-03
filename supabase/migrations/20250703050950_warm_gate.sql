/*
  # Add Sports Officer to Committee Positions

  1. Updates
    - Add 'sports_officer' to the committee_position enum
    - This allows Sports Officers to be part of the committee structure
    - Maintains consistency with existing committee management

  2. Changes
    - Update the committee_position enum to include sports_officer
    - Sports Officers will have similar access to committee members
*/

-- Add sports_officer to the committee_position enum
ALTER TYPE committee_position ADD VALUE 'sports_officer';

-- Update any existing committee member with a generic position to sports_officer if needed
-- (This is optional and can be customized based on your needs)

-- Verify the enum was updated
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'sports_officer' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'committee_position')
    ) THEN
        RAISE EXCEPTION 'sports_officer was not added to committee_position enum';
    END IF;
    
    RAISE NOTICE 'Successfully added sports_officer to committee_position enum';
END $$;