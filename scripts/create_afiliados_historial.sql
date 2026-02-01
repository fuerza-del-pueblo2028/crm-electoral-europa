-- Tabla para registrar historial de cambios de afiliados
-- Permite auditoría y trazabilidad de modificaciones

CREATE TABLE IF NOT EXISTS afiliados_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    afiliado_id UUID NOT NULL REFERENCES afiliados(id) ON DELETE CASCADE,
    accion TEXT NOT NULL, -- 'creado', 'editado', 'validado', 'invalidado', 'eliminado', 'role_cambiado'
    campo_modificado TEXT, -- Nombre del campo que cambió (puede ser NULL para creaciones)
    valor_anterior TEXT, -- Valor antes del cambio
    valor_nuevo TEXT, -- Valor después del cambio
    usuario_id TEXT, -- ID o email del usuario que realizó el cambio
    usuario_nombre TEXT, -- Nombre del usuario que realizó el cambio
    detalles JSONB, -- Datos adicionales en formato JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_afiliados_historial_afiliado_id ON afiliados_historial(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_afiliados_historial_created_at ON afiliados_historial(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_afiliados_historial_accion ON afiliados_historial(accion);

-- Comentarios explicativos
COMMENT ON TABLE afiliados_historial IS 'Registro de todas las modificaciones realizadas a los afiliados para auditoría';
COMMENT ON COLUMN afiliados_historial.accion IS 'Tipo de acción: creado, editado, validado, invalidado, eliminado, role_cambiado';
COMMENT ON COLUMN afiliados_historial.detalles IS 'Información adicional del cambio en formato JSON';

-- Habilitar RLS
ALTER TABLE afiliados_historial ENABLE ROW LEVEL SECURITY;

-- Política de acceso total público (igual que afiliados)
CREATE POLICY "Acceso Total Publico Historial" 
ON afiliados_historial
FOR ALL 
USING (true)
WITH CHECK (true);

-- Verificación
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'afiliados_historial'
ORDER BY ordinal_position;
