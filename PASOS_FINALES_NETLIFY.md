# Pasos Finales para que Funcione en Netlify

## ✅ Checklist Completo

### Paso 1: Actualizar Variable de Entorno en Netlify

1. **Ve a Netlify** → Tu sitio → **Site settings** → **Environment variables**

2. **Edita `NEXT_PUBLIC_API_URL`:**
   - Valor actual: `https://fontal-curt-unhomogeneously.ngrok-free.dev/`
   - **Cambia a:** `https://fontal-curt-unhomogeneously.ngrok-free.dev/api/v1`
   - **IMPORTANTE:** Sin barra al final, pero CON `/api/v1`

3. **Guarda** los cambios

### Paso 2: Subir Cambios a GitHub

```bash
# Desde la carpeta del proyecto (raíz)
cd frontend

# Verifica que los cambios estén guardados
git status

# Agrega los archivos modificados
git add lib/api.client.ts lib/api.config.ts

# O agrega todos los cambios
git add .

# Haz commit
git commit -m "Fix: Corregir construcción de URLs del backend para evitar dobles barras"

# Sube a GitHub
git push
```

### Paso 3: Redeploy en Netlify

**Opción A: Automático (si tienes CI/CD configurado)**
- Netlify detectará el push a GitHub automáticamente
- Iniciará un nuevo deploy
- Espera a que termine (verás el progreso en Netlify)

**Opción B: Manual**
1. Ve a Netlify → Tu sitio → **Deploys**
2. Haz clic en **"Trigger deploy"** → **"Deploy site"**
3. Espera a que termine

### Paso 4: Verificar que Funciona

1. **Abre tu app en Netlify** (la URL que te dio Netlify)

2. **Abre la consola del navegador** (F12)

3. **Intenta iniciar sesión**

4. **Verifica en la consola** que veas:
   ```
   🔗 [apiRequest] Using NEXT_PUBLIC_API_URL (cleaned): https://fontal-curt-unhomogeneously.ngrok-free.dev/api/v1
   🌐 [FINAL] URL que se enviará al servidor: https://fontal-curt-unhomogeneously.ngrok-free.dev/api/v1/auth/login
   ```
   
   **NO debe haber dobles barras** (`//`)

5. **Si funciona:**
   - ✅ Deberías poder iniciar sesión
   - ✅ La app debería conectarse al backend correctamente

---

## 🔧 Si Aún No Funciona

### Verificar Backend

1. **Asegúrate de que el backend esté corriendo:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Asegúrate de que ngrok esté corriendo:**
   ```bash
   ngrok http 3001
   ```

3. **Prueba el backend directamente:**
   ```bash
   curl https://fontal-curt-unhomogeneously.ngrok-free.dev/health
   ```
   
   Debería responder con:
   ```json
   {"status":"ok","timestamp":"...","database":"connected",...}
   ```

### Verificar CORS

Asegúrate de que el backend permita el origen de Netlify:

En `backend/.env` o configuración de CORS:
```env
CORS_ORIGIN=https://TU-APP.netlify.app
```

O en desarrollo, permite todos los orígenes (ya debería estar configurado).

### Limpiar Caché

1. **Limpia la caché del navegador:**
   - `Ctrl+Shift+Delete`
   - Selecciona "Caché"
   - Limpia

2. **O usa modo incógnito:**
   - `Ctrl+Shift+N` (Chrome/Edge)
   - Prueba la app de nuevo

---

## 📋 Resumen de lo que Hicimos

1. ✅ **Corregimos el código** para manejar correctamente las URLs
2. ✅ **Agregamos limpieza de barras** para evitar dobles barras
3. ✅ **Agregamos `/api/v1` automáticamente** si no está en la variable

## 🎯 Lo que Tienes que Hacer

1. **Actualizar variable en Netlify:** `https://fontal-curt-unhomogeneously.ngrok-free.dev/api/v1`
2. **Subir cambios a GitHub:** `git add . && git commit -m "Fix URLs" && git push`
3. **Esperar deploy en Netlify** (automático o manual)
4. **Probar el login**

---

## ✅ Verificación Final

Después de todo, deberías ver en la consola:

```
🔗 [apiRequest] Using NEXT_PUBLIC_API_URL (cleaned): https://fontal-curt-unhomogeneously.ngrok-free.dev/api/v1
🌐 [FINAL] URL que se enviará al servidor: https://fontal-curt-unhomogeneously.ngrok-free.dev/api/v1/auth/login
```

Y el login debería funcionar correctamente.

