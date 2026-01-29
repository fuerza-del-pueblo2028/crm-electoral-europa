-- ============================================
-- SCHEMA: Europa Electoral - Recintos y Presidentes
-- ============================================
-- Tablas para gestionar datos electorales de Europa
-- Incluye: 7 seccionales (Madrid, Barcelona, Milano, Holanda, Valencia, Zurich) 
-- y Presidentes de Direcciones Medias de Italia
-- ============================================

-- TABLA PRINCIPAL: Recintos Electorales de Europa
-- ============================================

CREATE TABLE IF NOT EXISTS europa_recintos_electorales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  seccional text NOT NULL CHECK (seccional IN ('Madrid', 'Barcelona', 'Milano', 'Holanda', 'Valencia', 'Zurich')),
  numero_recinto text NOT NULL,
  nombre_recinto text NOT NULL,
  
  -- Ubicación
  pais text,
  zona_ciudad text NOT NULL,
  direccion text,
  
  -- Datos electorales
  total_electores integer NOT NULL DEFAULT 0,
  total_colegios integer NOT NULL DEFAULT 0,
  colegios_ text,  -- "0001 Y 0002" o "1495,1496 Y1497"
  
  -- Metadatos
  metadata jsonb DEFAULT '{}'::jsonb,  -- Para datos adicionales específicos por seccional
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraint único por seccional y número de recinto
  UNIQUE(seccional, numero_recinto)
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_europa_recintos_seccional ON europa_recintos_electorales(seccional);
CREATE INDEX IF NOT EXISTS idx_europa_recintos_pais ON europa_recintos_electorales(pais);
CREATE INDEX IF NOT EXISTS idx_europa_recintos_zona ON europa_recintos_electorales(zona_ciudad);
CREATE INDEX IF NOT EXISTS idx_europa_recintos_numero ON europa_recintos_electorales(numero_recinto);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_europa_recintos_updated_at 
  BEFORE UPDATE ON europa_recintos_electorales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE europa_recintos_electorales IS 'Recintos electorales de las seccionales europeas (Madrid, Barcelona, Milano, Holanda, Valencia, Zurich)';


-- ============================================
-- TABLA: Presidentes de Direcciones Medias (Italia)
-- ============================================

CREATE TABLE IF NOT EXISTS europa_presidentes_dm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  codigo text,  -- Ej: "DM-EX-8-2588-2-8-2588-2"
  tipo_localidad text DEFAULT 'Exterior',
  
  -- Datos del presidente
  nombre_completo text NOT NULL,
  cedula text,
  celular text,
  
  -- Ubicación
  pais text NOT NULL,
  estado_ca text,  -- Estado o Comunidad Autónoma
  condado_provincia text,
  
  -- Relación con recinto (opcional, algunos no tienen recinto asignado)
  recinto_referencia text,  -- Ej: "(00008) - CENTRO CIVICO NORD"
  recinto_id uuid REFERENCES europa_recintos_electorales(id) ON DELETE SET NULL,
  
  -- Métricas
  total_dm integer DEFAULT 0,  -- Total en la DM
  total_afiliados integer DEFAULT 0,
  status text CHECK (status IN ('Completo', 'Suficiente', 'Incompleto')),
  fecha numeric,  -- Formato de fecha de Excel (serial number)
  fecha_converted timestamptz,  -- Fecha convertida
  
  -- Metadatos
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_presidentes_dm_pais ON europa_presidentes_dm(pais);
CREATE INDEX IF NOT EXISTS idx_presidentes_dm_provincia ON europa_presidentes_dm(condado_provincia);
CREATE INDEX IF NOT EXISTS idx_presidentes_dm_status ON europa_presidentes_dm(status);
CREATE INDEX IF NOT EXISTS idx_presidentes_dm_recinto ON europa_presidentes_dm(recinto_id);
CREATE INDEX IF NOT EXISTS idx_presidentes_dm_cedula ON europa_presidentes_dm(cedula);

-- Trigger updated_at
CREATE TRIGGER update_europa_presidentes_dm_updated_at 
  BEFORE UPDATE ON europa_presidentes_dm
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE europa_presidentes_dm IS 'Presidentes de Direcciones Medias de Italia con sus datos de contacto y métricas';


