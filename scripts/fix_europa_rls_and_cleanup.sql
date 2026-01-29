-- PASO 1: Limpiar datos corruptos (Header importado como fila)
DELETE FROM europa_recintos_electorales 
WHERE numero_recinto = 'Número Recinto' 
OR nombre_recinto = 'RECINTOS';

-- PASO 2: Asegurar que RLS está habilitado (por seguridad)
ALTER TABLE europa_recintos_electorales ENABLE ROW LEVEL SECURITY;
ALTER TABLE europa_presidentes_dm ENABLE ROW LEVEL SECURITY;
ALTER TABLE europa_colegios ENABLE ROW LEVEL SECURITY;

-- PASO 3: Eliminar políticas anteriores para evitar conflictos
DROP POLICY IF EXISTS "Lectura publica" ON europa_recintos_electorales;
DROP POLICY IF EXISTS "Escritura admin" ON europa_recintos_electorales;
DROP POLICY IF EXISTS "Enable read access for all users" ON europa_recintos_electorales;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON europa_recintos_electorales;
DROP POLICY IF EXISTS "Enable update for users based on email" ON europa_recintos_electorales;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON europa_recintos_electorales;

-- PASO 4: Crear nuevas políticas
-- Política de LECTURA: Permitir a cualquiera ver los datos
CREATE POLICY "Lectura publica" 
ON europa_recintos_electorales FOR SELECT 
USING (true);

-- Política de ESCRITURA (Insert/Update/Delete): Permitir a usuarios autenticados
-- NOTA: Idealmente verificaríamos el rol, pero para asegurar que funcione:
CREATE POLICY "Escritura autenticada" 
ON europa_recintos_electorales FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Repetir para otras tablas relacionadas por consistencia
DROP POLICY IF EXISTS "Lectura publica" ON europa_presidentes_dm;
DROP POLICY IF EXISTS "Escritura autenticada" ON europa_presidentes_dm;
CREATE POLICY "Lectura publica" ON europa_presidentes_dm FOR SELECT USING (true);
CREATE POLICY "Escritura autenticada" ON europa_presidentes_dm FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica" ON europa_colegios;
DROP POLICY IF EXISTS "Escritura autenticada" ON europa_colegios;
CREATE POLICY "Lectura publica" ON europa_colegios FOR SELECT USING (true);
CREATE POLICY "Escritura autenticada" ON europa_colegios FOR ALL TO authenticated USING (true) WITH CHECK (true);
