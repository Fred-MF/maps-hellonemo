/*
  # Ajout des colonnes pour les noms d'agence

  1. Nouvelles colonnes
    - `agency_name` : Nom technique de l'agence pour le mapping
    - `agency_displayname` : Nom public de l'agence pour l'affichage

  2. Modifications
    - Ajout des colonnes à la table network_mapping
    - Mise à jour des contraintes et index
*/

-- Ajout des colonnes pour les noms d'agence
ALTER TABLE network_mapping
ADD COLUMN agency_name text,
ADD COLUMN agency_displayname text;

-- Mise à jour du trigger de mise à jour automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Création d'un index pour faciliter les recherches sur agency_name
CREATE INDEX idx_network_mapping_agency_name ON network_mapping(agency_name);