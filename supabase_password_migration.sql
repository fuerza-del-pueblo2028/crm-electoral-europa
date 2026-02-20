-- Migración para implementar contraseñas seguras y recuperación

-- 1. Añadir columnas a la tabla de afiliados
ALTER TABLE public.afiliados 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- 2. Añadir columnas a la tabla de usuarios (administradores/operadores)
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- NOTA: No eliminaremos la columna original "password" de usuarios 
-- hasta que estemos seguros de que todos han migrado a password_hash.
