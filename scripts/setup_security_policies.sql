-- SECURE RLS POLICIES FOR AFILIADOS
-- This script sets up proper security for the 'afiliados' table.
-- It restricts Write/Delete/Update to Authenticated Users (Staff).
-- It allows Select to Authenticated users (and optionally public if required for specific flows, currently set to Authenticated).

-- 1. Enable RLS
ALTER TABLE afiliados ENABLE ROW LEVEL SECURITY;

-- 2. Drop insecure policies (if any exists from previous fixes)
DROP POLICY IF EXISTS "Acceso Total Publico" ON afiliados;
DROP POLICY IF EXISTS "Lectura publica" ON afiliados;
DROP POLICY IF EXISTS "Escritura autenticada" ON afiliados;
DROP POLICY IF EXISTS "Enable read access for all users" ON afiliados;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON afiliados;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON afiliados;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON afiliados;

-- 3. Create Secure Policies

-- READ: Allow authenticated users to view affiliates
-- If you need public access for a specific "search yourself" feature, you should create a specific Postgres Function with SECURITY DEFINER
-- instead of opening the table. For now, we restrict to authenticated.
CREATE POLICY "Enable read access for authenticated users only"
ON afiliados FOR SELECT
TO authenticated
USING (true);

-- INSERT: Allow authenticated users to add affiliates
CREATE POLICY "Enable insert for authenticated users only"
ON afiliados FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Allow authenticated users to update affiliates
CREATE POLICY "Enable update for authenticated users only"
ON afiliados FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Allow authenticated users to delete affiliates
CREATE POLICY "Enable delete for authenticated users only"
ON afiliados FOR DELETE
TO authenticated
USING (true);

-- 4. Verification using a logical check (cannot run sql in comment)
-- Verify that 'anon' role cannot see data.
-- Verify that 'authenticated' role can.
