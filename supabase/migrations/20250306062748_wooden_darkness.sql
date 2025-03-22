/*
  # Création des tables pour la gestion des agences

  1. Tables
    - `agencies` : Table principale des agences
    - `agency_transport_modes` : Modes de transport par agence
    - `agency_mappings` : Mapping des noms d'affichage et réseaux

  2. Sécurité
    - RLS activé sur toutes les tables
    - Lecture autorisée pour tous les utilisateurs authentifiés
    - Modifications réservées aux administrateurs
*/

-- Créer la table des agences
CREATE TABLE IF NOT EXISTS agencies (
  id text PRIMARY KEY,
  name text NOT NULL,
  gtfs_id text NOT NULL,
  feed_id text NOT NULL,
  region_id text NOT NULL,
  is_available boolean DEFAULT true,
  last_check timestamptz DEFAULT now(),
  error_message text,
  CONSTRAINT check_agency_region_id CHECK (region_id IN (
    'ara', 'bfc', 'bre', 'caraibe', 'cor', 'cvl', 'ges', 'gf',
    'hdf', 'idf', 'mar', 'naq', 'nor', 'occ', 'paca', 'pdl', 're'
  ))
);

-- Créer la table des modes de transport par agence
CREATE TABLE IF NOT EXISTS agency_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer NOT NULL DEFAULT 0,
  check_time timestamptz DEFAULT now(),
  UNIQUE(agency_id, mode, check_time)
);

-- Créer la table des mappings d'agences
CREATE TABLE IF NOT EXISTS agency_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  display_name text,
  network_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_agencies_region_id ON agencies(region_id);
CREATE INDEX IF NOT EXISTS idx_agencies_feed_id ON agencies(feed_id);
CREATE INDEX IF NOT EXISTS idx_agencies_gtfs_id ON agencies(gtfs_id);
CREATE INDEX IF NOT EXISTS idx_agencies_name ON agencies(name);
CREATE INDEX IF NOT EXISTS idx_agencies_is_available ON agencies(is_available);
CREATE INDEX IF NOT EXISTS idx_agency_transport_modes_agency_id ON agency_transport_modes(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_transport_modes_mode ON agency_transport_modes(mode);
CREATE INDEX IF NOT EXISTS idx_agency_mappings_agency_id ON agency_mappings(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_mappings_display_name ON agency_mappings(display_name);
CREATE INDEX IF NOT EXISTS idx_agency_mappings_network_name ON agency_mappings(network_name);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agency_mappings_updated_at
  BEFORE UPDATE ON agency_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_transport_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_mappings ENABLE ROW LEVEL SECURITY;

-- Policies pour les agences
CREATE POLICY "Les utilisateurs peuvent lire les agences"
  ON agencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Les administrateurs peuvent tout faire sur les agences"
  ON agencies FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Policies pour les modes de transport
CREATE POLICY "Les utilisateurs peuvent lire les modes de transport"
  ON agency_transport_modes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Les administrateurs peuvent tout faire sur les modes de transport"
  ON agency_transport_modes FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Policies pour les mappings
CREATE POLICY "Les utilisateurs peuvent lire les mappings"
  ON agency_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Les administrateurs peuvent tout faire sur les mappings"
  ON agency_mappings FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);