/*
  # Renommer les colonnes de la table network_mapping

  1. Changements
    - Renommer la colonne "name" en "agency_name"
    - Renommer la colonne "operator" en "agency_displayname"
    - Supprimer la colonne "agency_name" existante qui fait doublon
    - Supprimer la colonne "agency_displayname" existante qui fait doublon

  2. Notes
    - Les données des colonnes existantes seront préservées
    - Les contraintes et index sont automatiquement mis à jour
*/

DO $$ 
BEGIN
  -- Vérifier si les colonnes existent avant de les supprimer
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'network_mapping' AND column_name = 'agency_name'
  ) THEN
    ALTER TABLE network_mapping DROP COLUMN agency_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'network_mapping' AND column_name = 'agency_displayname'
  ) THEN
    ALTER TABLE network_mapping DROP COLUMN agency_displayname;
  END IF;
END $$;

-- Renommer les colonnes
ALTER TABLE network_mapping RENAME COLUMN name TO agency_name;
ALTER TABLE network_mapping RENAME COLUMN operator TO agency_displayname;