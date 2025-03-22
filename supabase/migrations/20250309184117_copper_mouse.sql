/*
  # Structure des réseaux de transport

  1. Nouvelles Tables
    - `networks`
      - `id` (uuid, primary key)
      - `name` (text, nom technique)
      - `display_name` (text, nom d'affichage)
      - `gtfs_id` (text)
      - `feed_id` (text)
      - `region_id` (text, foreign key)
      - `is_available` (boolean)
      - `last_check` (timestamptz)
      - `error_message` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `network_transport_modes`
      - `id` (uuid, primary key)
      - `network_id` (uuid, foreign key)
      - `mode` (text)
      - `route_count` (integer)
      - `check_time` (timestamptz)

    - `operators`
      - `id` (uuid, primary key)
      - `network_id` (uuid, foreign key)
      - `name` (text)
      - `gtfs_id` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `operator_transport_modes`
      - `id` (uuid, primary key)
      - `operator_id` (uuid, foreign key)
      - `mode` (text)
      - `route_count` (integer)
      - `check_time` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for admin write access

  3. Triggers
    - Add updated_at triggers for networks and operators
*/

-- Create networks table
CREATE TABLE IF NOT EXISTS networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create network_transport_modes table
CREATE TABLE IF NOT EXISTS network_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer DEFAULT 0,
  check_time timestamptz DEFAULT now()
);

-- Create operators table
CREATE TABLE IF NOT EXISTS operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  name text NOT NULL,
  gtfs_id text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create operator_transport_modes table
CREATE TABLE IF NOT EXISTS operator_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer DEFAULT 0,
  check_time timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_networks_region_id ON networks(region_id);
CREATE INDEX IF NOT EXISTS idx_networks_gtfs_id ON networks(gtfs_id);
CREATE INDEX IF NOT EXISTS idx_network_transport_modes_network_id ON network_transport_modes(network_id);
CREATE INDEX IF NOT EXISTS idx_operators_network_id ON operators(network_id);
CREATE INDEX IF NOT EXISTS idx_operator_transport_modes_operator_id ON operator_transport_modes(operator_id);

-- Enable Row Level Security
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_transport_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_transport_modes ENABLE ROW LEVEL SECURITY;

-- Create policies for networks
CREATE POLICY "Public can read networks" ON networks
  FOR SELECT USING (true);

CREATE POLICY "Admins can modify networks" ON networks
  FOR ALL USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Create policies for network_transport_modes
CREATE POLICY "Public can read network transport modes" ON network_transport_modes
  FOR SELECT USING (true);

CREATE POLICY "Admins can modify network transport modes" ON network_transport_modes
  FOR ALL USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Create policies for operators
CREATE POLICY "Public can read operators" ON operators
  FOR SELECT USING (true);

CREATE POLICY "Admins can modify operators" ON operators
  FOR ALL USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Create policies for operator_transport_modes
CREATE POLICY "Public can read operator transport modes" ON operator_transport_modes
  FOR SELECT USING (true);

CREATE POLICY "Admins can modify operator transport modes" ON operator_transport_modes
  FOR ALL USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Create or replace the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_networks_updated_at ON networks;
DROP TRIGGER IF EXISTS update_operators_updated_at ON operators;

-- Create triggers
CREATE TRIGGER update_networks_updated_at
  BEFORE UPDATE ON networks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();