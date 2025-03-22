/*
  # Fix agencies table schema

  1. Changes
    - Add created_at and updated_at columns to agencies table
    - Add region_id column to agencies table
    - Add proper constraints and defaults
    - Enable RLS

  2. Security
    - Enable RLS on agencies table
    - Add policies for authenticated users
*/

-- Add missing columns to agencies table
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS region_id text REFERENCES regions(id) ON DELETE CASCADE;

-- Add check constraint for region_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_agency_region_id'
  ) THEN
    ALTER TABLE agencies
    ADD CONSTRAINT check_agency_region_id 
    CHECK (region_id = ANY(ARRAY[
      'ara', 'bfc', 'bre', 'caraibe', 'cor', 'cvl', 'ges', 'gf',
      'hdf', 'idf', 'mar', 'naq', 'nor', 'occ', 'paca', 'pdl', 're'
    ]));
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Les administrateurs peuvent tout faire sur les agences" ON agencies;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les agences" ON agencies;
END $$;

-- Add RLS policies
CREATE POLICY "Les administrateurs peuvent tout faire sur les agences"
ON agencies
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

CREATE POLICY "Les utilisateurs peuvent lire les agences"
ON agencies
FOR SELECT
TO authenticated
USING (true);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;

-- Create trigger
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();