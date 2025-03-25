/*
  # Remove network name field

  1. Changes
    - Remove name column from networks table as it's redundant with feed_id
    - Update constraints and indexes accordingly
    - Keep display_name for custom display purposes

  2. Impact
    - feed_id will now be used as the technical identifier
    - display_name remains for user-friendly display
*/

-- Remove name column from networks table
ALTER TABLE networks DROP COLUMN name;

-- Drop index on name if it exists
DROP INDEX IF EXISTS idx_networks_name;

-- Add comment explaining the display_name usage
COMMENT ON COLUMN networks.display_name IS 'User-friendly display name for the network. If not set, feed_id should be used.';