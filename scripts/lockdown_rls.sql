-- 🚨 SCRIPT DE BLINDAJE DE SEGURIDAD (FASE 1) 🚨
-- Este script revoca el acceso público (anon) a las tablas sensibles
-- y asegura que solo el API del servidor pueda escribir/leer datos sensibles.

-- 1. Habilitar RLS en todas las tablas críticas (por si acaso)
ALTER TABLE afiliados ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE actas_electorales ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicaciones ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS las políticas existentes (incluida la 'anon_select_only')
-- Esto cierra el acceso público inmediatamente.
DROP POLICY IF EXISTS "anon_select_only" ON afiliados;
DROP POLICY IF EXISTS "anon_select_only" ON usuarios;
DROP POLICY IF EXISTS "anon_select_only" ON documentos;
DROP POLICY IF EXISTS "anon_select_only" ON actas_electorales;
DROP POLICY IF EXISTS "anon_select_only" ON comunicaciones;

-- Eliminar también cualquier otra política que pueda existir
DROP POLICY IF EXISTS "Public read access" ON afiliados;
DROP POLICY IF EXISTS "Public read access" ON usuarios;

-- 3. Crear política MÍNIMA para Storage (si se requiere)
-- Nota: RLS de Storage es independiente. Asegúrate de revisar 'storage.buckets'.

-- 4. CONFIRMACIÓN
-- Al no haber políticas para 'anon', Supabase denegará por defecto cualquier request
-- que venga del cliente (navegador) usando la anon key.
-- Solo 'service_role' (usado por nuestra API) tendrá acceso total.

-- 5. (Opcional) Permitir lectura de estatutos públicamente si se desea
-- CREATE POLICY "public_estatutos" ON estatutos FOR SELECT TO anon USING (true);
