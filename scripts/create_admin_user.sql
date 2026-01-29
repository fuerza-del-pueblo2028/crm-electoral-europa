-- ==========================================================
-- PASO A PASO: CREAR TU USUARIO ADMINISTRADOR EN SUPABASE
-- ==========================================================

-- INSTRUCCIONES:
-- 1. Modifica los valores abajo donde dice 'TU_CEDULA_AQUI' y 'TU_CLAVE_AQUI'.
-- 2. Copia todo este código.
-- 3. Ve a Supabase > SQL Editor > Nuevo Query.
-- 4. Pega y dale al botón "RUN".

INSERT INTO usuarios (nombre, cedula, password, rol, seccional)
VALUES (
    'Super Administrador',      -- Tu Nombre (opcional cambiarlo)
    '000-0000000-0',            -- <--- ¡IMPORTANTE! PON TU CÉDULA AQUÍ (con guiones)
    'admin2026',                -- <--- ¡IMPORTANTE! PON TU CONTRASEÑA AQUÍ
    'administrador',            -- Rol (DEJAR COMO 'administrador')
    'Todas'                     -- Seccional (DEJAR COMO 'Todas' para acceso total)
);

-- Si te dice que ya existe (duplicate key), usa este comando para cambiar la clave de uno existente:
-- UPDATE usuarios SET password = 'NUEVA_CLAVE' WHERE cedula = 'TU_CEDULA';
