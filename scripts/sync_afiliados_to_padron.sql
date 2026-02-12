-- 1. Create Function to Sync New Affiliates to Padron
CREATE OR REPLACE FUNCTION public.sync_afiliado_to_padron()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into elecciones_padron, formatting cedula if necessary (or keeping raw)
    -- We assume padron stores cedula with dashes usually, but our previous fix handles raw numbers too.
    -- Ideally, we store consistent format. Let's start with raw copy.
    INSERT INTO public.elecciones_padron (nombre, cedula, email, fecha_nacimiento)
    VALUES (
        NEW.nombre || ' ' || NEW.apellidos,
        REGEXP_REPLACE(NEW.cedula, '\D', '', 'g'), -- Remove dashes/spaces/letters, keep only numbers
        NEW.email,
        NEW.fecha_nacimiento
    )
    ON CONFLICT (cedula) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Create Trigger
DROP TRIGGER IF EXISTS trigger_sync_padron ON public.afiliados;

CREATE TRIGGER trigger_sync_padron
AFTER INSERT ON public.afiliados
FOR EACH ROW
EXECUTE FUNCTION public.sync_afiliado_to_padron();


-- 3. (Optional) Manual Backfill is already done via Node script.
-- If you need to run it again manually:
-- INSERT INTO public.elecciones_padron (...) SELECT ...
