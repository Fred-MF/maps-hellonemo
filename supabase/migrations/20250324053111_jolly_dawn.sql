/*
  # Fix operator gtfs_id format

  1. Changes
    - Update operator gtfs_id values to follow {network_id}:{feed_id} format
    - Add documentation for the gtfs_id format
    - Ensure consistent formatting across all operators

  2. Notes
    - Maintains referential integrity with networks table
    - Uses proper format for all gtfs_ids
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