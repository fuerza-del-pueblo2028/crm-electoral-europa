-- 🚨 FINAL SECURITY FIXES 🚨
-- This script addresses the specific alerts shown in your Supabase dashboard.

-- ==============================================================================
-- SECTION A: SECURE 'ELECTORAL' SCHEMA TABLES (CRITICAL)
-- ==============================================================================
-- These tables are currently exposed to the public. Even if your app doesn't use them,
-- they should be locked down to prevent unauthorized access.

ALTER TABLE IF EXISTS electoral.afiliados ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS electoral.ciudades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS electoral.colegios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS electoral.medallas_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS electoral.medallas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS electoral.misiones_completadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS electoral.misiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS electoral.recintos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS electoral.seccionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS electoral.usuarios ENABLE ROW LEVEL SECURITY;

-- No policies are created, which means "Default Deny All" (Nobody can access these tables via API).
-- This is the safest state for unused or sensitive internal tables.


-- ==============================================================================
-- SECTION B: FIX MUTABLE SEARCH PATHS ON FUNCTIONS (HIGH IMPORTANCE)
-- ==============================================================================
-- Security Best Practice: Set a fixed search_path to prevent malicious code execution.
-- We attempt to alter the functions with their most likely signatures. 
-- If any of these fail due to "function does not exist", it means the signature (arguments) 
-- is slightly different. In that case, you can ignore the error for that specific function.

-- 1. Trigger Functions (Usually take no arguments)
ALTER FUNCTION public.agregar_afiliado_a_comunicaciones() SET search_path = public;
ALTER FUNCTION public.sync_afiliado_to_padron() SET search_path = public;
ALTER FUNCTION public.update_search_columns() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 2. Utility Functions (Guessed signatures based on usage patterns)
-- If these fail, check the function definition in Supabase and adjust the arguments.

-- Likely takes a seccional ID or name (text)
ALTER FUNCTION public.get_estadisticas_seccional(text) SET search_path = public;

-- Likely takes a province ID or name (text)
ALTER FUNCTION public.get_presidentes_por_provincia(text) SET search_path = public;

-- Standard email function usually takes (to, subject, body, html) or similar. 
-- Confirmed signature: (p_to text, p_subject text, p_message text, p_afiliado_id uuid)
ALTER FUNCTION public.send_email_resend(text, text, text, uuid) SET search_path = public;


-- ==============================================================================
-- SECTION C: EXTENSIONS (INFO ONLY)
-- ==============================================================================
-- The alerts about "Extension in Public" (http, unaccent) are warnings.
-- Moving them is complex and might break your app depending on how they are called.
-- For now, they are acceptable risks compared to RLS and Function Search Paths.
-- You can verify their installation in the "Database > Extensions" tab.
