-- Ejecuta este SQL en el SQL Editor de Supabase para ver la estructura de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'europa_recintos_electorales'
ORDER BY ordinal_position;
