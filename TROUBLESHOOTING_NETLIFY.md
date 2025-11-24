# Troubleshooting: Problemas con Netlify

## 🔴 Problemas Actuales

1. Dobles barras en URL: `https://fontal-curt-unhomogeneously.ngrok-free.dev//auth/login`
2. Página forgot-password da 404
3. Cambios no se reflejan después del deploy

## ✅ Solución Paso a Paso (ANTES de Eliminar)

### Paso 1: Verificar que el Deploy se Completó

1. **Ve a Netlify** → Tu sitio → **Deploys**
2. **Verifica el último deploy:**
   - ¿Está en verde (success)?
   - ¿O está en rojo (failed)?
3. **Si falló:**
   - Haz clic en el deploy fallido
   - Revisa los logs de error
   - Copia el error y compártelo

### Paso 2: Verificar Variables de Entorno

1. **Ve a Netlify** → Site settings → **Environment variables**
2. **Verifica `NEXT_PUBLIC_API_URL`:**
   - Debe ser: `https://fontal-curt-unhomogeneously.ngrok-free.dev/api/v1`
   - **NO** debe tener barra al final
   - **SÍ** debe tener `/api/v1` al final
3. **Si está mal:**
   - Edítala
   - Guarda
   - **Haz redeploy manual** (no automático)

### Paso 3: Redeploy Manual

1. **Ve a Deploys**
2. **Haz clic en "Trigger deploy"** → **"Deploy site"**
3. **Espera a que termine** (puede tardar 2-5 minutos)
4. **Verifica que esté en verde**

### Paso 4: Limpiar Caché Completamente

1. **Abre tu app en Netlify**
2. **Abre DevTools (F12)**
3. **Application** → **Service Workers**:
   - Haz clic en "Unregister" en todos los service workers
4. **Application** → **Storage**:
   - Haz clic en "Clear site data"
   - Marca todas las opciones
   - Haz clic en "Clear site data"
5. **Cierra y abre el navegador de nuevo**
6. **Abre la app en modo incógnito** (`Ctrl+Shift+N`)

### Paso 5: Verificar que los Archivos Estén en GitHub

1. **Ve a tu repositorio en GitHub**
2. **Verifica que estos archivos existan:**
   - `frontend/app/auth/forgot-password/page.tsx`
   - `frontend/lib/api.client.ts` (con los cambios)
   - `frontend/public/service-worker.js` (con los cambios)
3. **Si no están:**
   - Haz push de nuevo:
     ```bash
     cd frontend
     git add .
     git commit -m "Fix URLs and add forgot-password"
     git push
     ```

### Paso 6: Verificar Build Local

Antes de eliminar, prueba construir localmente:

```bash
cd frontend
npm run build
```

**Si falla:**
- Corrige los errores
- Luego sube a GitHub

**Si funciona:**
- El problema es de Netlify, no del código

---

## 🔄 Si Nada Funciona: Eliminar y Recrear

### Opción A: Eliminar Solo el Deploy (Recomendado)

1. **NO elimines el proyecto completo**
2. **Ve a Deploys**
3. **Elimina todos los deploys antiguos** (opcional)
4. **Haz un nuevo deploy desde cero:**
   - Trigger deploy → Clear cache and deploy site

### Opción B: Eliminar y Recrear el Proyecto

**⚠️ Solo si realmente nada funciona**

1. **Anota tu URL de Netlify** (la perderás)
2. **Ve a Site settings** → **General** → **Delete site**
3. **Crea un nuevo sitio:**
   - Nuevo sitio desde Git
   - Conecta tu repositorio
   - **Configuración:**
     - Build command: `cd frontend && npm run build`
     - Publish directory: `frontend/.next`
     - Base directory: `frontend`
   - **Environment variables:**
     - `NEXT_PUBLIC_API_URL` = `https://fontal-curt-unhomogeneously.ngrok-free.dev/api/v1`
   - Deploy

---

## 🔍 Verificación Final

Después de cualquier cambio, verifica en la consola:

```
✅ Debe mostrar:
🔗 [apiRequest] Using NEXT_PUBLIC_API_URL (cleaned): https://fontal-curt-unhomogeneously.ngrok-free.dev/api/v1
🌐 [FINAL] URL que se enviará al servidor: https://fontal-curt-unhomogeneously.ngrok-free.dev/api/v1/auth/login

❌ NO debe mostrar:
🔗 [apiRequest] Using NEXT_PUBLIC_API_URL: https://fontal-curt-unhomogeneously.ngrok-free.dev/
🌐 [FINAL] URL que se enviará al servidor: https://fontal-curt-unhomogeneously.ngrok-free.dev//auth/login
```

---

## 💡 Tips

- **Los cambios en variables de entorno requieren redeploy**
- **Los cambios en código requieren push a GitHub + deploy**
- **Siempre limpia la caché después de cambios importantes**
- **Usa modo incógnito para probar sin caché**

---

## 🎯 Checklist Antes de Eliminar

- [ ] Verificaste que el deploy esté en verde
- [ ] Verificaste que las variables de entorno estén correctas
- [ ] Hiciste redeploy manual
- [ ] Limpiaste caché del navegador
- [ ] Probaste en modo incógnito
- [ ] Verificaste que los archivos estén en GitHub
- [ ] Probaste build local (funciona)

**Si todo esto falla, entonces sí elimina y recrea.**

