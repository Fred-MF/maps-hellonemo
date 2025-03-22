/*
  # Nettoyage et simplification du schéma de la base de données

  1. Suppression des tables
    - Supprime toutes les tables existantes sauf `regions`
    - Supprime les triggers et fonctions associés

  2. Nouvelles tables
    - `networks` : Table principale des réseaux de transport
    - `network_transport_modes` : Modes de transport par réseau
    - `operators` : Opérateurs de transport par réseau

  3. Sécurité
    - Active RLS sur toutes les tables
    - Ajoute des politiques de lecture publique
    - Ajoute des politiques d'écriture pour les administrateurs
*/

-- Suppression des tables existantes
DROP TABLE IF EXISTS route_shapes CASCADE;
DROP TABLE IF EXISTS network_status CASCADE;
DROP TABLE IF EXISTS network_transport_modes CASCADE;
DROP TABLE IF EXISTS network_mapping CASCADE;
DROP TABLE IF EXISTS agency_transport_modes CASCADE;
DROP TABLE IF EXISTS agency_mappings CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;
DROP TABLE IF EXISTS operators CASCADE;
DROP TABLE IF EXISTS networks CASCADE;

-- Suppression des fonctions triggers
DROP FUNCTION IF EXISTS update_agency_mapping_on_agency_update CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Création de la fonction pour la mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Table des réseaux
CREATE TABLE networks (
    id text PRIMARY KEY,
    name text NOT NULL,
    display_name text,
    gtfs_id text NOT NULL,
    feed_id text NOT NULL,
    region_id text NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    is_available boolean DEFAULT true,
    last_check timestamptz DEFAULT now(),
    error_message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(gtfs_id, region_id)
);

-- Trigger pour updated_at sur networks
CREATE TRIGGER update_networks_updated_at
    BEFORE UPDATE ON networks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table des modes de transport par réseau
CREATE TABLE network_transport_modes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id text NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    mode text NOT NULL,
    route_count integer DEFAULT 0,
    check_time timestamptz DEFAULT now(),
    UNIQUE(network_id, mode)
);

-- Table des opérateurs
CREATE TABLE operators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id text NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    name text NOT NULL,
    gtfs_id text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(network_id, gtfs_id)
);

-- Trigger pour updated_at sur operators
CREATE TRIGGER update_operators_updated_at
    BEFORE UPDATE ON operators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS sur toutes les tables
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_transport_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour networks
CREATE POLICY "Lecture publique des réseaux"
    ON networks FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Modification des réseaux par les administrateurs"
    ON networks FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
    WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Politiques de sécurité pour network_transport_modes
CREATE POLICY "Lecture publique des modes de transport"
    ON network_transport_modes FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Modification des modes de transport par les administrateurs"
    ON network_transport_modes FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
    WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Politiques de sécurité pour operators
CREATE POLICY "Lecture publique des opérateurs"
    ON operators FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Modification des opérateurs par les administrateurs"
    ON operators FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
    WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Index pour améliorer les performances
CREATE INDEX idx_networks_region_id ON networks(region_id);
CREATE INDEX idx_networks_gtfs_id ON networks(gtfs_id);
CREATE INDEX idx_networks_is_available ON networks(is_available);
CREATE INDEX idx_network_transport_modes_network_id ON network_transport_modes(network_id);
CREATE INDEX idx_operators_network_id ON operators(network_id);
CREATE INDEX idx_operators_gtfs_id ON operators(gtfs_id);