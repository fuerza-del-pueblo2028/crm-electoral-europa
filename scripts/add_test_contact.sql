-- =============================================================================
-- SCRIPT: INSERT TEST CONTACT FOR COMMUNICATIONS
-- =============================================================================
-- Run this in your Supabase SQL Editor if you want to test the 
-- mass email (Broadcast) section without emailing real people.
--
-- Note: Replace 'TU_EMAIL@EJEMPLO.COM' with an email you have access to.
-- =============================================================================

INSERT INTO comunicaciones_contactos (nombre, email, activo)
VALUES ('Prueba Sistema', 'TU_EMAIL@EJEMPLO.COM', true);

-- Verification:
SELECT * FROM comunicaciones_contactos WHERE nombre = 'Prueba Sistema';
