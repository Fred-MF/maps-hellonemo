/*
  # Mise à jour de la table network_mapping pour l'import des agences

  1. Modifications
    - Ajout des colonnes agency_name et agency_displayname si elles n'existent pas
    - Ajout d'un trigger pour mettre à jour updated_at automatiquement
    - Ajout d'un index sur agency_name pour optimiser les recherches
    - Ajout de commentaires pour la documentation

  2. Sécurité
    - Aucun changement dans les politiques de sécurité existantes
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

-- Création d'un index pour optimiser les recherches sur agency_name
CREATE INDEX IF NOT EXISTS idx_network_mapping_agency_name ON network_mapping(agency_name);

-- Création d'un trigger pour la mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_network_mapping_updated_at ON network_mapping;

CREATE TRIGGER update_network_mapping_updated_at
    BEFORE UPDATE ON network_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();