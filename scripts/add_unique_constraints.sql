-- RESTRICCIONES ÚNICAS: Email y Teléfono
-- Prevenir suplantación de identidad asegurando que cada email y teléfono sean únicos

-- 1. Agregar restricción UNIQUE en columna email
-- Esto permite que múltiples registros tengan NULL (sin email), pero NO permite duplicados
ALTER TABLE afiliados 
ADD CONSTRAINT afiliados_email_unique UNIQUE (email);

-- 2. Agregar restricción UNIQUE en columna telefono
-- Esto permite que múltiples registros tengan NULL (sin teléfono), pero NO permite duplicados
ALTER TABLE afiliados 
ADD CONSTRAINT afiliados_telefono_unique UNIQUE (telefono);

-- NOTAS:
-- - Las restricciones UNIQUE en PostgreSQL permiten múltiples valores NULL
-- - Si un afiliado NO tiene email, no generará conflicto
-- - Si un afiliado NO tiene teléfono, no generará conflicto
-- - Si se intenta insertar/actualizar con un email/teléfono que YA existe, se rechazará con código de error 23505
