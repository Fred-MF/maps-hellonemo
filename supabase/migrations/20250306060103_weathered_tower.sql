/*
  # Schéma de gestion des agences de transport

  1. Nouvelles Tables
    - `agencies`
      - `id` (text, primary key) : Identifiant unique de l'agence
      - `name` (text) : Nom de l'agence
      - `gtfs_id` (text) : Identifiant GTFS de l'agence
      - `feed_id` (text) : Identifiant du feed GTFS
      - `region_id` (text) : Identifiant de la région
      - `last_check` (timestamptz) : Date de dernière vérification
      - `is_available` (boolean) : Disponibilité de l'agence
      - `error_message` (text) : Message d'erreur éventuel

    - `agency_transport_modes`
      - `id` (uuid, primary key) : Identifiant unique
      - `agency_id` (text) : Référence à l'agence
      - `mode` (text) : Mode de transport
      - `route_count` (integer) : Nombre de lignes
      - `check_time` (timestamptz) : Date de vérification

    - `agency_mappings`
      - `id` (uuid, primary key) : Identifiant unique
      - `agency_id` (text) : Référence à l'agence
      - `display_name` (text) : Nom d'affichage
      - `network_name` (text) : Nom du réseau
      - `created_at` (timestamptz) : Date de création
      - `updated_at` (timestamptz) : Date de mise à jour

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour permettre aux administrateurs de tout faire
    - Policies pour permettre aux utilisateurs authentifiés de lire les données

  3. Fonctions
    - Trigger pour mettre à jour automatiquement updated_at
*/

-- Fonction de mise à jour de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Table des agences
CREATE TABLE IF NOT EXISTS agencies (
  id text PRIMARY KEY,
  name text NOT NULL,
  gtfs_id text NOT NULL,
  feed_id text NOT NULL,
  region_id text NOT NULL,
  last_check timestamptz DEFAULT now(),
  is_available boolean DEFAULT true,
  error_message text,
  CONSTRAINT check_agency_region_id CHECK (region_id IN (
    'ara', 'bfc', 'bre', 'caraibe', 'cor', 'cvl', 'ges', 'gf',
    'hdf', 'idf', 'mar', 'naq', 'nor', 'occ', 'paca', 'pdl', 're'
  ))
);

-- Activer RLS sur la table agencies
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Supprimer la policy si elle existe déjà
DROP POLICY IF EXISTS "Les administrateurs peuvent tout faire sur agencies" ON agencies;

-- Créer la policy
CREATE POLICY "Les administrateurs peuvent tout faire sur agencies"
  ON agencies
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Table des modes de transport par agence
CREATE TABLE IF NOT EXISTS agency_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer NOT NULL DEFAULT 0,
  check_time timestamptz DEFAULT now(),
  UNIQUE(agency_id, mode, check_time)
);

-- Activer RLS sur la table agency_transport_modes
ALTER TABLE agency_transport_modes ENABLE ROW LEVEL SECURITY;

-- Supprimer la policy si elle existe déjà
DROP POLICY IF EXISTS "Les administrateurs peuvent tout faire sur agency_transport_mod" ON agency_transport_modes;

-- Créer la policy
CREATE POLICY "Les administrateurs peuvent tout faire sur agency_transport_mod"
  ON agency_transport_modes
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Table des mappings d'agences
CREATE TABLE IF NOT EXISTS agency_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  display_name text,
  network_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table agency_mappings
ALTER TABLE agency_mappings ENABLE ROW LEVEL SECURITY;

-- Supprimer la policy si elle existe déjà
DROP POLICY IF EXISTS "Les administrateurs peuvent tout faire sur agency_mappings" ON agency_mappings;

-- Créer la policy
CREATE POLICY "Les administrateurs peuvent tout faire sur agency_mappings"
  ON agency_mappings
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Trigger pour la mise à jour automatique de updated_at
DROP TRIGGER IF EXISTS update_agency_mappings_updated_at ON agency_mappings;
CREATE TRIGGER update_agency_mappings_updated_at
  BEFORE UPDATE ON agency_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_agencies_region_id ON agencies(region_id);
CREATE INDEX IF NOT EXISTS idx_agency_transport_modes_agency_id ON agency_transport_modes(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_mappings_agency_id ON agency_mappings(agency_id);