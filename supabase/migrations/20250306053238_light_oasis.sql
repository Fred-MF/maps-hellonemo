/*
  # Ajout de la région aux agences

  1. Changements
    - Ajout de la colonne region_id à la table agencies
    - Mise à jour de la procédure de vérification des agences

  2. Sécurité
    - Maintien des politiques RLS existantes
*/

-- Ajouter la colonne region_id à la table agencies
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS region_id text;

-- Ajouter une contrainte de vérification pour les valeurs valides de region_id
ALTER TABLE agencies ADD CONSTRAINT check_agency_region_id CHECK (
  region_id = ANY (ARRAY[
    'ara', 'bfc', 'bre', 'caraibe', 'cor', 'cvl', 'ges', 'gf',
    'hdf', 'idf', 'mar', 'naq', 'nor', 'occ', 'paca', 'pdl', 're'
  ])
);

-- Mettre à jour la fonction de vérification des agences
CREATE OR REPLACE FUNCTION update_agency_mapping_on_agency_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le mapping avec le nom de l'agence comme nom d'affichage par défaut
  -- et conserver la région
  PERFORM update_agency_mapping(
    NEW.id,
    NEW.name,
    NULL,
    NEW.region_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour la fonction de mapping des agences pour inclure la région
CREATE OR REPLACE FUNCTION update_agency_mapping(
  p_agency_id text,
  p_display_name text,
  p_network_name text,
  p_region_id text
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

    -- Mettre à jour la région dans la table agencies
    UPDATE agencies
    SET region_id = p_region_id
    WHERE id = p_agency_id;
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

    -- Mettre à jour la région dans la table agencies
    UPDATE agencies
    SET region_id = p_region_id
    WHERE id = p_agency_id;
  END IF;
END;
$$ LANGUAGE plpgsql;