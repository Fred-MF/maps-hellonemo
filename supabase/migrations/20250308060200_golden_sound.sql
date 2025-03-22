/*
  # Create route shapes table

  1. New Tables
    - `route_shapes`
      - `id` (uuid, primary key)
      - `route_id` (text, unique with agency_id)
      - `agency_id` (text)
      - `shape_points` (jsonb array of [lon, lat] coordinates)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `route_shapes` table
    - Add policy for public read access
    - Add policy for admin write access

  3. Indexes
    - Index on route_id for faster lookups
    - Index on agency_id for faster lookups
    - Unique constraint on route_id + agency_id
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Lecture publique des tracés" ON route_shapes;
  DROP POLICY IF EXISTS "Modification des tracés par les administrateurs" ON route_shapes;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS route_shapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id text NOT NULL,
  agency_id text NOT NULL,
  shape_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(route_id, agency_id),
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_route_shapes_route_id ON route_shapes(route_id);
CREATE INDEX IF NOT EXISTS idx_route_shapes_agency_id ON route_shapes(agency_id);

-- Enable RLS
ALTER TABLE route_shapes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Lecture publique des tracés"
  ON route_shapes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Modification des tracés par les administrateurs"
  ON route_shapes
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_route_shapes_updated_at ON route_shapes;

-- Create trigger
CREATE TRIGGER update_route_shapes_updated_at
  BEFORE UPDATE ON route_shapes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();