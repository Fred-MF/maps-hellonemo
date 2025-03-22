/*
  # Mise à jour de la structure des réseaux et opérateurs

  1. Modifications
    - Suppression des colonnes gtfs_id et feed_id de la table networks
    - Ajout de la colonne feed_id dans la table operators

  2. Changements
    - Les réseaux n'ont plus de lien direct avec les données GTFS
    - Les opérateurs contiennent maintenant toutes les informations GTFS nécessaires
    - La relation réseau-opérateur est maintenue via network_id

  3. Sécurité
    - Les politiques de sécurité existantes sont préservées
*/

-- Supprimer les colonnes de la table networks
ALTER TABLE networks 
  DROP COLUMN gtfs_id,
  DROP COLUMN feed_id;

-- Ajouter la colonne feed_id à la table operators
ALTER TABLE operators
  ADD COLUMN feed_id text NOT NULL DEFAULT 'default';

-- Mettre à jour les index
DROP INDEX IF EXISTS idx_networks_gtfs_id;
CREATE INDEX IF NOT EXISTS idx_operators_feed_id ON operators(feed_id);