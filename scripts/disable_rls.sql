-- PASO 1: Desactivar RLS nuevamente
ALTER TABLE europa_recintos_electorales DISABLE ROW LEVEL SECURITY;
ALTER TABLE europa_presidentes_dm DISABLE ROW LEVEL SECURITY;
ALTER TABLE europa_colegios DISABLE ROW LEVEL SECURITY;

-- PASO 2: Verificar que se desactivó
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'europa%';

-- PASO 3: Borrar datos existentes (si los hay) para reiniciar limpio
TRUNCATE TABLE europa_presidentes_dm CASCADE;
TRUNCATE TABLE europa_recintos_electorales CASCADE;
TRUNCATE TABLE europa_colegios CASCADE;
