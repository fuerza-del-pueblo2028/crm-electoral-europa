-- Script para agregar el campo cargo_organizacional a la tabla afiliados
-- Este campo almacena el cargo organizacional del afiliado en la estructura de FP Europa
-- Valores posibles: "Miembro Dirección Central", "Presidente DM", "Presidente DB"

ALTER TABLE afiliados 
ADD COLUMN IF NOT EXISTS cargo_organizacional TEXT;

-- Comentario explicativo
COMMENT ON COLUMN afiliados.cargo_organizacional IS 'Cargo organizacional dentro de la estructura de Fuerza del Pueblo Europa (Miembro Dirección Central, Presidente DM, Presidente DB)';

-- Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'afiliados' 
AND column_name = 'cargo_organizacional';
