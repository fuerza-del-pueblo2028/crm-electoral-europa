-- 🚨 SECURITY LOCKDOWN - PHASE 2 (EUROPA MODULE) 🚨
-- This script secures the Europa module tables which were not covered in phase 1.

-- 1. Enable RLS on Europa tables
ALTER TABLE europa_recintos_electorales ENABLE ROW LEVEL SECURITY;
ALTER TABLE europa_presidentes_dm ENABLE ROW LEVEL SECURITY;

-- 2. DROP any existing policies (to revoke public access)
DROP POLICY IF EXISTS "anon_select_only" ON europa_recintos_electorales;
DROP POLICY IF EXISTS "public_read_access" ON europa_recintos_electorales;
DROP POLICY IF EXISTS "anon_select_only" ON europa_presidentes_dm;
DROP POLICY IF EXISTS "public_read_access" ON europa_presidentes_dm;

-- 3. CONFIRMATION
-- Only 'service_role' (used by our API) will have access now.
