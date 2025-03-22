/*
  # Création du schéma de base de données pour MaaSify

  1. Tables
    - regions : Régions françaises avec leurs API
    - networks : Réseaux de transport
    - operators : Opérateurs de transport
    - operator_transport_modes : Modes de transport par opérateur
    - operator_status : Historique des statuts des opérateurs

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques de lecture publique
    - Politiques d'écriture restreintes aux administrateurs

  3. Relations
    - Un opérateur appartient à un réseau
    - Un réseau appartient à une région
    - Un opérateur peut avoir plusieurs modes de transport
    - Un opérateur peut avoir plusieurs statuts
*/

-- Création de la fonction de mise à jour de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Création des tables
CREATE TABLE IF NOT EXISTS regions (
  id text PRIMARY KEY,
  name text NOT NULL,
  api_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text,
  region_id text NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(name, region_id)
);

CREATE TABLE IF NOT EXISTS operators (
  id text PRIMARY KEY,
  name text NOT NULL,
  gtfs_id text NOT NULL,
  feed_id text NOT NULL,
  network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  is_available boolean DEFAULT true,
  last_check timestamptz DEFAULT now(),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operator_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id text NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer DEFAULT 0,
  check_time timestamptz DEFAULT now(),
  UNIQUE(operator_id, mode)
);

CREATE TABLE IF NOT EXISTS operator_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id text NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  is_available boolean NOT NULL,
  error_message text,
  check_time timestamptz DEFAULT now()
);

-- Activation de RLS
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_transport_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_status ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour les régions
DROP POLICY IF EXISTS "Lecture publique des régions" ON regions;
CREATE POLICY "Lecture publique des régions" ON regions
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Modification des régions par les administrateurs" ON regions;
CREATE POLICY "Modification des régions par les administrateurs" ON regions
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@maasify.io')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@maasify.io');

-- Politiques de sécurité pour les réseaux
DROP POLICY IF EXISTS "Lecture publique des réseaux" ON networks;
CREATE POLICY "Lecture publique des réseaux" ON networks
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Modification des réseaux par les administrateurs" ON networks;
CREATE POLICY "Modification des réseaux par les administrateurs" ON networks
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@maasify.io')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@maasify.io');

-- Politiques de sécurité pour les opérateurs
DROP POLICY IF EXISTS "Lecture publique des opérateurs" ON operators;
CREATE POLICY "Lecture publique des opérateurs" ON operators
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Modification des opérateurs par les administrateurs" ON operators;
CREATE POLICY "Modification des opérateurs par les administrateurs" ON operators
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@maasify.io')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@maasify.io');

-- Politiques de sécurité pour les modes de transport
DROP POLICY IF EXISTS "Lecture publique des modes de transport" ON operator_transport_modes;
CREATE POLICY "Lecture publique des modes de transport" ON operator_transport_modes
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Modification des modes de transport par les administrateurs" ON operator_transport_modes;
CREATE POLICY "Modification des modes de transport par les administrateurs" ON operator_transport_modes
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@maasify.io')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@maasify.io');

-- Politiques de sécurité pour les statuts
DROP POLICY IF EXISTS "Lecture publique des statuts" ON operator_status;
CREATE POLICY "Lecture publique des statuts" ON operator_status
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Modification des statuts par les administrateurs" ON operator_status;
CREATE POLICY "Modification des statuts par les administrateurs" ON operator_status
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@maasify.io')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@maasify.io');

-- Triggers pour la mise à jour automatique de updated_at
DROP TRIGGER IF EXISTS update_regions_updated_at ON regions;
CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON regions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_networks_updated_at ON networks;
CREATE TRIGGER update_networks_updated_at
  BEFORE UPDATE ON networks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_operators_updated_at ON operators;
CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();