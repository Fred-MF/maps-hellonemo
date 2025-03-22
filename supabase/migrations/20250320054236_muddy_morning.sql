/*
  # Add feed_id column to operators table

  1. Changes
    - Add feed_id column to operators table
    - Make feed_id NOT NULL with a default value
    - Update existing records to have a default feed_id

  2. Notes
    - The feed_id is required for proper GTFS feed tracking
    - Default value ensures backward compatibility
*/

-- Add feed_id column to operators table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'operators' 
    AND column_name = 'feed_id'
  ) THEN
    -- First add the column as nullable
    ALTER TABLE operators ADD COLUMN feed_id text;
    
    -- Update existing records with a default value
    UPDATE operators SET feed_id = 'default';
    
    -- Then make it NOT NULL
    ALTER TABLE operators ALTER COLUMN feed_id SET NOT NULL;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_operators_feed_id ON operators(feed_id);

-- Add comment explaining the column
COMMENT ON COLUMN operators.feed_id IS 'GTFS feed identifier for this operator';