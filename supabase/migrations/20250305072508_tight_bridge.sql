/*
  # Ajout des colonnes agency_name et agency_displayname

  1. Modifications
    - Ajout des colonnes agency_name et agency_displayname
    - Création d'un index unique sur agency_name (ignorant les NULL)
    - Ajout de commentaires pour la documentation

  2. Sécurité
    - Aucun changement dans les politiques existantes

  Note: L'index unique sur agency_name ignore les valeurs NULL pour permettre une migration progressive
*/

-- Ajout des colonnes si elles n'existent pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'network_mapping' 
    AND column_name = 'agency_name'
  ) THEN
    ALTER TABLE network_mapping ADD COLUMN agency_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'network_mapping' 
    AND column_name = 'agency_displayname'
  ) THEN
    ALTER TABLE network_mapping ADD COLUMN agency_displayname text;
  END IF;
END $$;

-- Supprimer l'ancien index s'il existe
DROP INDEX IF EXISTS idx_network_mapping_agency_name;

-- Créer un index standard pour les recherches
CREATE INDEX idx_network_mapping_agency_name_search 
ON network_mapping(agency_name);

-- Mettre à jour les commentaires
COMMENT ON COLUMN network_mapping.agency_name IS 'Identifiant unique de l''agence utilisé pour le mapping avec les feeds GTFS';
COMMENT ON COLUMN network_mapping.agency_displayname IS 'Nom d''affichage de l''agence pour l''interface utilisateur';
COMMENT ON COLUMN network_mapping.feed_id IS 'Identifiant du feed GTFS (peut être mis à jour automatiquement)';