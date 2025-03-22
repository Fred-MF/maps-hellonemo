/*
  # Network and Operator Schema Update

  1. New Tables
    - networks: Main table for transport networks
    - operators: Table for transport operators
    - network_transport_modes: Track transport modes per network
    - operator_transport_modes: Track transport modes per operator

  2. Changes
    - Add proper foreign key relationships between tables
    - Add indexes for performance
    - Add RLS policies for security

  3. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for admin write access
*/

-- Create networks table
CREATE TABLE IF NOT EXISTS networks (
  id text PRIMARY KEY,
  name text NOT NULL,
  display_name text,
  gtfs_id text NOT NULL,
  feed_id text NOT NULL,
  region_id text NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  is_available boolean DEFAULT true,
  last_check timestamptz DEFAULT now(),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create operators table
CREATE TABLE IF NOT EXISTS operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  name text NOT NULL,
  gtfs_id text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT operators_network_id_gtfs_id_key UNIQUE (network_id, gtfs_id)
);

-- Create network_transport_modes table
CREATE TABLE IF NOT EXISTS network_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer DEFAULT 0,
  check_time timestamptz DEFAULT now(),
  CONSTRAINT network_transport_modes_network_id_mode_key 
    UNIQUE (network_id, mode)
);

-- Create operator_transport_modes table
CREATE TABLE IF NOT EXISTS operator_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer DEFAULT 0,
  check_time timestamptz DEFAULT now(),
  CONSTRAINT operator_transport_modes_operator_id_mode_key 
    UNIQUE (operator_id, mode)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_networks_region_id ON networks(region_id);
CREATE INDEX IF NOT EXISTS idx_networks_gtfs_id ON networks(gtfs_id);
CREATE INDEX IF NOT EXISTS idx_networks_feed_id ON networks(feed_id);
CREATE INDEX IF NOT EXISTS idx_networks_is_available ON networks(is_available);

CREATE INDEX IF NOT EXISTS idx_operators_network_id ON operators(network_id);
CREATE INDEX IF NOT EXISTS idx_operators_gtfs_id ON operators(gtfs_id);

CREATE INDEX IF NOT EXISTS idx_network_transport_modes_network_id 
  ON network_transport_modes(network_id);
CREATE INDEX IF NOT EXISTS idx_network_transport_modes_mode 
  ON network_transport_modes(mode);

CREATE INDEX IF NOT EXISTS idx_operator_transport_modes_operator_id 
  ON operator_transport_modes(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_transport_modes_mode 
  ON operator_transport_modes(mode);

-- Enable RLS
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_transport_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_transport_modes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Networks policies
  DROP POLICY IF EXISTS "Public can read networks" ON networks;
  DROP POLICY IF EXISTS "Admins can modify networks" ON networks;
  
  -- Operators policies
  DROP POLICY IF EXISTS "Public can read operators" ON operators;
  DROP POLICY IF EXISTS "Admins can modify operators" ON operators;
  
  -- Network transport modes policies
  DROP POLICY IF EXISTS "Public can read network transport modes" ON network_transport_modes;
  DROP POLICY IF EXISTS "Admins can modify network transport modes" ON network_transport_modes;
  
  -- Operator transport modes policies
  DROP POLICY IF EXISTS "Public can read operator transport modes" ON operator_transport_modes;
  DROP POLICY IF EXISTS "Admins can modify operator transport modes" ON operator_transport_modes;
END $$;

-- Add RLS policies for networks
CREATE POLICY "Public can read networks"
  ON networks
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can modify networks"
  ON networks
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Add RLS policies for operators
CREATE POLICY "Public can read operators"
  ON operators
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can modify operators"
  ON operators
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Add RLS policies for network_transport_modes
CREATE POLICY "Public can read network transport modes"
  ON network_transport_modes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can modify network transport modes"
  ON network_transport_modes
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Add RLS policies for operator_transport_modes
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

-- Add triggers for updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_networks_updated_at'
  ) THEN
    CREATE TRIGGER update_networks_updated_at
      BEFORE UPDATE ON networks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_operators_updated_at'
  ) THEN
    CREATE TRIGGER update_operators_updated_at
      BEFORE UPDATE ON operators
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;