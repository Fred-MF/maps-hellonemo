/*
  # Add is_active field to agency_mappings table

  1. Changes
    - Add `is_active` boolean column to `agency_mappings` table with default value true
    - Add index on `is_active` column for better query performance
    - Update RLS policies to include is_active field in conditions

  2. Notes
    - Existing mappings will be active by default
    - The field can be used to hide networks from the frontend without deleting them
*/

-- Add is_active column with default value true
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agency_mappings' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE agency_mappings 
    ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Create index on is_active for better performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'agency_mappings' 
    AND indexname = 'idx_agency_mappings_is_active'
  ) THEN
    CREATE INDEX idx_agency_mappings_is_active ON agency_mappings(is_active);
  END IF;
END $$;

-- Update RLS policies to include is_active check
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les mappings" ON agency_mappings;
CREATE POLICY "Les utilisateurs peuvent lire les mappings"
  ON agency_mappings
  FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Les administrateurs peuvent tout faire sur les mappings" ON agency_mappings;
CREATE POLICY "Les administrateurs peuvent tout faire sur les mappings"
  ON agency_mappings
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);