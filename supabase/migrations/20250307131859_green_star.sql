/*
  # Création de la table des régions

  1. Nouvelle Table
    - `regions`
      - `id` (text, primary key) - Identifiant unique de la région (ex: 'ara', 'paca')
      - `name` (text) - Nom complet de la région
      - `api_url` (text) - URL de l'API MaaSify
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de mise à jour
      - `is_active` (boolean) - État d'activation de la région

  2. Sécurité
    - Enable RLS
    - Policies pour lecture publique
    - Policies pour modification par les administrateurs
*/

-- Création de la table des régions
CREATE TABLE IF NOT EXISTS regions (
  id text PRIMARY KEY,
  name text NOT NULL,
  api_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Activer RLS
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Tout le monde peut lire les régions"
  ON regions
  FOR SELECT
  TO public
  USING (true);

-- Politique de modification pour les administrateurs
CREATE POLICY "Les administrateurs peuvent modifier les régions"
  ON regions
  USING ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@maasify.io'::text);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON regions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insertion des données initiales
INSERT INTO regions (id, name, api_url) VALUES
  ('ara', 'Auvergne-Rhône-Alpes', 'https://otp-ara.maasify.io/otp/routers/default/index/graphql'),
  ('bfc', 'Bourgogne-Franche-Comté', 'https://otp-bfc.maasify.io/otp/routers/default/index/graphql'),
  ('bre', 'Bretagne', 'https://otp-bre.maasify.io/otp/routers/default/index/graphql'),
  ('cvl', 'Centre-Val de Loire', 'https://otp-cvl.maasify.io/otp/routers/default/index/graphql'),
  ('ges', 'Grand Est', 'https://otp-ges.maasify.io/otp/routers/default/index/graphql'),
  ('hdf', 'Hauts-de-France', 'https://otp-hdf.maasify.io/otp/routers/default/index/graphql'),
  ('idf', 'Île-de-France', 'https://otp-idf.maasify.io/otp/routers/default/index/graphql'),
  ('nor', 'Normandie', 'https://otp-nor.maasify.io/otp/routers/default/index/graphql'),
  ('naq', 'Nouvelle-Aquitaine', 'https://otp-naq.maasify.io/otp/routers/default/index/graphql'),
  ('occ', 'Occitanie', 'https://otp-occ.maasify.io/otp/routers/default/index/graphql'),
  ('paca', 'Provence-Alpes-Côte d''Azur', 'https://otp-paca.maasify.io/otp/routers/default/index/graphql'),
  ('pdl', 'Pays de la Loire', 'https://otp-pdl.maasify.io/otp/routers/default/index/graphql'),
  ('cor', 'Corse', 'https://otp-cor.maasify.io/otp/routers/default/index/graphql'),
  ('gf', 'Guyane', 'https://otp-gf.maasify.io/otp/routers/default/index/graphql'),
  ('mar', 'Martinique', 'https://otp-mar.maasify.io/otp/routers/default/index/graphql'),
  ('re', 'Réunion', 'https://otp-re.maasify.io/otp/routers/default/index/graphql')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  api_url = EXCLUDED.api_url,
  updated_at = now();