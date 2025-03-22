/*
  # Add network transport modes tracking

  1. New Tables
    - `network_transport_modes`
      - `id` (uuid, primary key)
      - `network_id` (integer, foreign key to network_mapping)
      - `mode` (text, transport mode)
      - `route_count` (integer, number of routes)
      - `check_time` (timestamp, when this count was recorded)

  2. Security
    - Enable RLS on `network_transport_modes` table
    - Add policy for authenticated users to manage transport modes data
*/

CREATE TABLE IF NOT EXISTS network_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id integer REFERENCES network_mapping(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer NOT NULL DEFAULT 0,
  check_time timestamptz DEFAULT now(),
  UNIQUE(network_id, mode, check_time)
);

ALTER TABLE network_transport_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les administrateurs peuvent tout faire sur network_transport_modes"
  ON network_transport_modes
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated' AND auth.email() = 'admin@maasify.io');