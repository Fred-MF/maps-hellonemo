/*
  # Create network tables with conflict handling

  1. New Tables
    - network_mapping
      - id (integer, primary key)
      - name (text)
      - region_id (text)
      - feed_id (text) 
      - operator (text, nullable)
      - is_active (boolean)
      - created_at (timestamptz)
      - updated_at (timestamptz)

    - network_status
      - id (integer, primary key)
      - network_id (integer, foreign key)
      - is_available (boolean)
      - check_time (timestamptz)
      - error_message (text, nullable)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated admin access
*/

-- Drop existing objects if they exist
DROP INDEX IF EXISTS idx_network_status_network_id;
DROP TABLE IF EXISTS network_status;
DROP TABLE IF EXISTS network_mapping;

-- Create network_mapping table
CREATE TABLE network_mapping (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  region_id text NOT NULL,
  feed_id text NOT NULL,
  operator text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create network_status table
CREATE TABLE network_status (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  network_id integer NOT NULL,
  is_available boolean NOT NULL DEFAULT false,
  check_time timestamptz DEFAULT now(),
  error_message text,
  CONSTRAINT fk_network_mapping FOREIGN KEY (network_id) REFERENCES network_mapping(id) ON DELETE CASCADE
);

-- Create index for better join performance
CREATE INDEX idx_network_status_network_id ON network_status(network_id);

-- Enable Row Level Security
ALTER TABLE network_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_status ENABLE ROW LEVEL SECURITY;

-- Create policies for network_mapping
CREATE POLICY "Les administrateurs peuvent tout faire sur network_mapping"
ON network_mapping
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@maasify.io');

-- Create policies for network_status
CREATE POLICY "Les administrateurs peuvent tout faire sur network_status"
ON network_status
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@maasify.io');

-- Create admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@maasify.io'
  ) THEN
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
  END IF;
END $$;