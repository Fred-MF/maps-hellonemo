-- Vérifier les tables existantes
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('networks', 'operators', 'network_transport_modes')
ORDER BY table_name, ordinal_position;

-- Vérifier les politiques de sécurité
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('networks', 'operators', 'network_transport_modes');

-- Vérifier les index
SELECT
    t.relname AS table_name,
    i.relname AS index_name,
    a.attname AS column_name
FROM
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a
WHERE
    t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relkind = 'r'
    AND t.relname IN ('networks', 'operators', 'network_transport_modes')
ORDER BY
    t.relname,
    i.relname;