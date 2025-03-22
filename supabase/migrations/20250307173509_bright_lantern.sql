/*
  # Mise à jour du schéma des réseaux et opérateurs

  1. Changements
    - Déplacement du champ "name" de la table "networks" vers la table "operators"
    - Renommage en "display_name" dans la table "operators"
    - Mise à jour des politiques de sécurité

  2. Étapes
    - Ajout de la colonne display_name dans operators
    - Copie des données de networks.name vers operators.display_name
    - Suppression de la colonne name dans networks
    - Mise à jour des politiques de sécurité
*/

-- Ajout de la colonne display_name dans operators
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operators' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE operators ADD COLUMN display_name text;
  END IF;
END $$;

-- Copie des données de networks.name vers operators.display_name
UPDATE operators o
SET display_name = n.name
FROM networks n
WHERE o.network_id = n.id;

-- Suppression de la colonne name dans networks
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'networks' AND column_name = 'name'
  ) THEN
    ALTER TABLE networks DROP COLUMN name;
  END IF;
END $$;

-- Mise à jour des politiques de sécurité pour operators
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les opérateurs" ON operators;
CREATE POLICY "Les utilisateurs peuvent lire les opérateurs"
  ON operators
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Les administrateurs peuvent modifier les opérateurs" ON operators;
CREATE POLICY "Les administrateurs peuvent modifier les opérateurs"
  ON operators
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);