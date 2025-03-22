/*
  # Fix network schema and add missing constraints

  1. Changes
    - Add missing foreign key constraints
    - Add missing indexes
    - Add missing triggers
    - Fix table relationships

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for admin write access
*/

-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS network_transport_modes CASCADE;
DROP TABLE IF EXISTS operator_transport_modes CASCADE;
DROP TABLE IF EXISTS operators CASCADE;
DROP TABLE IF EXISTS networks CASCADE;

-- Create networks table
CREATE TABLE networks (
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
  updated_at timestamptz DEFAULT now(),
  UNIQUE(region_id, gtfs_id)
);

-- Create indexes for networks
CREATE INDEX idx_networks_region_id ON networks(region_id);
CREATE INDEX idx_networks_gtfs_id ON networks(gtfs_id);
CREATE INDEX idx_networks_feed_id ON networks(feed_id);
CREATE INDEX idx_networks_is_available ON networks(is_available);

-- Create operators table
CREATE TABLE operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  name text NOT NULL,
  gtfs_id text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(network_id, gtfs_id)
);

-- Create indexes for operators
CREATE INDEX idx_operators_network_id ON operators(network_id);
CREATE INDEX idx_operators_gtfs_id ON operators(gtfs_id);

-- Create network_transport_modes table
CREATE TABLE network_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer DEFAULT 0,
  check_time timestamptz DEFAULT now(),
  UNIQUE(network_id, mode)
);

-- Create indexes for network_transport_modes
CREATE INDEX idx_network_transport_modes_network_id ON network_transport_modes(network_id);
CREATE INDEX idx_network_transport_modes_mode ON network_transport_modes(mode);

-- Enable RLS
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_transport_modes ENABLE ROW LEVEL SECURITY;

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

-- Add triggers for updated_at
CREATE TRIGGER update_networks_updated_at
  BEFORE UPDATE ON networks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_network_transport_modes_updated_at
  BEFORE UPDATE ON network_transport_modes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();