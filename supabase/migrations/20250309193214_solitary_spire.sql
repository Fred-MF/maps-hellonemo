/*
  # Schéma de base de données pour les réseaux de transport

  1. Tables principales
    - `networks` : Table centrale pour les réseaux de transport
    - `operators` : Table des opérateurs liés aux réseaux
    - `network_transport_modes` : Table des modes de transport par réseau

  2. Relations
    - Un réseau peut avoir plusieurs opérateurs
    - Un réseau peut avoir plusieurs modes de transport
    - Les opérateurs sont liés à un seul réseau

  3. Sécurité
    - RLS activé sur toutes les tables
    - Politiques de lecture publique
    - Politiques d'écriture restreintes aux administrateurs
*/

-- Création de la table networks
CREATE TABLE IF NOT EXISTS networks (
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
CREATE TABLE IF NOT EXISTS operators (
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
CREATE TABLE IF NOT EXISTS network_transport_modes (
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
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'networks' 
    AND policyname = 'Lecture publique des réseaux'
  ) THEN
    CREATE POLICY "Lecture publique des réseaux" 
      ON networks FOR SELECT 
      TO public 
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'networks' 
    AND policyname = 'Modification des réseaux par les administrateurs'
  ) THEN
    CREATE POLICY "Modification des réseaux par les administrateurs" 
      ON networks FOR ALL 
      TO authenticated 
      USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
      WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);
  END IF;
END $$;

-- Politiques de sécurité pour operators
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'operators' 
    AND policyname = 'Lecture publique des opérateurs'
  ) THEN
    CREATE POLICY "Lecture publique des opérateurs" 
      ON operators FOR SELECT 
      TO public 
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'operators' 
    AND policyname = 'Modification des opérateurs par les administrateurs'
  ) THEN
    CREATE POLICY "Modification des opérateurs par les administrateurs" 
      ON operators FOR ALL 
      TO authenticated 
      USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
      WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);
  END IF;
END $$;

-- Politiques de sécurité pour network_transport_modes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'network_transport_modes' 
    AND policyname = 'Lecture publique des modes de transport'
  ) THEN
    CREATE POLICY "Lecture publique des modes de transport" 
      ON network_transport_modes FOR SELECT 
      TO public 
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'network_transport_modes' 
    AND policyname = 'Modification des modes de transport par les administrateurs'
  ) THEN
    CREATE POLICY "Modification des modes de transport par les administrateurs" 
      ON network_transport_modes FOR ALL 
      TO authenticated 
      USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
      WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);
  END IF;
END $$;

-- Création des index
CREATE INDEX IF NOT EXISTS idx_networks_region_id ON networks(region_id);
CREATE INDEX IF NOT EXISTS idx_networks_feed_id ON networks(feed_id);
CREATE INDEX IF NOT EXISTS idx_networks_gtfs_id ON networks(gtfs_id);
CREATE INDEX IF NOT EXISTS idx_networks_is_available ON networks(is_available);

CREATE INDEX IF NOT EXISTS idx_operators_network_id ON operators(network_id);
CREATE INDEX IF NOT EXISTS idx_operators_gtfs_id ON operators(gtfs_id);

CREATE INDEX IF NOT EXISTS idx_network_transport_modes_network_id ON network_transport_modes(network_id);
CREATE INDEX IF NOT EXISTS idx_network_transport_modes_mode ON network_transport_modes(mode);

-- Fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour la mise à jour automatique des timestamps
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_networks_updated_at'
  ) THEN
    CREATE TRIGGER update_networks_updated_at
      BEFORE UPDATE ON networks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_operators_updated_at'
  ) THEN
    CREATE TRIGGER update_operators_updated_at
      BEFORE UPDATE ON operators
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;