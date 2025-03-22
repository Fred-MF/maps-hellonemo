/*
  # Correction des types pour la relation entre network_mapping et network_status

  1. Modifications
    - Ajout de la colonne network_id de type integer dans network_status
    - Ajout de la contrainte de clé étrangère
    - Création d'un index pour optimiser les performances

  2. Sécurité
    - Maintien des politiques RLS existantes
*/

-- Ajout de la colonne network_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'network_status' 
    AND column_name = 'network_id'
  ) THEN
    ALTER TABLE network_status ADD COLUMN network_id integer NOT NULL;
  END IF;
END $$;

-- Ajout de la contrainte de clé étrangère
ALTER TABLE network_status
ADD CONSTRAINT fk_network_mapping
FOREIGN KEY (network_id)
REFERENCES network_mapping(id)
ON DELETE CASCADE;

-- Création d'un index pour améliorer les performances des jointures
CREATE INDEX idx_network_status_network_id ON network_status(network_id);