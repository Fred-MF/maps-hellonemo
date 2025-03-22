/*
  # Ajout du champ feed_filter

  1. Modifications
    - Ajout de la colonne feed_filter de type jsonb pour stocker les filtres GTFS
    - Ajout d'un index GIN pour optimiser les recherches dans le JSON
    - Ajout de commentaires pour la documentation

  2. Sécurité
    - Aucun changement dans les politiques existantes
*/

-- Ajout de la colonne feed_filter si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'network_mapping' 
    AND column_name = 'feed_filter'
  ) THEN
    ALTER TABLE network_mapping ADD COLUMN feed_filter jsonb;
  END IF;
END $$;

-- Création d'un index GIN pour les recherches dans le JSON
CREATE INDEX IF NOT EXISTS idx_network_mapping_feed_filter ON network_mapping USING GIN (feed_filter);

-- Ajout d'un commentaire pour la documentation
COMMENT ON COLUMN network_mapping.feed_filter IS 'Configuration des filtres GTFS au format JSON pour le mapping des agences';