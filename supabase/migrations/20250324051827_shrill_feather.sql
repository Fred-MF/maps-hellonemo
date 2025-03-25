/*
  # Update operator GTFS ID generation logic

  1. Changes
    - Update gtfs_id generation to use feed_id instead of normalized name
    - Add constraint to ensure gtfs_id format matches {network_id}:{feed_id}
    - Update existing records to match new format

  2. Notes
    - This change simplifies ID generation
    - Maintains consistency with GTFS data structure
    - Makes IDs more predictable and stable
*/

-- Update existing operators to use feed_id for gtfs_id
UPDATE operators o
SET gtfs_id = n.id || ':' || o.feed_id
FROM networks n
WHERE o.network_id = n.id;

-- Add check constraint to ensure gtfs_id format
ALTER TABLE operators
ADD CONSTRAINT check_operator_gtfs_id_format
CHECK (gtfs_id ~ '^[a-z0-9-]+:[a-z0-9-]+$');

-- Add comment explaining the gtfs_id format
COMMENT ON COLUMN operators.gtfs_id IS 'GTFS identifier in format {network_id}:{feed_id}';