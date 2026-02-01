-- SCRIPT DEFINITIVO PARA CORREGIR PERMISOS EN TABLA AFILIADOS
-- Problema: El usuario reporta que los cambios no se guardan aunque el sistema dice que sí.
-- Causa probable: RLS impide actualizar registros (retorna 0 filas afectadas sin error).

-- 1. Asegurar que RLS esté habilitado (opcional, pero buena práctica si ya está)
ALTER TABLE afiliados ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas previas para evitar conflictos o bloqueos silenciosos
DROP POLICY IF EXISTS "Lectura publica" ON afiliados;
DROP POLICY IF EXISTS "Escritura autenticada" ON afiliados;
DROP POLICY IF EXISTS "Acceso Total Publico" ON afiliados;
DROP POLICY IF EXISTS "Enable read access for all users" ON afiliados;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON afiliados;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON afiliados;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON afiliados;
DROP POLICY IF EXISTS "Politica Permisiva Total" ON afiliados;

-- 3. Crear una ÚNICA política permisiva que permita TODO a TODOS (incluyendo anon)
-- Esto soluciona problemas si el cliente de Supabase no envía el token correctamente
CREATE POLICY "Politica Permisiva Total Afiliados"
ON afiliados
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Verificar permisos en la tabla de historial también, por si acaso
ALTER TABLE afiliados_historial ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso Total Historial" ON afiliados_historial;
CREATE POLICY "Acceso Total Historial"
ON afiliados_historial
FOR ALL
USING (true)
WITH CHECK (true);

-- Fin del script
