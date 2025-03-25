/*
  # Fix network gtfs_id format

  1. Changes
    - Add gtfs_id column to networks table
    - Set gtfs_id values based on region_id and feed_id
    - Add not-null constraint after data is fixed

  2. Notes
    - gtfs_id format will be {region_id}:{feed_id}
    - This ensures consistency with operator gtfs_id format
*/

-- First add gtfs_id column as nullable
ALTER TABLE networks 
ADD COLUMN IF NOT EXISTS gtfs_id text;

-- Update gtfs_id values
UPDATE networks
SET gtfs_id = id || ':' || feed_id
WHERE gtfs_id IS NULL;

-- Now make gtfs_id not null
ALTER TABLE networks 
ALTER COLUMN gtfs_id SET NOT NULL;

-- Add comment explaining the gtfs_id format
COMMENT ON COLUMN networks.gtfs_id IS 'GTFS identifier in format {region_id}:{feed_id}';