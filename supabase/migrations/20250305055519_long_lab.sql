/*
  # Configuration de l'authentification et création de l'utilisateur administrateur

  1. Sécurité
    - Active RLS sur les tables network_mapping et network_status
    - Ajoute des politiques pour restreindre l'accès aux administrateurs

  2. Utilisateur
    - Crée un utilisateur administrateur par défaut
*/

-- Activer RLS sur les tables
ALTER TABLE network_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_status ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour network_mapping
CREATE POLICY "Les administrateurs peuvent tout faire sur network_mapping"
ON network_mapping
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@maasify.io');

-- Créer une politique pour network_status
CREATE POLICY "Les administrateurs peuvent tout faire sur network_status"
ON network_status
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@maasify.io');

-- Créer l'utilisateur administrateur
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@maasify.io',
  crypt('maasify2025', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);