/*
  # Structure de base des réseaux de transport

  1. Tables
    - `networks`: Table principale des réseaux de transport
      - `id` (text, primary key)
      - `name` (text)
      - `display_name` (text, nullable)
      - `gtfs_id` (text)
      - `feed_id` (text)
      - `region_id` (text, foreign key)
      - `is_available` (boolean)
      - `last_check` (timestamptz)
      - `error_message` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `operators`: Table des opérateurs de transport
      - `id` (uuid, primary key)
      - `network_id` (text, foreign key)
      - `name` (text)
      - `gtfs_id` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques de lecture publique
    - Politiques d'écriture pour les administrateurs
*/

-- Création de la table networks
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Création de la table operators
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Activation de RLS
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour networks
DO $$ BEGIN
  DROP POLICY IF EXISTS "Lecture publique des réseaux" ON networks;
  CREATE POLICY "Lecture publique des réseaux" 
    ON networks FOR SELECT 
    TO public 
    USING (true);

  DROP POLICY IF EXISTS "Modification des réseaux par les administrateurs" ON networks;
  CREATE POLICY "Modification des réseaux par les administrateurs" 
    ON networks FOR ALL 
    TO authenticated 
    USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
    WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);
END $$;

-- Politiques de sécurité pour operators
DO $$ BEGIN
  DROP POLICY IF EXISTS "Lecture publique des opérateurs" ON operators;
  CREATE POLICY "Lecture publique des opérateurs" 
    ON operators FOR SELECT 
    TO public 
    USING (true);

  DROP POLICY IF EXISTS "Modification des opérateurs par les administrateurs" ON operators;
  CREATE POLICY "Modification des opérateurs par les administrateurs" 
    ON operators FOR ALL 
    TO authenticated 
    USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
    WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);
END $$;

-- Création des index
CREATE INDEX IF NOT EXISTS idx_networks_region_id ON networks(region_id);
CREATE INDEX IF NOT EXISTS idx_networks_feed_id ON networks(feed_id);
CREATE INDEX IF NOT EXISTS idx_networks_gtfs_id ON networks(gtfs_id);
CREATE INDEX IF NOT EXISTS idx_networks_is_available ON networks(is_available);

CREATE INDEX IF NOT EXISTS idx_operators_network_id ON operators(network_id);
CREATE INDEX IF NOT EXISTS idx_operators_gtfs_id ON operators(gtfs_id);