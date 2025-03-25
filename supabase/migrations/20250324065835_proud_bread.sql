/*
  # Réorganisation des champs des tables networks et operators

  1. Changements
    - Suppression du champ feed_id redondant de la table operators
    - Réorganisation de l'ordre des champs dans les tables networks et operators
    - Mise à jour des contraintes et index

  2. Notes
    - feed_id est déjà présent dans la table networks
    - L'ordre des champs est modifié pour une meilleure lisibilité
*/

-- Supprimer le champ feed_id de la table operators
ALTER TABLE operators DROP COLUMN IF EXISTS feed_id;

-- Recréer la table networks avec le bon ordre des champs
CREATE TABLE new_networks (
  id text PRIMARY KEY,
  feed_id text NOT NULL,
  display_name text,
  region_id text NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  is_available boolean DEFAULT true,
  last_check timestamptz DEFAULT now(),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Copier les données dans la nouvelle table
INSERT INTO new_networks (
  id,
  feed_id,
  display_name,
  region_id,
  is_available,
  last_check,
  error_message,
  created_at,
  updated_at
)
SELECT
  id,
  feed_id,
  display_name,
  region_id,
  is_available,
  last_check,
  error_message,
  created_at,
  updated_at
FROM networks;

-- Supprimer l'ancienne table et renommer la nouvelle
DROP TABLE networks CASCADE;
ALTER TABLE new_networks RENAME TO networks;

-- Recréer la table operators avec le bon ordre des champs
CREATE TABLE new_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  agency_id text,
  name text NOT NULL,
  display_name text,
  gtfs_id text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(network_id, gtfs_id)
);

-- Copier les données dans la nouvelle table
INSERT INTO new_operators (
  id,
  network_id,
  agency_id,
  name,
  display_name,
  gtfs_id,
  is_active,
  created_at,
  updated_at
)
SELECT
  id,
  network_id,
  agency_id,
  name,
  display_name,
  gtfs_id,
  is_active,
  created_at,
  updated_at
FROM operators;

-- Supprimer l'ancienne table et renommer la nouvelle
DROP TABLE operators CASCADE;
ALTER TABLE new_operators RENAME TO operators;

-- Recréer les index
CREATE INDEX idx_networks_region_id ON networks(region_id);
CREATE INDEX idx_networks_feed_id ON networks(feed_id);
CREATE INDEX idx_networks_is_available ON networks(is_available);

CREATE INDEX idx_operators_network_id ON operators(network_id);
CREATE INDEX idx_operators_agency_id ON operators(agency_id);
CREATE INDEX idx_operators_gtfs_id ON operators(gtfs_id);
CREATE INDEX idx_operators_display_name ON operators(display_name);

-- Activer RLS sur les nouvelles tables
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Recréer les politiques de sécurité pour networks
CREATE POLICY "Lecture publique des réseaux"
  ON networks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Modification des réseaux par les administrateurs"
  ON networks FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Recréer les politiques de sécurité pour operators
CREATE POLICY "Lecture publique des opérateurs"
  ON operators FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Modification des opérateurs par les administrateurs"
  ON operators FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Recréer les triggers pour updated_at
CREATE TRIGGER update_networks_updated_at
  BEFORE UPDATE ON networks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();