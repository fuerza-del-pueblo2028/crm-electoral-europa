-- SOLUCIÓN: Eliminar duplicados y agregar columna de colegios

-- 1. Eliminar duplicados de presidentes (mantener solo el primero de cada uno)
DELETE FROM europa_presidentes_dm
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY cedula, nombre_completo ORDER BY created_at) as rn
    FROM europa_presidentes_dm
  ) t
  WHERE rn > 1
);

-- 2. Agregar columna para números de colegios
ALTER TABLE europa_recintos_electorales 
ADD COLUMN IF NOT EXISTS colegios_numeros text;

-- 3. Verificar que se agregó
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'europa_recintos_electorales' 
AND column_name = 'colegios_numeros';

-- 4. Contar registros después de limpiar
SELECT 'Recintos' as tabla, COUNT(*) as total FROM europa_recintos_electorales
UNION ALL
SELECT 'Presidentes DM' as tabla, COUNT(*) as total FROM europa_presidentes_dm
UNION ALL
SELECT 'Colegios' as tabla, COUNT(*) as total FROM europa_colegios;
