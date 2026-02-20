-- 1. Habilitar la extensión unaccent en la base de datos (ignora acentos)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Crear función RPC para buscar afiliados sin acentos
CREATE OR REPLACE FUNCTION buscar_afiliados_unaccent(busqueda text)
RETURNS SETOF afiliados AS $$
BEGIN
  RETURN QUERY 
  SELECT * 
  FROM afiliados 
  WHERE unaccent(nombre) ILIKE unaccent('%' || busqueda || '%')
     OR unaccent(apellidos) ILIKE unaccent('%' || busqueda || '%')
     OR cedula ILIKE ('%' || busqueda || '%');
END;
$$ LANGUAGE plpgsql;
