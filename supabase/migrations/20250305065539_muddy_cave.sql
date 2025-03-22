/*
  # Add agency fields to network_mapping table

  1. Changes
    - Add agency_name column to store the technical agency name for GTFS mapping
    - Add agency_displayname column to store the user-friendly agency name
    - Update feed_filter column to handle complex GTFS filters
    - Add indexes for performance optimization

  2. Purpose
    These changes allow storing the mapping between networks and GTFS agencies,
    with both technical and display names, plus complex filtering capabilities.

  3. Impact
    - Improves data quality by preserving original agency names
    - Enables better GTFS feed filtering
    - Maintains backward compatibility
*/

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'network_mapping' 
    AND column_name = 'agency_name'
  ) THEN
    ALTER TABLE network_mapping ADD COLUMN agency_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'network_mapping' 
    AND column_name = 'agency_displayname'
  ) THEN
    ALTER TABLE network_mapping ADD COLUMN agency_displayname text;
  END IF;
END $$;

-- Create index for agency_name lookups
CREATE INDEX IF NOT EXISTS idx_network_mapping_agency_name 
ON network_mapping(agency_name);

-- Add comment explaining the columns
COMMENT ON COLUMN network_mapping.agency_name IS 'Technical name of the agency used for GTFS feed mapping';
COMMENT ON COLUMN network_mapping.agency_displayname IS 'User-friendly display name of the agency';
COMMENT ON COLUMN network_mapping.feed_filter IS 'GTFS feed filter configuration in JSON format';