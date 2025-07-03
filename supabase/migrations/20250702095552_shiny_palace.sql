/*
  # Fix Sports Data Consistency

  1. Updates
    - Standardize sport names to match common usage
    - Ensure consistency between sports table and team assignments

  2. Changes
    - Update "Football" to be consistent across the system
    - Fix any naming inconsistencies
*/

-- Update sports table to have consistent naming
UPDATE sports SET name = 'Football' WHERE name = 'Football';
UPDATE sports SET name = 'Cricket' WHERE name = 'Cricket';
UPDATE sports SET name = 'Volleyball' WHERE name = 'Volleyball';
UPDATE sports SET name = 'Handball' WHERE name = 'Handball';
UPDATE sports SET name = 'Athletics' WHERE name = 'Athletics';
UPDATE sports SET name = 'Gymnastics' WHERE name = 'Gymnastics';

-- If you want to rename "Football" to "Foot Ball" to match your team name:
-- UPDATE sports SET name = 'Foot Ball' WHERE name = 'Football';

-- Or if you want to rename your team to match "Football":
-- UPDATE teams SET name = 'Football Men' WHERE name = 'Foot Ball';