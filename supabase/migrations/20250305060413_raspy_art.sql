/*
  # Add feed_filter column and update schema

  1. Schema Updates
    - Add feed_filter column to network_mapping table
    - Ensure tables exist with proper structure
    - Add necessary indexes
*/

-- Add feed_filter column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'network_mapping' 
    AND column_name = 'feed_filter'
  ) THEN
    ALTER TABLE network_mapping ADD COLUMN feed_filter jsonb;
  END IF;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS network_mapping (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  region_id text NOT NULL,
  feed_id text NOT NULL,
  operator text,
  feed_filter jsonb,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS network_status (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  network_id integer NOT NULL REFERENCES network_mapping(id) ON DELETE CASCADE,
  check_time timestamptz DEFAULT now(),
  is_available boolean NOT NULL DEFAULT false,
  error_message text
);

-- Create index if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_network_status_network_id'
  ) THEN
    CREATE INDEX idx_network_status_network_id ON network_status(network_id);
  END IF;
END $$;