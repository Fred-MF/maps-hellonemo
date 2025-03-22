/*
  # Fix transport modes schema relationships

  1. Changes
    - Add operator_transport_modes table to track transport modes per operator
    - Add proper foreign key relationships
    - Add RLS policies for security
    - Add indexes for performance

  2. Security
    - Enable RLS on new tables
    - Add policies for public read access
    - Add policies for admin write access
*/

-- Create operator_transport_modes table if it doesn't exist
CREATE TABLE IF NOT EXISTS operator_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL,
  mode text NOT NULL,
  route_count integer DEFAULT 0,
  check_time timestamptz DEFAULT now(),
  CONSTRAINT operator_transport_modes_operator_id_fkey 
    FOREIGN KEY (operator_id) 
    REFERENCES operators(id) 
    ON DELETE CASCADE,
  CONSTRAINT operator_transport_modes_operator_id_mode_key 
    UNIQUE (operator_id, mode)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_operator_transport_modes_operator_id 
  ON operator_transport_modes(operator_id);

CREATE INDEX IF NOT EXISTS idx_operator_transport_modes_mode 
  ON operator_transport_modes(mode);

-- Enable RLS
ALTER TABLE operator_transport_modes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public can read operator transport modes" ON operator_transport_modes;
  DROP POLICY IF EXISTS "Admins can modify operator transport modes" ON operator_transport_modes;
END $$;

-- Add RLS policies
CREATE POLICY "Public can read operator transport modes"
  ON operator_transport_modes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can modify operator transport modes"
  ON operator_transport_modes
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Add trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_operator_transport_modes_updated_at'
  ) THEN
    CREATE TRIGGER update_operator_transport_modes_updated_at
      BEFORE UPDATE ON operator_transport_modes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;