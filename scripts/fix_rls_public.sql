-- Enable RLS (or keep it enabled)
ALTER TABLE actas_electorales ENABLE ROW LEVEL SECURITY;

-- Remove previous strict policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON actas_electorales;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON actas_electorales;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON actas_electorales;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON actas_electorales;

-- Remove previous anon/public policies if any to avoid conflicts
DROP POLICY IF EXISTS "Enable all access for anon" ON actas_electorales;
DROP POLICY IF EXISTS "Enable select for anon" ON actas_electorales;
DROP POLICY IF EXISTS "Enable insert for anon" ON actas_electorales;

-- Create PERMISSIVE policies for 'anon' (public) role
-- Since the app handles auth via custom logic, the DB sees 'anon' users.

CREATE POLICY "Enable select for anon"
ON actas_electorales FOR SELECT
TO anon, authenticated, service_role
USING (true);

CREATE POLICY "Enable insert for anon"
ON actas_electorales FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (true);

CREATE POLICY "Enable update for anon"
ON actas_electorales FOR UPDATE
TO anon, authenticated, service_role
USING (true);

CREATE POLICY "Enable delete for anon"
ON actas_electorales FOR DELETE
TO anon, authenticated, service_role
USING (true);

-- Ensure grants are correct
GRANT ALL ON actas_electorales TO anon;
GRANT ALL ON actas_electorales TO authenticated;
GRANT ALL ON actas_electorales TO service_role;
