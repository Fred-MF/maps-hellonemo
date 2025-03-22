/*
  # Correction des noms d'agence

  1. Changements
    - Échange temporaire des valeurs entre agency_name et agency_displayname
    - Suppression de la colonne operator qui n'est plus utilisée

  2. Notes
    - Utilisation d'une colonne temporaire pour l'échange
    - Préservation des données existantes
*/

-- Ajouter une colonne temporaire
ALTER TABLE network_mapping 
ADD COLUMN temp_name text;

-- Copier agency_name dans temp_name
UPDATE network_mapping 
SET temp_name = agency_name;

-- Copier agency_displayname dans agency_name
UPDATE network_mapping 
SET agency_name = agency_displayname
WHERE agency_displayname IS NOT NULL;

-- Copier temp_name dans agency_displayname
UPDATE network_mapping 
SET agency_displayname = temp_name;

-- Supprimer la colonne temporaire
ALTER TABLE network_mapping 
DROP COLUMN temp_name;

-- Supprimer la colonne operator qui n'est plus utilisée
ALTER TABLE network_mapping 
DROP COLUMN IF EXISTS operator;