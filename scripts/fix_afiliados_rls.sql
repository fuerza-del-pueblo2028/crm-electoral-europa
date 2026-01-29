-- SOLUCIÓN: Permitir eliminación de afiliados
-- Este script actualiza las políticas RLS para permitir operaciones de DELETE

-- 1. Habilitar RLS en la tabla afiliados
ALTER TABLE afiliados ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas anteriores que puedan estar bloqueando DELETE
DROP POLICY IF EXISTS "Lectura publica" ON afiliados;
DROP POLICY IF EXISTS "Escritura autenticada" ON afiliados;
DROP POLICY IF EXISTS "Acceso Total Publico" ON afiliados;
DROP POLICY IF EXISTS "Enable read access for all users" ON afiliados;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON afiliados;

-- 3. Crear política permisiva de ACCESO TOTAL PÚBLICO
-- (Similar a la que aplicamos para europa_recintos_electorales)
CREATE POLICY "Acceso Total Publico" 
ON afiliados
FOR ALL 
USING (true)
WITH CHECK (true);

-- Verificación: Después de ejecutar esto, deberías poder:
-- - Ver todos los afiliados (SELECT)
-- - Crear nuevos afiliados (INSERT)
-- - Actualizar afiliados (UPDATE)  
-- - Eliminar afiliados (DELETE)