-- ============================================
-- TABLA: Colegios Electorales (Detalle granular - OPCIONAL)
-- ============================================
-- Esta tabla es opcional si necesitas granularidad a nivel de colegio individual

CREATE TABLE IF NOT EXISTS europa_colegios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación con recinto
  recinto_id uuid NOT NULL REFERENCES europa_recintos_electorales(id) ON DELETE CASCADE,
  
  -- Datos del colegio
  numero_colegio text NOT NULL,
  electores_asignados integer DEFAULT 0,
  
  -- Metadatos
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  
  -- Un recinto no puede tener dos colegios con el mismo número
  UNIQUE(recinto_id, numero_colegio)
);

CREATE INDEX IF NOT EXISTS idx_colegios_recinto ON europa_colegios(recinto_id);
CREATE INDEX IF NOT EXISTS idx_colegios_numero ON europa_colegios(numero_colegio);

COMMENT ON TABLE europa_colegios IS 'Colegios electorales individuales dentro de cada recinto (tabla opcional para granularidad)';


-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE europa_recintos_electorales ENABLE ROW LEVEL SECURITY;
ALTER TABLE europa_presidentes_dm ENABLE ROW LEVEL SECURITY;
ALTER TABLE europa_colegios ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados pueden leer todos los datos
CREATE POLICY "authenticated_read_recintos" 
  ON europa_recintos_electorales 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "authenticated_read_presidentes" 
  ON europa_presidentes_dm 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "authenticated_read_colegios" 
  ON europa_colegios 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Política: Solo administradores pueden modificar
CREATE POLICY "admin_modify_recintos" 
  ON europa_recintos_electorales 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.cedula = (SELECT cedula FROM usuarios WHERE id = auth.uid())
      AND usuarios.rol = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.cedula = (SELECT cedula FROM usuarios WHERE id = auth.uid())
      AND usuarios.rol = 'administrador'
    )
  );

CREATE POLICY "admin_modify_presidentes" 
  ON europa_presidentes_dm 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.cedula = (SELECT cedula FROM usuarios WHERE id = auth.uid())
      AND usuarios.rol = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.cedula = (SELECT cedula FROM usuarios WHERE id = auth.uid())
      AND usuarios.rol = 'administrador'
    )
  );

CREATE POLICY "admin_modify_colegios" 
  ON europa_colegios 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.cedula = (SELECT cedula FROM usuarios WHERE id = auth.uid())
      AND usuarios.rol = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.cedula = (SELECT cedula FROM usuarios WHERE id = auth.uid())
      AND usuarios.rol = 'administrador'
    )
  );


-- ============================================
-- FUNCIONES HELPER
-- ============================================

-- Función para obtener estadísticas por seccional
CREATE OR REPLACE FUNCTION get_estadisticas_seccional(p_seccional text)
RETURNS TABLE (
  seccional text,
  total_recintos bigint,
  total_electores bigint,
  total_colegios bigint,
  promedio_electores_por_recinto numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_seccional,
    COUNT(*)::bigint,
    SUM(total_electores)::bigint,
    SUM(total_colegios)::bigint,
    ROUND(AVG(total_electores), 2)
  FROM europa_recintos_electorales
  WHERE europa_recintos_electorales.seccional = p_seccional;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener presidentes DM por provincia
CREATE OR REPLACE FUNCTION get_presidentes_por_provincia(p_provincia text)
RETURNS TABLE (
  nombre text,
  cedula text,
  celular text,
  total_afiliados integer,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nombre_completo,
    europa_presidentes_dm.cedula,
    europa_presidentes_dm.celular,
    europa_presidentes_dm.total_afiliados,
    europa_presidentes_dm.status
  FROM europa_presidentes_dm
  WHERE condado_provincia = p_provincia
  ORDER BY total_afiliados DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_estadisticas_seccional IS 'Obtiene estadísticas agregadas de una seccional específica';
COMMENT ON FUNCTION get_presidentes_por_provincia IS 'Obtiene presidentes DM de una provincia específica ordenados por afiliados';
