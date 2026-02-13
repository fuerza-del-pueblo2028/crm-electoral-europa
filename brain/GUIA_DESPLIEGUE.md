# Guía de Despliegue: Del PC a la Nube (Vercel)

Para que tus cambios locales se vean en `centinelaelectoralsaeeuropa.com`, debes seguir siempre estos tres pasos en tu terminal (PowerShell o CMD).

### 1. Preparar los archivos (Stage)
Este comando le dice a Git: "Quiero incluir todos estos cambios en mi siguiente envío".
```powershell
git add .
```

### 2. Ponerle un nombre al cambio (Commit)
Este comando guarda los cambios en tu ordenador con un mensaje descriptivo.
```powershell
git commit -m "Aquí explicas qué cambiaste (ej: 'ajuste de colores en el menú')"
```

### 3. Subir a la nube (Push)
Este es el comando que "empuja" tu código a GitHub. **Vercel detectará este envío y reconstruirá tu sitio automáticamente.**
```powershell
git push origin main
```

---

### Resumen Rápido (El "Combo" del Desarrollador)
Cuando termines una mejora y quieras verla en internet, ejecuta esto en orden:
1. `git add .`
2. `git commit -m "Mi mejora"`
3. `git push origin main`

### ¿Cómo verificar que se está subiendo?
Puedes entrar a tu panel de **Vercel**. Verás una barra de progreso que dice **"Building..."** (Construyendo). Cuando pase a **"Ready"**, tus cambios ya estarán vivos en la URL oficial.
