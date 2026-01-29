-- ========================================
-- VERIFICACIÓN DE RLS Y DATOS
-- ========================================
-- Copia todo esto, pégalo en Supabase SQL Editor y haz clic en RUN
-- Luego compárteme los resultados de las 2 consultas SELECT

-- PASO 1: Desactivar RLS
ALTER TABLE europa_recintos_electorales DISABLE ROW LEVEL SECURITY;
ALTER TABLE europa_presidentes_dm DISABLE ROW LEVEL SECURITY;
ALTER TABLE europa_colegios DISABLE ROW LEVEL SECURITY;

-- PASO 2: Verificar estado del RLS
-- COMPÁRTEME EL RESULTADO DE ESTA CONSULTA ⬇️
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'europa%'
ORDER BY tablename;

-- PASO 3: Contar registros en cada tabla
-- COMPÁRTEME EL RESULTADO DE ESTA CONSULTA ⬇️
SELECT 'Recintos' as tabla, COUNT(*) as total FROM europa_recintos_electorales
UNION ALL
SELECT 'Presidentes DM' as tabla, COUNT(*) as total FROM europa_presidentes_dm
UNION ALL
SELECT 'Colegios' as tabla, COUNT(*) as total FROM europa_colegios
ORDER BY tabla;
