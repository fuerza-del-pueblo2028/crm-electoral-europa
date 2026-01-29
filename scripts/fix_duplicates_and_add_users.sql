-- ==========================================================
-- SCRIPT DE LIMPIEZA: ELIMINAR DUPLICADOS DE PRESIDENTES DM
-- ==========================================================

-- Este script hace dos cosas:
-- 1. Elimina las filas duplicadas en 'europa_presidentes_dm', dejando solo una (la más reciente o arbitraria).
-- 2. Añade una restricción (UNIQUE CONSTRAINT) para que NO se puedan volver a crear duplicados en el futuro.

BEGIN;

-- 1. Eliminar duplicados
-- Mantenemos solo el registro con el ID más pequeño (el primero que se creó probablemente)
-- o el ID más grande (el último). Usaremos ctid (físico) o simplemente borramos los que tengan id mayor pero mismos datos clave.

-- Asumimos que un duplicado es mismo 'nombre_completo' y 'condado_provincia' (o demarcación).
-- Ajusta las columnas en PARTITION BY si consideras que la unicidad depende de otros campos.

DELETE FROM europa_presidentes_dm a USING (
      SELECT MIN(ctid) as ctid, nombre_completo, condado_provincia
      FROM europa_presidentes_dm 
      GROUP BY nombre_completo, condado_provincia HAVING COUNT(*) > 1
      ) b
      WHERE a.nombre_completo = b.nombre_completo 
      AND a.condado_provincia = b.condado_provincia 
      AND a.ctid <> b.ctid;


-- 2. Crear Restricción Única (Unique Index)
-- Esto evitará que en futuras cargas masivas se dupliquen.
-- Si intentas insertar un duplicado, fallará o (si usas ON CONFLICT) se actualizará.

ALTER TABLE europa_presidentes_dm
ADD CONSTRAINT unique_presidente_demarcacion 
UNIQUE (nombre_completo, condado_provincia);

COMMIT;

-- ==========================================================
-- SCRIPT DE CREACIÓN DE USUARIOS (ADMINISTRADORES Y OPERADORES)
-- ==========================================================
-- Instrucciones:
-- Reemplaza los valores de ejemplo con los datos reales de tus compañeros.
-- Puedes copiar y pegar el bloque INSERT tantas veces como necesites.

-- Crear Administrador 2
INSERT INTO usuarios (nombre, cedula, password, rol, seccional)
VALUES ('Nombre Admin 2', '000-0000000-1', 'claveAdmin2', 'administrador', 'Todas')
ON CONFLICT (cedula) DO NOTHING; -- Evita error si ya existe

-- Crear Administrador 3
INSERT INTO usuarios (nombre, cedula, password, rol, seccional)
VALUES ('Nombre Admin 3', '000-0000000-2', 'claveAdmin3', 'administrador', 'Todas')
ON CONFLICT (cedula) DO NOTHING;

-- Crear Operador 1
INSERT INTO usuarios (nombre, cedula, password, rol, seccional)
VALUES ('Operador Madrid', '000-0000000-3', 'claveOp1', 'operador', 'Madrid')
ON CONFLICT (cedula) DO NOTHING;

-- Crear Operador 2
INSERT INTO usuarios (nombre, cedula, password, rol, seccional)
VALUES ('Operador Barcelona', '000-0000000-4', 'claveOp2', 'operador', 'Barcelona')
ON CONFLICT (cedula) DO NOTHING;

-- ... Repite para los otros 4 operadores cambiando nombre, cédula, clave y seccional ...
-- Seccionales válidas: Madrid, Barcelona, Milano, Zurich, Holanda, Valencia.

