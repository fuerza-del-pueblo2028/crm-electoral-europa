-- 1. Tabla para almacenar los contactos de comunicación (Newsletter / Comunicados)
CREATE TABLE IF NOT EXISTS comunicaciones_contactos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    origen TEXT DEFAULT 'registro_afiliado',
    fecha_suscripcion TIMESTAMPTZ DEFAULT NOW(),
    activo BOOLEAN DEFAULT true
);

-- Policies (RLS) para comunicaciones_contactos
ALTER TABLE comunicaciones_contactos ENABLE ROW LEVEL SECURITY;

-- Eliminar policy si existe (para poder re-ejecutar el script)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver contactos" ON comunicaciones_contactos;

-- Permitir lectura a usuarios autenticados (para el admin)
CREATE POLICY "Usuarios autenticados pueden ver contactos" 
ON comunicaciones_contactos FOR SELECT 
TO authenticated 
USING (true);

-- 2. Función Trigger: Agregar automáticamente al afiliado nuevo
CREATE OR REPLACE FUNCTION public.agregar_afiliado_a_comunicaciones()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que tenga email
    IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
        INSERT INTO public.comunicaciones_contactos (email, nombre, origen)
        VALUES (
            NEW.email, 
            TRIM(NEW.nombre || ' ' || COALESCE(NEW.apellidos, '')),
            'afiliado_automatico'
        )
        ON CONFLICT (email) DO NOTHING; -- Si ya existe, no hacemos nada (idempotente)
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear el Trigger en la tabla 'afiliados'
DROP TRIGGER IF EXISTS on_afiliado_created_add_to_comms ON afiliados;

CREATE TRIGGER on_afiliado_created_add_to_comms
AFTER INSERT ON afiliados
FOR EACH ROW
EXECUTE FUNCTION public.agregar_afiliado_a_comunicaciones();

-- 4. Retroactivo: Insertar afiliados existentes que tengan email
INSERT INTO public.comunicaciones_contactos (email, nombre, origen)
SELECT 
    email, 
    TRIM(nombre || ' ' || COALESCE(apellidos, '')),
    'importacion_retroactiva'
FROM afiliados
WHERE email IS NOT NULL AND email <> ''
ON CONFLICT (email) DO NOTHING;
