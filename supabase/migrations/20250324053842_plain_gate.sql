-- Drop the unnecessary GTFS ID format constraint
ALTER TABLE operators DROP CONSTRAINT IF EXISTS check_operator_gtfs_id_format;