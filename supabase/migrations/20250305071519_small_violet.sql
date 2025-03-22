/*
  # Amélioration du mapping des régions

  1. Modifications
    - Ajout d'un index sur region_id pour optimiser les recherches
    - Ajout d'une contrainte CHECK pour valider les region_id
    - Mise à jour des commentaires pour la documentation

  2. Sécurité
    - Aucun changement dans les politiques existantes
*/

-- Création d'un index sur region_id
CREATE INDEX IF NOT EXISTS idx_network_mapping_region_id ON network_mapping(region_id);

-- Ajout d'une contrainte CHECK pour valider les region_id
ALTER TABLE network_mapping DROP CONSTRAINT IF EXISTS check_region_id;
ALTER TABLE network_mapping ADD CONSTRAINT check_region_id 
  CHECK (region_id IN (
    'ara', 'bfc', 'bre', 'caraibe', 'cor', 'cvl', 'ges', 'gf',
    'hdf', 'idf', 'mar', 'naq', 'nor', 'occ', 'paca', 'pdl', 're'
  ));

-- Ajout d'un commentaire sur la colonne region_id
COMMENT ON COLUMN network_mapping.region_id IS 'Identifiant de la région (ara, paca, idf, etc.)';

-- Mise à jour des region_id incorrects
UPDATE network_mapping 
SET region_id = 'paca' 
WHERE region_id = 'provence alpes cote dazur' 
   OR region_id = 'provence-alpes-cote-dazur'
   OR region_id = 'provence alpes côte d''azur';