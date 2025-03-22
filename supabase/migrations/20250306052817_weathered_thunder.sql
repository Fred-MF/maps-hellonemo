/*
  # Mise à jour de la procédure de vérification des agences

  1. Nouvelles Tables
    - `agency_mappings`
      - `id` (uuid, clé primaire)
      - `agency_id` (text, clé étrangère vers agencies)
      - `display_name` (text, nullable)
      - `network_name` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changements
    - Ajout de la table agency_mappings si elle n'existe pas
    - Ajout des fonctions de mise à jour des mappings
    - Configuration de la sécurité RLS

  3. Sécurité
    - Enable RLS sur la nouvelle table
    - Politique d'accès pour les administrateurs
*/

-- Créer la table agency_mappings si elle n'existe pas
CREATE TABLE IF NOT EXISTS agency_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  display_name text,
  network_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer un index sur agency_id
CREATE INDEX IF NOT EXISTS idx_agency_mappings_agency_id ON agency_mappings(agency_id);

-- Fonction pour mettre à jour ou créer un mapping d'agence
CREATE OR REPLACE FUNCTION update_agency_mapping(
  p_agency_id text,
  p_display_name text,
  p_network_name text
) RETURNS void AS $$
BEGIN
  -- Vérifier si un mapping existe déjà pour cette agence
  IF EXISTS (
    SELECT 1 FROM agency_mappings WHERE agency_id = p_agency_id
  ) THEN
    -- Mettre à jour le mapping existant
    UPDATE agency_mappings
    SET
      display_name = COALESCE(p_display_name, display_name),
      network_name = COALESCE(p_network_name, network_name),
      updated_at = now()
    WHERE agency_id = p_agency_id;
  ELSE
    -- Créer un nouveau mapping
    INSERT INTO agency_mappings (
      agency_id,
      display_name,
      network_name,
      created_at,
      updated_at
    ) VALUES (
      p_agency_id,
      p_display_name,
      p_network_name,
      now(),
      now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le mapping lors de la mise à jour d'une agence
CREATE OR REPLACE FUNCTION update_agency_mapping_on_agency_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le mapping avec le nom de l'agence comme nom d'affichage par défaut
  PERFORM update_agency_mapping(
    NEW.id,
    NEW.name,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS agency_mapping_update ON agencies;

-- Créer le trigger sur la table agencies
CREATE TRIGGER agency_mapping_update
AFTER INSERT OR UPDATE ON agencies
FOR EACH ROW
EXECUTE FUNCTION update_agency_mapping_on_agency_update();

-- S'assurer que la RLS est activée sur la table agency_mappings
ALTER TABLE agency_mappings ENABLE ROW LEVEL SECURITY;

-- Supprimer la politique si elle existe déjà
DROP POLICY IF EXISTS "Les administrateurs peuvent tout faire sur agency_mappings" ON agency_mappings;

-- Créer la politique pour les administrateurs
CREATE POLICY "Les administrateurs peuvent tout faire sur agency_mappings"
ON agency_mappings
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);