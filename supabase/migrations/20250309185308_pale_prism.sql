/*
  # Add display_name to operators table

  1. Changes
    - Ajout du champ `display_name` à la table `operators` pour permettre un nom d'affichage personnalisé
    - Le champ est nullable car le nom technique peut être utilisé par défaut

  2. Impact
    - Les opérateurs peuvent maintenant avoir un nom d'affichage distinct de leur nom technique
    - Cohérence avec la structure de la table `networks` qui a aussi un `display_name`
*/

-- Add display_name column to operators table
ALTER TABLE operators 
ADD COLUMN IF NOT EXISTS display_name text;