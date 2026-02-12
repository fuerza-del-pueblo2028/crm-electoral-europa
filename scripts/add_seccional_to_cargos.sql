-- ============================================
-- MIGRACIÓN: Agregar columna 'seccional' a elecciones_cargos
-- ============================================

-- 1. Agregar la columna si no existe
ALTER TABLE elecciones_cargos
ADD COLUMN IF NOT EXISTS seccional TEXT DEFAULT 'Europa';

-- 2. Agregar comentario para documentación
COMMENT ON COLUMN elecciones_cargos.seccional IS 'Define el alcance de la elección. Ej: "Europa" (General), "Madrid", "Milano" (Local)';

-- 3. Actualizar registros existentes para asegurar consistencia
-- Asumimos que los existentes son generales ('Europa') si están vacíos
UPDATE elecciones_cargos 
SET seccional = 'Europa' 
WHERE seccional IS NULL;

-- 4. Crear índice para optimizar filtrado
CREATE INDEX IF NOT EXISTS idx_elecciones_cargos_seccional ON elecciones_cargos(seccional);

-- 5. Verificar resultado
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'elecciones_cargos' 
AND column_name = 'seccional';
