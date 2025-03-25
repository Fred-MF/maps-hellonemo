/*
  # Fix operator gtfs_id format

  1. Changes
    - Update operator gtfs_id values to follow {network_id}:{feed_id} format
    - Add check constraint to ensure proper format
    - Add documentation

  2. Notes
    - Ensures consistent gtfs_id format across all operators
    - Maintains referential integrity with networks table
*/

-- First, create a temporary function to format gtfs_ids
CREATE OR REPLACE FUNCTION format_gtfs_id(input_text text)
RETURNS text AS $$
BEGIN
  -- Replace invalid characters with hyphens and ensure lowercase
  RETURN lower(regexp_replace(input_text, '[^a-zA-Z0-9:-]', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Update existing operators to use proper gtfs_id format
UPDATE operators o
SET gtfs_id = format_gtfs_id(o.network_id || ':' || o.feed_id)
FROM networks n
WHERE o.network_id = n.id;

-- Drop the temporary function
DROP FUNCTION format_gtfs_id;

-- Add comment explaining the gtfs_id format
COMMENT ON COLUMN operators.gtfs_id IS 'GTFS identifier in format {network_id}:{feed_id}';

-- Add check constraint to ensure gtfs_id format
ALTER TABLE operators
ADD CONSTRAINT check_operator_gtfs_id_format
CHECK (gtfs_id ~ '^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9-]*$');