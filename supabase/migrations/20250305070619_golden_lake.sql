/*
  # Ajout des colonnes agency_name et agency_displayname

  1. Modifications
    - Ajout de la colonne agency_name pour le nom technique de l'agence
    - Ajout de la colonne agency_displayname pour le nom d'affichage de l'agence
    - Mise à jour des types pour inclure les nouveaux champs

  2. Sécurité
    - Aucun changement dans les politiques de sécurité
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

-- Ajout des commentaires pour la documentation
COMMENT ON COLUMN network_mapping.agency_name IS 'Nom technique de l''agence utilisé pour le mapping GTFS';
COMMENT ON COLUMN network_mapping.agency_displayname IS 'Nom d''affichage de l''agence pour l''interface utilisateur';