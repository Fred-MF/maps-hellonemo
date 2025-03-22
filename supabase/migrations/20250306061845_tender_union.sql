/*
  # Optimisation des tables d'agences

  1. Modifications
    - Ajout d'index sur les colonnes fréquemment utilisées
    - Optimisation des contraintes de clés étrangères
    - Ajout de contraintes d'unicité pour éviter les doublons
    - Ajout de RLS pour la sécurité

  2. Nouvelles Tables
    - `agencies`
      - `id` (text, primary key)
      - `name` (text)
      - `gtfs_id` (text)
      - `feed_id` (text)
      - `region_id` (text)
      - `is_available` (boolean)
      - `last_check` (timestamp)
      - `error_message` (text)

    - `agency_transport_modes`
      - `id` (uuid, primary key)
      - `agency_id` (text, foreign key)
      - `mode` (text)
      - `route_count` (integer)
      - `check_time` (timestamp)

    - `agency_mappings`
      - `id` (uuid, primary key)
      - `agency_id` (text, foreign key)
      - `display_name` (text)
      - `network_name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  3. Sécurité
    - Enable RLS sur toutes les tables
    - Ajout de policies pour l'accès authentifié
*/

-- Supprimer les triggers et fonctions existants avec leurs dépendances
DROP TRIGGER IF EXISTS update_agency_mappings_updated_at ON agency_mappings CASCADE;
DROP TRIGGER IF EXISTS update_network_mapping_updated_at ON network_mapping CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

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

-- Index pour optimiser les recherches
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_region_id') THEN
    CREATE INDEX idx_agencies_region_id ON agencies(region_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_feed_id') THEN
    CREATE INDEX idx_agencies_feed_id ON agencies(feed_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_gtfs_id') THEN
    CREATE INDEX idx_agencies_gtfs_id ON agencies(gtfs_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_name') THEN
    CREATE INDEX idx_agencies_name ON agencies(name);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_is_available') THEN
    CREATE INDEX idx_agencies_is_available ON agencies(is_available);
  END IF;
END $$;

-- Créer la table des modes de transport par agence
CREATE TABLE IF NOT EXISTS agency_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer NOT NULL DEFAULT 0,
  check_time timestamptz DEFAULT now(),
  UNIQUE(agency_id, mode, check_time)
);

-- Index pour optimiser les jointures
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_transport_modes_agency_id') THEN
    CREATE INDEX idx_agency_transport_modes_agency_id ON agency_transport_modes(agency_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_transport_modes_mode') THEN
    CREATE INDEX idx_agency_transport_modes_mode ON agency_transport_modes(mode);
  END IF;
END $$;

-- Créer la table des mappings d'agences
CREATE TABLE IF NOT EXISTS agency_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  display_name text,
  network_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_id)
);

-- Index pour optimiser les jointures
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_mappings_agency_id') THEN
    CREATE INDEX idx_agency_mappings_agency_id ON agency_mappings(agency_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_mappings_display_name') THEN
    CREATE INDEX idx_agency_mappings_display_name ON agency_mappings(display_name);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_mappings_network_name') THEN
    CREATE INDEX idx_agency_mappings_network_name ON agency_mappings(network_name);
  END IF;
END $$;

-- Créer la fonction de mise à jour de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer les triggers pour updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_agency_mappings_updated_at'
  ) THEN
    CREATE TRIGGER update_agency_mappings_updated_at
      BEFORE UPDATE ON agency_mappings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_network_mapping_updated_at'
  ) THEN
    CREATE TRIGGER update_network_mapping_updated_at
      BEFORE UPDATE ON network_mapping
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_transport_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_mappings ENABLE ROW LEVEL SECURITY;

-- Policies pour les agences
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les agences" ON agencies;
  DROP POLICY IF EXISTS "Les administrateurs peuvent tout faire sur les agences" ON agencies;
  
  CREATE POLICY "Les utilisateurs peuvent lire les agences"
    ON agencies FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Les administrateurs peuvent tout faire sur les agences"
    ON agencies FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
    WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);
END $$;

-- Policies pour les modes de transport
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les modes de transport" ON agency_transport_modes;
  DROP POLICY IF EXISTS "Les administrateurs peuvent tout faire sur les modes de transport" ON agency_transport_modes;
  
  CREATE POLICY "Les utilisateurs peuvent lire les modes de transport"
    ON agency_transport_modes FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Les administrateurs peuvent tout faire sur les modes de transport"
    ON agency_transport_modes FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
    WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);
END $$;

-- Policies pour les mappings
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les mappings" ON agency_mappings;
  DROP POLICY IF EXISTS "Les administrateurs peuvent tout faire sur les mappings" ON agency_mappings;
  
  CREATE POLICY "Les utilisateurs peuvent lire les mappings"
    ON agency_mappings FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Les administrateurs peuvent tout faire sur les mappings"
    ON agency_mappings FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
    WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);
END $$;