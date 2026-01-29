-- ========================================
-- EJECUTA ESTE SQL EN SUPABASE SQL EDITOR
-- ========================================

-- 1. Verificar y desactivar RLS
ALTER TABLE europa_recintos_electorales DISABLE ROW LEVEL SECURITY;
ALTER TABLE europa_presidentes_dm DISABLE ROW LEVEL SECURITY;
ALTER TABLE europa_colegios DISABLE ROW LEVEL SECURITY;

-- 2. COPIA Y PÉGAME EL RESULTADO DE ESTA CONSULTA:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'europa%'
ORDER BY tablename;

-- 3. COPIA Y PÉGAME EL RESULTADO DE ESTA CONSULTA:
SELECT 'Recintos' as tabla, COUNT(*) as total FROM europa_recintos_electorales
UNION ALL
SELECT 'Presidentes DM' as tabla, COUNT(*) as total FROM europa_presidentes_dm
UNION ALL
SELECT 'Colegios' as tabla, COUNT(*) as total FROM europa_colegios
ORDER BY tabla;
