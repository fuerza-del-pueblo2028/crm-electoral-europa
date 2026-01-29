-- Verificar estado actual del RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'europa%';

-- Si alguna tabla tiene rowsecurity = true, ejecuta esto:
ALTER TABLE europa_recintos_electorales DISABLE ROW LEVEL SECURITY;
ALTER TABLE europa_presidentes_dm DISABLE ROW LEVEL SECURITY;
ALTER TABLE europa_colegios DISABLE ROW LEVEL SECURITY;

-- Verificar de nuevo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'europa%';

-- Ver cuántos datos hay
SELECT 'Recintos' as tabla, COUNT(*) as total FROM europa_recintos_electorales
UNION ALL
SELECT 'Presidentes DM' as tabla, COUNT(*) as total FROM europa_presidentes_dm
UNION ALL
SELECT 'Colegios' as tabla, COUNT(*) as total FROM europa_colegios;
