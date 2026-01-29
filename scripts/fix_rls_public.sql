-- SOLUCIÓN FINAL: Permisos Públicos para Desbloquear
-- Este script permite que CUALQUIERA pueda Editar/Crear/Borrar para asegurar que funcione.

-- 1. Habilitar RLS (Siempre es bueno tenerlo activo)
ALTER TABLE europa_recintos_electorales ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas previas de esta tabla
DROP POLICY IF EXISTS "Lectura publica" ON europa_recintos_electorales;
DROP POLICY IF EXISTS "Escritura autenticada" ON europa_recintos_electorales;
DROP POLICY IF EXISTS "Escritura admin" ON europa_recintos_electorales;
DROP POLICY IF EXISTS "Enable read access for all users" ON europa_recintos_electorales;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON europa_recintos_electorales;

-- 3. Crear política de ACCESO TOTAL PÚBLICO
-- "USING (true)" significa que todos pueden VER y EDITAR todo.
CREATE POLICY "Acceso Total Publico" 
ON europa_recintos_electorales
FOR ALL 
USING (true)
WITH CHECK (true);

-- (Opcional) Hacer lo mismo para Presidentes DM si también fallan
ALTER TABLE europa_presidentes_dm ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso Total Publico" ON europa_presidentes_dm;
CREATE POLICY "Acceso Total Publico" ON europa_presidentes_dm FOR ALL USING (true) WITH CHECK (true);
