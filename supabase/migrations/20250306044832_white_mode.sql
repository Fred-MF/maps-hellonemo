/*
  # Create agency tables

  1. New Tables
    - `agencies`: Stores agency information from the API
      - `id` (text, primary key) - Agency ID from the API
      - `name` (text) - Agency name from the API
      - `gtfs_id` (text) - GTFS ID from the API
      - `feed_id` (text) - Feed ID from the API
      - `last_check` (timestamp) - Last time the agency was checked
      - `is_available` (boolean) - Whether the agency is available
      - `error_message` (text) - Error message if agency is not available

    - `agency_transport_modes`: Stores transport modes for each agency
      - `id` (uuid, primary key)
      - `agency_id` (text, references agencies.id)
      - `mode` (text) - Transport mode (BUS, TRAM, etc.)
      - `route_count` (integer) - Number of routes for this mode
      - `check_time` (timestamp) - When this count was last updated

    - `agency_mappings`: Stores custom display names for agencies
      - `id` (uuid, primary key)
      - `agency_id` (text, references agencies.id)
      - `display_name` (text) - Custom display name for the agency
      - `network_name` (text) - Custom network name
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id text PRIMARY KEY,
  name text NOT NULL,
  gtfs_id text NOT NULL,
  feed_id text NOT NULL,
  last_check timestamptz DEFAULT now(),
  is_available boolean DEFAULT true,
  error_message text
);

-- Create agency_transport_modes table
CREATE TABLE IF NOT EXISTS agency_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id text REFERENCES agencies(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer NOT NULL DEFAULT 0,
  check_time timestamptz DEFAULT now(),
  UNIQUE(agency_id, mode, check_time)
);

-- Create agency_mappings table
CREATE TABLE IF NOT EXISTS agency_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id text REFERENCES agencies(id) ON DELETE CASCADE,
  display_name text,
  network_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add updated_at trigger to agency_mappings
CREATE TRIGGER update_agency_mappings_updated_at
  BEFORE UPDATE ON agency_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_transport_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Les administrateurs peuvent tout faire sur agencies"
  ON agencies
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

CREATE POLICY "Les administrateurs peuvent tout faire sur agency_transport_modes"
  ON agency_transport_modes
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

CREATE POLICY "Les administrateurs peuvent tout faire sur agency_mappings"
  ON agency_mappings
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Create indexes
CREATE INDEX idx_agencies_feed_id ON agencies(feed_id);
CREATE INDEX idx_agencies_gtfs_id ON agencies(gtfs_id);
CREATE INDEX idx_agency_transport_modes_agency_id ON agency_transport_modes(agency_id);
CREATE INDEX idx_agency_mappings_agency_id ON agency_mappings(agency_id);