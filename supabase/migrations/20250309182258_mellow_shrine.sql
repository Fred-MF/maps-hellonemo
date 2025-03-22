/*
  # Fix Database Relationships Migration

  1. New Tables
    - networks: Main table for transport networks
    - network_transport_modes: Transport modes per network
    - operators: Network operators
    
  2. Security
    - Enable RLS on all tables
    - Public read access
    - Admin-only write access
    
  3. Indexes
    - Optimized indexes for common queries
*/

-- Create networks table
CREATE TABLE IF NOT EXISTS networks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT,
  gtfs_id TEXT NOT NULL,
  feed_id TEXT NOT NULL,
  region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  last_check TIMESTAMPTZ DEFAULT now(),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create network_transport_modes table
CREATE TABLE IF NOT EXISTS network_transport_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id TEXT NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  route_count INTEGER DEFAULT 0,
  check_time TIMESTAMPTZ DEFAULT now(),
  UNIQUE(network_id, mode)
);

-- Create operators table
CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id TEXT NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gtfs_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_transport_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
  -- Networks policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'networks' AND policyname = 'Lecture publique des réseaux') THEN
    CREATE POLICY "Lecture publique des réseaux" ON networks
      FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'networks' AND policyname = 'Modification des réseaux par les administrateurs') THEN
    CREATE POLICY "Modification des réseaux par les administrateurs" ON networks
      FOR ALL TO authenticated
      USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
      WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);
  END IF;

  -- Network transport modes policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'network_transport_modes' AND policyname = 'Lecture publique des modes de transport') THEN
    CREATE POLICY "Lecture publique des modes de transport" ON network_transport_modes
      FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'network_transport_modes' AND policyname = 'Modification des modes de transport par les administrateurs') THEN
    CREATE POLICY "Modification des modes de transport par les administrateurs" ON network_transport_modes
      FOR ALL TO authenticated
      USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
      WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);
  END IF;

  -- Operators policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'operators' AND policyname = 'Lecture publique des opérateurs') THEN
    CREATE POLICY "Lecture publique des opérateurs" ON operators
      FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'operators' AND policyname = 'Modification des opérateurs par les administrateurs') THEN
    CREATE POLICY "Modification des opérateurs par les administrateurs" ON operators
      FOR ALL TO authenticated
      USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
      WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);
  END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for networks table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_networks_updated_at') THEN
    CREATE TRIGGER update_networks_updated_at
      BEFORE UPDATE ON networks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_networks_region_id ON networks(region_id);
CREATE INDEX IF NOT EXISTS idx_networks_display_name ON networks(display_name);
CREATE INDEX IF NOT EXISTS idx_networks_is_available ON networks(is_available);
CREATE INDEX IF NOT EXISTS idx_network_transport_modes_mode ON network_transport_modes(mode);
CREATE INDEX IF NOT EXISTS idx_operators_network_id ON operators(network_id);
CREATE INDEX IF NOT EXISTS idx_operators_gtfs_id ON operators(gtfs_id);