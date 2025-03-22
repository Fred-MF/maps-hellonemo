/*
  # Insertion des données initiales des régions

  Cette migration insère les données des régions françaises avec leurs API MaaSify.
*/

INSERT INTO regions (id, name, api_url) VALUES
  ('ara', 'Auvergne-Rhône-Alpes', 'https://otp-ara.maasify.io/graphiql'),
  ('bfc', 'Bourgogne-Franche-Comté', 'https://otp-bfc.maasify.io/graphiql'),
  ('bre', 'Bretagne', 'https://otp-bre.maasify.io/graphiql'),
  ('caraibe', 'Guyane', 'https://otp-caraibe.maasify.io/graphiql'),
  ('cor', 'Corse', 'https://otp-cor.maasify.io/graphiql'),
  ('cvl', 'Centre-Val de Loire', 'https://otp-cvl.maasify.io/graphiql'),
  ('ges', 'Grand Est', 'https://otp-ges.maasify.io/graphiql'),
  ('gf', 'Guadeloupe', 'https://otp-gf.maasify.io/graphiql'),
  ('hdf', 'Hauts-de-France', 'https://otp-hdf.maasify.io/graphiql'),
  ('idf', 'Ile-de-France', 'https://otp-idf.maasify.io/graphiql'),
  ('mar', 'Martinique', 'https://otp-mar.maasify.io/graphiql'),
  ('naq', 'Nouvelle-Aquitaine', 'https://otp-naq.maasify.io/graphiql'),
  ('nor', 'Normandie', 'https://otp-nor.maasify.io/graphiql'),
  ('occ', 'Occitanie', 'https://otp-occ.maasify.io/graphiql'),
  ('paca', 'Provence Alpes Côte d''Azur', 'https://otp-paca.maasify.io/graphiql'),
  ('pdl', 'Pays de la Loire', 'https://otp-pdl.maasify.io/graphiql'),
  ('re', 'Réunion', 'https://otp-re.maasify.io/graphiql')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  api_url = EXCLUDED.api_url;