/*
  # Création des tables networks et operators

  1. Nouvelles Tables
    - `networks`
      - `id` (text, primary key) - Format: {region_id}:{gtfs_id}
      - `name` (text) - Nom technique du réseau
      - `display_name` (text, nullable) - Nom d'affichage du réseau
      - `gtfs_id` (text) - Identifiant GTFS du réseau
      - `feed_id` (text) - Identifiant du feed GTFS
      - `region_id` (text) - Référence vers la région
      - `is_available` (boolean) - État de disponibilité du réseau
      - `last_check` (timestamptz) - Date de dernière vérification
      - `error_message` (text, nullable) - Message d'erreur éventuel
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de mise à jour

    - `operators`
      - `id` (uuid, primary key)
      - `network_id` (text) - Référence vers le réseau
      - `name` (text) - Nom de l'opérateur
      - `gtfs_id` (text) - Identifiant GTFS de l'opérateur
      - `is_active` (boolean) - État d'activation de l'opérateur
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de mise à jour

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for admin write access
*/

-- Table des réseaux
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
  updated_at timestamptz DEFAULT now(),
  UNIQUE(gtfs_id, region_id)
);

-- Table des opérateurs
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

-- Trigger pour la mise à jour automatique du champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_networks_updated_at
  BEFORE UPDATE ON networks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS sur toutes les tables
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour la lecture publique
CREATE POLICY "Lecture publique des réseaux"
  ON networks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Lecture publique des opérateurs"
  ON operators FOR SELECT
  TO public
  USING (true);

-- Politiques de sécurité pour l'écriture par les administrateurs
CREATE POLICY "Modification des réseaux par les administrateurs"
  ON networks FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

CREATE POLICY "Modification des opérateurs par les administrateurs"
  ON operators FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_networks_region_id ON networks(region_id);
CREATE INDEX IF NOT EXISTS idx_networks_gtfs_id ON networks(gtfs_id);
CREATE INDEX IF NOT EXISTS idx_networks_is_available ON networks(is_available);
CREATE INDEX IF NOT EXISTS idx_operators_network_id ON operators(network_id);
CREATE INDEX IF NOT EXISTS idx_operators_gtfs_id ON operators(gtfs_id);