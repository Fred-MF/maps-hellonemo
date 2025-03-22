/*
  # Ajout du support des tracés GTFS

  1. Nouvelle Table
    - `route_shapes`
      - `id` (uuid, clé primaire)
      - `route_id` (text, identifiant GTFS de la route)
      - `agency_id` (text, référence vers agencies)
      - `shape_points` (jsonb, tableau de points du tracé)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur la table route_shapes
    - Ajout d'une policy pour la lecture publique
    - Ajout d'une policy pour la modification par les administrateurs

  3. Indexes
    - Index sur route_id pour les recherches rapides
    - Index sur agency_id pour les jointures
*/

-- Création de la table route_shapes
CREATE TABLE IF NOT EXISTS route_shapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id text NOT NULL,
  agency_id text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  shape_points jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(route_id, agency_id)
);

-- Création des indexes
CREATE INDEX IF NOT EXISTS idx_route_shapes_route_id ON route_shapes(route_id);
CREATE INDEX IF NOT EXISTS idx_route_shapes_agency_id ON route_shapes(agency_id);

-- Activation de RLS
ALTER TABLE route_shapes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Lecture publique des tracés"
  ON route_shapes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Modification des tracés par les administrateurs"
  ON route_shapes
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_route_shapes_updated_at
  BEFORE UPDATE ON route_shapes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();