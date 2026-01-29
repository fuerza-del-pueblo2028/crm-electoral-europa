-- Habilitar RLS y crear políticas para edición de administradores

-- 1. Habilitar RLS en las tablas
ALTER TABLE europa_recintos_electorales ENABLE ROW LEVEL SECURITY;
ALTER TABLE europa_presidentes_dm ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas para lectura pública (todos pueden leer)
CREATE POLICY "Permitir lectura pública de recintos"
ON europa_recintos_electorales
FOR SELECT
USING (true);

CREATE POLICY "Permitir lectura pública de presidentes"
ON europa_presidentes_dm
FOR SELECT
USING (true);

-- 3. Crear políticas para actualización (solo autenticados, validar en app)
CREATE POLICY "Permitir actualización autenticada de recintos"
ON europa_recintos_electorales
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir actualización autenticada de presidentes"
ON europa_presidentes_dm
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename LIKE 'europa%'
ORDER BY tablename, policyname;
