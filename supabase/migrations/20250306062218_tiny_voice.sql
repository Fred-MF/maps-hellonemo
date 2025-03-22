/*
  # Création de la table agencies

  1. Structure
    - Table `agencies` pour stocker les informations de base des agences de transport
    - Contraintes et index pour optimiser les performances
    - Politiques de sécurité RLS avec vérification préalable

  2. Colonnes
    - `id` (text, primary key) : Identifiant unique de l'agence
    - `name` (text) : Nom de l'agence
    - `gtfs_id` (text) : Identifiant GTFS de l'agence
    - `feed_id` (text) : Identifiant du feed GTFS
    - `region_id` (text) : Identifiant de la région
    - `is_available` (boolean) : État de disponibilité de l'agence
    - `last_check` (timestamp) : Date de dernière vérification
    - `error_message` (text) : Message d'erreur éventuel

  3. Sécurité
    - RLS activé
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

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_agencies_region_id ON agencies(region_id);
CREATE INDEX IF NOT EXISTS idx_agencies_feed_id ON agencies(feed_id);
CREATE INDEX IF NOT EXISTS idx_agencies_gtfs_id ON agencies(gtfs_id);
CREATE INDEX IF NOT EXISTS idx_agencies_name ON agencies(name);
CREATE INDEX IF NOT EXISTS idx_agencies_is_available ON agencies(is_available);

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les agences" ON agencies;
  DROP POLICY IF EXISTS "Les administrateurs peuvent tout faire sur les agences" ON agencies;
END $$;

-- Créer les nouvelles politiques
CREATE POLICY "Les utilisateurs peuvent lire les agences"
  ON agencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Les administrateurs peuvent tout faire sur les agences"
  ON agencies FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);