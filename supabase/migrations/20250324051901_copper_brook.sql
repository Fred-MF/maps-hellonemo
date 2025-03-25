/*
  # Update operator GTFS ID format

  1. Changes
    - Update gtfs_id format to use {network_id}:{feed_id}
    - Clean up any invalid characters in existing gtfs_ids
    - Add constraint to ensure proper format

  2. Notes
    - First clean and update existing data
    - Then add the constraint
    - Handle potential invalid characters
*/

-- First, clean up any invalid characters in existing gtfs_ids
UPDATE operators
SET gtfs_id = regexp_replace(gtfs_id, '[^a-z0-9:-]', '-', 'g');

-- Update existing operators to use feed_id for gtfs_id
UPDATE operators o
SET gtfs_id = regexp_replace(n.id || ':' || o.feed_id, '[^a-z0-9:-]', '-', 'g')
FROM networks n
WHERE o.network_id = n.id;

-- Add comment explaining the gtfs_id format
COMMENT ON COLUMN operators.gtfs_id IS 'GTFS identifier in format {network_id}:{feed_id}';

-- Add check constraint to ensure gtfs_id format
ALTER TABLE operators
ADD CONSTRAINT check_operator_gtfs_id_format
CHECK (gtfs_id ~ '^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9-]*$');