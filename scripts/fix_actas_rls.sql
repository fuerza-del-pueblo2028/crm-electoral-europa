-- Enable RLS on the table (ensure it is on)
ALTER TABLE actas_electorales ENABLE ROW LEVEL SECURITY;

-- 1. Policy for SELECT (Read)
-- Drop if exists to avoid errors
DROP POLICY IF EXISTS "Enable read access for all users" ON actas_electorales;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON actas_electorales;

CREATE POLICY "Enable read access for authenticated users"
ON actas_electorales
FOR SELECT
TO authenticated
USING (true);

-- 2. Policy for INSERT
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON actas_electorales;

CREATE POLICY "Enable insert for authenticated users"
ON actas_electorales
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Policy for UPDATE
DROP POLICY IF EXISTS "Enable update for authenticated users" ON actas_electorales;

CREATE POLICY "Enable update for authenticated users"
ON actas_electorales
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Policy for DELETE
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON actas_electorales;

CREATE POLICY "Enable delete for authenticated users"
ON actas_electorales
FOR DELETE
TO authenticated
USING (true);

-- Grant privileges just in case
GRANT ALL ON actas_electorales TO authenticated;
GRANT ALL ON actas_electorales TO service_role;
