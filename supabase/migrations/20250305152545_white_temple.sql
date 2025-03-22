/*
  # Ajout du nom technique du réseau

  1. Changements
    - Ajout de la colonne `network_name` pour stocker le nom technique du réseau
    - Cette colonne est distincte de `agency_name` qui est utilisé pour l'API
    - Initialisation avec la valeur de `agency_name` pour la rétrocompatibilité

  2. Notes
    - La colonne est nullable pour permettre une migration progressive
    - Les données existantes sont préservées
*/

-- Ajouter la colonne network_name
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'network_mapping' 
    AND column_name = 'network_name'
  ) THEN
    ALTER TABLE network_mapping 
      ADD COLUMN network_name text;

    -- Initialiser network_name avec agency_name pour la rétrocompatibilité
    UPDATE network_mapping 
    SET network_name = agency_name;
  END IF;
END $$;