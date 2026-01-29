-- 1. Insert Test Record
INSERT INTO europa_recintos_electorales (
    seccional, numero_recinto, nombre_recinto, zona_ciudad, total_electores, total_colegios
) VALUES (
    'Valencia', '99999', 'Test Logic Recinto', 'Test Zone', 10, 1
) ON CONFLICT DO NOTHING;

-- 2. Verify Order (Should be last)
SELECT seccional, numero_recinto 
FROM europa_recintos_electorales 
WHERE seccional = 'Valencia' 
ORDER BY numero_recinto DESC 
LIMIT 3;

-- 3. Cleanup
DELETE FROM europa_recintos_electorales WHERE numero_recinto = '99999';
