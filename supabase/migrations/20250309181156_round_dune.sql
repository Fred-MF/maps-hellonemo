/*
  # Restructuration de la base de données pour unifier networks et agencies

  Cette migration va :
  1. Sauvegarder les données existantes
  2. Supprimer les anciennes tables
  3. Créer les nouvelles tables
  4. Migrer les données
  5. Configurer la sécurité
*/

-- Vérifier si les tables source existent et créer les tables temporaires
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agencies') THEN
    CREATE TEMP TABLE temp_networks AS
    SELECT 
      a.id,
      a.name,
      COALESCE(am.display_name, a.name) as display_name,
      a.gtfs_id,
      a.feed_id,
      a.region_id,
      a.is_available,
      a.last_check,
      a.error_message,
      a.created_at,
      a.updated_at
    FROM agencies a
    LEFT JOIN agency_mappings am ON a.id = am.agency_id;

    CREATE TEMP TABLE temp_modes AS
    SELECT * FROM agency_transport_modes;
  END IF;
END $$;

-- Supprimer les anciennes tables s'il y en a
DROP TABLE IF EXISTS agency_mappings CASCADE;
DROP TABLE IF EXISTS agency_transport_modes CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;
DROP TABLE IF EXISTS operators CASCADE;
DROP TABLE IF EXISTS network_transport_modes CASCADE;
DROP TABLE IF EXISTS networks CASCADE;

-- Créer les nouvelles tables
CREATE TABLE networks (
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

CREATE TABLE network_transport_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id TEXT REFERENCES networks(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  route_count INTEGER DEFAULT 0,
  check_time TIMESTAMPTZ DEFAULT now(),
  UNIQUE(network_id, mode)
);

CREATE TABLE operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id TEXT REFERENCES networks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gtfs_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrer les données si les tables temporaires existent
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'pg_temp' AND tablename = 'temp_networks') THEN
    -- Restaurer les données depuis les tables temporaires
    INSERT INTO networks 
    SELECT * FROM temp_networks;

    INSERT INTO network_transport_modes (
      network_id,
      mode,
      route_count,
      check_time
    )
    SELECT 
      agency_id,
      mode,
      route_count,
      check_time
    FROM temp_modes;

    INSERT INTO operators (
      network_id,
      name,
      gtfs_id,
      is_active,
      created_at,
      updated_at
    )
    SELECT 
      id,
      name,
      gtfs_id,
      true,
      created_at,
      updated_at
    FROM temp_networks;

    -- Supprimer les tables temporaires
    DROP TABLE temp_networks;
    DROP TABLE temp_modes;
  END IF;
END $$;

-- Activer RLS sur les nouvelles tables
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_transport_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Créer les politiques de sécurité
CREATE POLICY "Lecture publique des réseaux" ON networks
  FOR SELECT TO public USING (true);

CREATE POLICY "Modification des réseaux par les administrateurs" ON networks
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

CREATE POLICY "Lecture publique des modes de transport" ON network_transport_modes
  FOR SELECT TO public USING (true);

CREATE POLICY "Modification des modes de transport par les administrateurs" ON network_transport_modes
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

CREATE POLICY "Lecture publique des opérateurs" ON operators
  FOR SELECT TO public USING (true);

CREATE POLICY "Modification des opérateurs par les administrateurs" ON operators
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Créer les triggers pour updated_at
CREATE TRIGGER update_networks_updated_at
  BEFORE UPDATE ON networks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Créer les index pour améliorer les performances
CREATE INDEX idx_networks_region_id ON networks(region_id);
CREATE INDEX idx_networks_display_name ON networks(display_name);
CREATE INDEX idx_networks_is_available ON networks(is_available);
CREATE INDEX idx_network_transport_modes_mode ON network_transport_modes(mode);
CREATE INDEX idx_operators_network_id ON operators(network_id);
CREATE INDEX idx_operators_gtfs_id ON operators(gtfs_id);