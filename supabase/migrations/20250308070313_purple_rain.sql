/*
  # Add unique constraints to agencies and agency_mappings tables

  1. Changes
    - Add unique constraint on agencies(id)
    - Add unique constraint on agency_mappings(agency_id)
    - Add unique constraint on agency_transport_modes(agency_id, mode)

  2. Purpose
    - Enable proper upsert operations with onConflict
    - Ensure data integrity
    - Fix import errors
*/

-- Add unique constraint to agencies table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'agencies_pkey'
  ) THEN
    ALTER TABLE agencies
    ADD CONSTRAINT agencies_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Add unique constraint to agency_mappings table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'agency_mappings_agency_id_key'
  ) THEN
    ALTER TABLE agency_mappings
    ADD CONSTRAINT agency_mappings_agency_id_key UNIQUE (agency_id);
  END IF;
END $$;

-- Add unique constraint to agency_transport_modes table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'agency_transport_modes_agency_id_mode_key'
  ) THEN
    ALTER TABLE agency_transport_modes
    ADD CONSTRAINT agency_transport_modes_agency_id_mode_key UNIQUE (agency_id, mode);
  END IF;
END $$;