/*
  # Simplification de la structure de la base de données

  1. Suppression des tables existantes
    - Supprime toutes les tables actuelles pour repartir sur une base propre

  2. Nouvelle structure
    - Table `networks` : informations de base des réseaux
    - Table `operators` : opérateurs liés aux réseaux
    - Table `network_transport_modes` : modes de transport des réseaux (ajoutée séparément)

  3. Sécurité
    - Active RLS sur toutes les tables
    - Ajoute des politiques de sécurité appropriées
*/

-- Suppression des tables existantes si elles existent
DROP TABLE IF EXISTS network_transport_modes CASCADE;
DROP TABLE IF EXISTS operators CASCADE;
DROP TABLE IF EXISTS networks CASCADE;

-- Création de la table networks
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
  updated_at timestamptz DEFAULT now()
);

-- Création de la table operators
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

-- Création de la table network_transport_modes
CREATE TABLE network_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer DEFAULT 0,
  check_time timestamptz DEFAULT now(),
  UNIQUE(network_id, mode)
);

-- Activation de RLS
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_transport_modes ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour networks
CREATE POLICY "Lecture publique des réseaux v2" 
  ON networks FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Modification des réseaux par les administrateurs v2" 
  ON networks FOR ALL 
  TO authenticated 
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Politiques de sécurité pour operators
CREATE POLICY "Lecture publique des opérateurs v2" 
  ON operators FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Modification des opérateurs par les administrateurs v2" 
  ON operators FOR ALL 
  TO authenticated 
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Politiques de sécurité pour network_transport_modes
CREATE POLICY "Lecture publique des modes de transport v2" 
  ON network_transport_modes FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Modification des modes de transport par les administrateurs v2" 
  ON network_transport_modes FOR ALL 
  TO authenticated 
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Création des index
CREATE INDEX idx_networks_region_id ON networks(region_id);
CREATE INDEX idx_networks_feed_id ON networks(feed_id);
CREATE INDEX idx_networks_gtfs_id ON networks(gtfs_id);
CREATE INDEX idx_networks_is_available ON networks(is_available);

CREATE INDEX idx_operators_network_id ON operators(network_id);
CREATE INDEX idx_operators_gtfs_id ON operators(gtfs_id);

CREATE INDEX idx_network_transport_modes_network_id ON network_transport_modes(network_id);
CREATE INDEX idx_network_transport_modes_mode ON network_transport_modes(mode);