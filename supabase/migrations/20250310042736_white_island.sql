/*
  # Ajout des modes de transport et des opérateurs

  1. Tables
    - `network_transport_modes`: Modes de transport par réseau
      - `id` (uuid, primary key)
      - `network_id` (text, foreign key)
      - `mode` (text)
      - `route_count` (integer)
      - `check_time` (timestamptz)

  2. Contraintes
    - Clé étrangère vers networks
    - Contrainte d'unicité sur network_id + mode
*/

-- Création de la table network_transport_modes
CREATE TABLE IF NOT EXISTS network_transport_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  mode text NOT NULL,
  route_count integer DEFAULT 0,
  check_time timestamptz DEFAULT now(),
  UNIQUE(network_id, mode)
);

-- Activation de RLS
ALTER TABLE network_transport_modes ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour network_transport_modes
DO $$ BEGIN
  DROP POLICY IF EXISTS "Lecture publique des modes de transport" ON network_transport_modes;
  CREATE POLICY "Lecture publique des modes de transport" 
    ON network_transport_modes FOR SELECT 
    TO public 
    USING (true);

  DROP POLICY IF EXISTS "Modification des modes de transport par les administrateurs" ON network_transport_modes;
  CREATE POLICY "Modification des modes de transport par les administrateurs" 
    ON network_transport_modes FOR ALL 
    TO authenticated 
    USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
    WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);
END $$;

-- Création des index
CREATE INDEX IF NOT EXISTS idx_network_transport_modes_network_id ON network_transport_modes(network_id);
CREATE INDEX IF NOT EXISTS idx_network_transport_modes_mode ON network_transport_modes(mode);