-- ============================================
-- TABLE: Actas Electorales
-- ============================================
-- Stores the official tally sheets (Actas) per polling station (Colegio)

CREATE TABLE IF NOT EXISTS actas_electorales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Location Hierarchy
    seccional text NOT NULL,
    ciudad text,
    recinto text,
    colegio text,

    -- Evidence
    archivo_url text, -- URL to the image/pdf in Storage

    -- Vote Counts
    votos_fp integer DEFAULT 0,
    votos_prm integer DEFAULT 0,
    votos_pld integer DEFAULT 0,
    votos_otros integer DEFAULT 0,
    votos_nulos integer DEFAULT 0,

    -- Timestamps
    creado_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE actas_electorales ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Read Access: Authenticated users (Staff & Admin) can view actas
CREATE POLICY "Enable read access for authenticated users"
ON actas_electorales FOR SELECT
TO authenticated
USING (true);

-- 2. Write Access: Only Admins can Insert/Update/Delete
-- Note: Assuming 'rol' field in 'usuarios' table identifies admins.

CREATE POLICY "Enable insert for admins only"
ON actas_electorales FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.cedula = (SELECT cedula FROM usuarios WHERE id = auth.uid())
    AND usuarios.rol = 'administrador'
  )
);

CREATE POLICY "Enable update for admins only"
ON actas_electorales FOR UPDATE
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

CREATE POLICY "Enable delete for admins only"
ON actas_electorales FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.cedula = (SELECT cedula FROM usuarios WHERE id = auth.uid())
    AND usuarios.rol = 'administrador'
  )
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_actas_seccional ON actas_electorales(seccional);
CREATE INDEX IF NOT EXISTS idx_actas_colegio ON actas_electorales(colegio);
