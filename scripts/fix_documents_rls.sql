-- SCRIPT PARA CORREGIR PERMISOS DE DOCUMENTOS Y ALMACENAMIENTO
-- Ejecuta esto en el Editor SQL de Supabase para solucionar el error "row-level security policy"

-- 1. Habilitar RLS en la tabla documentos (si no lo está)
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas restrictivas anteriores
DROP POLICY IF EXISTS "Acceso total documentos" ON documentos;
DROP POLICY IF EXISTS "Lectura publica documentos" ON documentos;
DROP POLICY IF EXISTS "Insertar documentos autenticados" ON documentos;

-- 3. Crear política permisiva para la tabla 'documentos'
CREATE POLICY "Acceso total documentos"
ON documentos
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 4. Configurar permisos para el BUCKET de almacenamiento 'documents'
-- Nota: Las políticas de almacenamiento se aplican sobre la tabla storage.objects

-- Permitir acceso público irrestricto al bucket 'documents'
-- Primero borramos políticas específicas si existen para evitar conflictos
DROP POLICY IF EXISTS "Acceso total bucket documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Documents" ON storage.objects;

CREATE POLICY "Acceso total bucket documents"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Asegurar que el bucket sea público (esto suele ser configuración del bucket, pero la política ayuda)
UPDATE storage.buckets
SET public = true
WHERE id = 'documents';
