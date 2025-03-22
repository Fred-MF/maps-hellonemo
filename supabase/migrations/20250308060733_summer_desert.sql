/*
  # Ajout de la contrainte unique sur agency_transport_modes

  1. Modifications
    - Ajout d'une contrainte unique sur (agency_id, mode) pour la table agency_transport_modes
    - Cette contrainte est nécessaire pour permettre l'utilisation de ON CONFLICT lors des upserts

  2. Sécurité
    - Aucun changement de sécurité
*/

-- Ajouter la contrainte unique sur agency_transport_modes
ALTER TABLE agency_transport_modes
ADD CONSTRAINT agency_transport_modes_agency_id_mode_key UNIQUE (agency_id, mode);