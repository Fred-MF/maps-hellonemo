/*
  # Remove redundant gtfs_id from networks table

  1. Changes
    - Remove gtfs_id column from networks table as it's redundant
    - The network identification is already handled by:
      - id: Primary key and unique identifier
      - feed_id: Link to GTFS feed
      - Operators have their own gtfs_id that references networks

  2. Impact
    - Simplifies the data model
    - Removes redundant data
    - Maintains all necessary relationships
*/

-- Drop the gtfs_id column from networks table
ALTER TABLE networks DROP COLUMN gtfs_id;

-- Drop any indexes on gtfs_id if they exist
DROP INDEX IF EXISTS idx_networks_gtfs_id;