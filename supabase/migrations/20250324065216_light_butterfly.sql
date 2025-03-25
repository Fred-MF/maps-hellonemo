/*
  # Add agency_id field to operators table

  1. Changes
    - Add agency_id column to operators table
    - Add index for better query performance
    - Add comment explaining the field usage

  2. Notes
    - agency_id stores the technical ID from the API
    - This is different from gtfs_id which is used for GTFS feed mapping
*/

-- Add agency_id column to operators table
ALTER TABLE operators ADD COLUMN agency_id text;

-- Create index for better query performance
CREATE INDEX idx_operators_agency_id ON operators(agency_id);

-- Add comment explaining the column
COMMENT ON COLUMN operators.agency_id IS 'Technical ID of the agency from the API';