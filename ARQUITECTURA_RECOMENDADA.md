# Arquitectura Recomendada para Producción

## Opción 1: Frontend en Vercel/Netlify + Backend con ngrok (RECOMENDADO)

### Ventajas:
- ✅ **Frontend estable**: Vercel/Netlify ofrecen dominios fijos y HTTPS automático
- ✅ **Solo backend con ngrok**: Más simple de mantener
- ✅ **Mejor rendimiento**: CDN global para el frontend
- ✅ **Despliegue automático**: Conecta tu repo y despliega automáticamente
- ✅ **Gratis**: Ambos servicios tienen planes gratuitos generosos

### Configuración:

1. **Desplegar Frontend en Vercel:**
   ```bash
   # Instalar Vercel CLI
   npm i -g vercel
   
   # Desde la carpeta frontend
   cd frontend
   vercel
   ```

2. **Configurar variables de entorno en Vercel:**
   - Ve a tu proyecto en Vercel → Settings → Environment Variables
   - Agrega: `NEXT_PUBLIC_API_URL=https://TU_NGROK_BACKEND.ngrok-free.dev/api/v1`

3. **Backend con ngrok:**
   ```bash
   # Solo necesitas exponer el backend
   ngrok http 3001
   ```

4. **Actualizar CORS en backend:**
   ```env
   # En .env del backend
   CORS_ORIGIN=https://tu-app.vercel.app
   ```

### Estructura:
```
Frontend (Vercel): https://mobzi.vercel.app
Backend (ngrok):   https://abc123.ngrok-free.dev
```

---

## Opción 2: Todo con Caddy + ngrok (Actual)

### Ventajas:
- ✅ Todo en un solo túnel
- ✅ Fácil de configurar localmente

### Desventajas:
- ❌ URL de ngrok cambia (plan gratuito)
- ❌ Menos estable
- ❌ Más complejo de mantener

### Mejoras para esta opción:

1. **Usar ngrok con dominio fijo** (requiere plan de pago):
   ```bash
   ngrok http 8080 --domain=tu-dominio-fijo.ngrok.app
   ```

2. **Configurar variable de entorno en el build:**
   ```bash
   NEXT_PUBLIC_API_URL=https://tu-dominio-fijo.ngrok.app/api/v1 npm run build
   ```

---

## Opción 3: Backend en Railway/Render + Frontend en Vercel

### Ventajas:
- ✅ Todo con dominios fijos
- ✅ Más profesional
- ✅ Sin necesidad de mantener servidor local

### Configuración:

1. **Backend en Railway:**
   - Conecta tu repo de GitHub
   - Railway detecta automáticamente Node.js
   - Obtienes URL fija: `https://mobzi-backend.railway.app`

2. **Frontend en Vercel:**
   - Configura `NEXT_PUBLIC_API_URL=https://mobzi-backend.railway.app/api/v1`

---

## Recomendación Final

**Para desarrollo/testing rápido**: Usa Opción 2 (Caddy + ngrok) con las correcciones aplicadas.

**Para producción/serio**: Usa **Opción 1** (Vercel + ngrok) o **Opción 3** (Railway + Vercel).

### Pasos para migrar a Vercel:

1. **Preparar el frontend:**
   ```bash
   cd frontend
   npm run build  # Verificar que compile
   ```

2. **Crear cuenta en Vercel:**
   - Ve a https://vercel.com
   - Conecta tu repositorio de GitHub

3. **Configurar variables de entorno:**
   - `NEXT_PUBLIC_API_URL`: URL de tu backend (ngrok o Railway)

4. **Desplegar:**
   - Vercel detecta Next.js automáticamente
   - Despliega en un clic

5. **Actualizar APK:**
   - Actualiza `twa-manifest.json` con la nueva URL de Vercel
   - Reconstruye la APK

---

## Solución Rápida para el Problema Actual

Si quieres seguir con Caddy + ngrok, asegúrate de:

1. **Limpiar caché del navegador** en tu teléfono
2. **Reconstruir el frontend** con la nueva configuración:
   ```bash
   cd frontend
   npm run build
   ```

3. **Verificar que la detección funcione:**
   - Abre la consola del navegador en tu teléfono
   - Deberías ver: `🔗 [apiRequest] Using ngrok with Caddy (no port)`

Si aún no funciona, configura la variable de entorno explícitamente:
```bash
NEXT_PUBLIC_API_URL=https://fontal-curt-unhomogeneously.ngrok-free.dev/api/v1 npm run build
```

