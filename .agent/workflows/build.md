---
description: Cómo hacer build del CRM Electoral para producción
---

# Build del CRM Electoral

El proyecto usa **Next.js Static Export** - solo se sube la carpeta `out/` al servidor.

## Pasos

// turbo-all
1. Navegar al proyecto:
```bash
cd I:\prueba_youtube\crm_electoral
```

2. Ejecutar el build:
```bash
npm run build
```

3. Verificar que la carpeta `out/` fue generada:
```bash
dir out
```

## Notas Importantes

- **Solo subir la carpeta `out/`** al servidor (no `.next/`, no `node_modules/`)
- El build genera páginas estáticas (HTML) en `out/`
- Las rutas API (`/api/*`) son dinámicas y requieren un servidor Node.js si se usan
- Para un export estático puro, las rutas API NO estarán disponibles

## Después del Build

Copiar el contenido de `out/` al servidor web (Apache, Nginx, etc.)
