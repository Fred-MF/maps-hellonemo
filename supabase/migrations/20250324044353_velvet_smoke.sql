/*
  # Add display_name column to operators table

  1. Changes
    - Add display_name column to operators table
    - Make it nullable to support operators without a display name
    - Add index for better query performance

  2. Notes
    - The display_name is optional and defaults to NULL
    - Existing operators will have NULL display_name
*/

-- Add display_name column to operators table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'operators' 
    AND column_name = 'display_name'
  ) THEN
    ALTER TABLE operators ADD COLUMN display_name text;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_operators_display_name ON operators(display_name);

-- Add comment explaining the column
COMMENT ON COLUMN operators.display_name IS 'User-friendly display name for the operator';