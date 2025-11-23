# Guía: Frontend en Netlify + Backend con ngrok

## ✅ Ventajas de esta Configuración

- ✅ **Frontend estable**: Netlify da URL fija y HTTPS automático
- ✅ **Solo backend con ngrok**: Usas tu único túnel de ngrok para el backend
- ✅ **Mejor rendimiento**: CDN global de Netlify para el frontend
- ✅ **Gratis**: Ambos servicios tienen planes gratuitos generosos
- ✅ **Más simple**: No necesitas Caddy

## 📋 Pasos para Configurar

### Paso 1: Preparar el Frontend para Netlify

#### 1.1 Crear archivo `netlify.toml` (opcional pero recomendado)

Crea `frontend/netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 1.2 Verificar que Next.js esté configurado para export estático (si es necesario)

Para Next.js con App Router, Netlify lo maneja automáticamente. No necesitas cambios.

### Paso 2: Desplegar Frontend en Netlify

#### Opción A: Desde GitHub (Recomendado)

1. **Sube tu código a GitHub** (si no lo has hecho):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin TU_REPO_URL
   git push -u origin main
   ```

2. **Ve a [Netlify](https://www.netlify.com)** y crea una cuenta

3. **Nuevo sitio desde Git**:
   - Conecta tu repositorio de GitHub
   - Selecciona el repositorio
   - **Configuración de build:**
     - Build command: `cd frontend && npm run build`
     - Publish directory: `frontend/.next` (o `frontend/out` si usas export estático)
     - Base directory: `frontend`

4. **Variables de entorno** (opcional por ahora):
   - Puedes agregar `NEXT_PUBLIC_API_URL` más tarde cuando tengas la URL de ngrok

5. **Desplegar**

6. **Copia la URL de Netlify**, ejemplo:
   ```
   https://mobzi-app.netlify.app
   ```

#### Opción B: Arrastrar y Soltar (Rápido para pruebas)

1. **Construye el frontend localmente:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Ve a [Netlify Drop](https://app.netlify.com/drop)**
   - Arrastra la carpeta `.next` o `out` (depende de tu configuración)
   - Netlify te dará una URL temporal

### Paso 3: Configurar Backend con ngrok

```bash
# Terminal 1: Iniciar backend
cd backend
npm run dev

# Terminal 2: ngrok para backend
ngrok http 3001
```

**Copia la URL HTTPS de ngrok del backend**, ejemplo:
```
https://abc123.ngrok-free.dev
```

### Paso 4: Configurar CORS en el Backend

En `backend/.env` o `backend/src/config/app.config.ts`, asegúrate de permitir el origen de Netlify:

```env
CORS_ORIGIN=https://TU-APP.netlify.app
```

O en desarrollo, permite todos los orígenes (ya debería estar configurado).

### Paso 5: Configurar Frontend para usar Backend de ngrok

Tienes **2 opciones**:

#### Opción A: Variable de Entorno en Netlify (Recomendado)

1. **Ve a tu sitio en Netlify** → **Site settings** → **Environment variables**

2. **Agrega variable:**
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://TU-BACKEND-NGROK.ngrok-free.dev/api/v1`
   - Ejemplo: `https://abc123.ngrok-free.dev/api/v1`

3. **Redeploy** el sitio para que tome la nueva variable

4. **Listo**: El frontend usará automáticamente la URL del backend

#### Opción B: Configuración Manual desde la App (Más Flexible)

1. **Abre tu app en Netlify** en tu teléfono/navegador

2. **Ve a Perfil → Configuración del Backend**

3. **Ingresa la URL del backend de ngrok:**
   ```
   https://abc123.ngrok-free.dev
   ```
   (sin /api/v1, la app lo agrega automáticamente)

4. **Prueba conexión** y **guarda**

5. **Listo**: Funciona inmediatamente, sin necesidad de redeploy

### Paso 6: Probar

1. **Abre la app en Netlify** desde tu teléfono
2. **Verifica que el backend esté configurado** (Perfil → Configuración del Backend)
3. **Intenta iniciar sesión**
4. **Si funciona, instala la PWA**

---

## 🔄 Flujo de Trabajo Diario

### Cuando reinicies ngrok (URL cambia):

1. **Obtén la nueva URL de ngrok del backend**

2. **Opción A (Variable de entorno):**
   - Actualiza `NEXT_PUBLIC_API_URL` en Netlify
   - Redeploy

3. **Opción B (Configuración manual - MÁS RÁPIDO):**
   - Abre la app en Netlify
   - Ve a Perfil → Configuración del Backend
   - Actualiza la URL
   - Guarda
   - **Listo en 30 segundos** ✅

---

## 🎯 Ventajas de Netlify + ngrok

### ✅ Ventajas:

- **Frontend siempre disponible**: URL fija de Netlify
- **Solo backend cambia**: Cuando reinicias ngrok, solo actualizas la URL del backend
- **Mejor rendimiento**: CDN de Netlify
- **HTTPS automático**: Netlify lo maneja
- **Deploy automático**: Si conectas GitHub, cada push despliega automáticamente
- **Gratis**: Ambos servicios son gratuitos

### ⚠️ Consideraciones:

- **URL de ngrok cambia**: Cada vez que reinicias ngrok (plan gratuito)
- **Solución**: Usa la configuración manual del backend (Opción B) para actualizar rápido

---

## 🔧 Solución de Problemas

### Problema: Frontend no se conecta al backend

**Verifica:**

1. **Backend está corriendo:**
   ```bash
   curl https://TU-BACKEND-NGROK.ngrok-free.dev/health
   ```

2. **CORS está configurado:**
   - Backend debe permitir: `https://TU-APP.netlify.app`
   - O en desarrollo: permitir todos los orígenes

3. **URL del backend está configurada:**
   - Verifica en Perfil → Configuración del Backend
   - O verifica la variable `NEXT_PUBLIC_API_URL` en Netlify

4. **Revisa la consola del navegador:**
   - Busca errores de CORS
   - Verifica qué URL se está usando para las peticiones

### Problema: Variable de entorno no se aplica

**Solución:**
- Las variables de entorno en Netlify requieren **redeploy**
- Ve a **Deploys** → **Trigger deploy** → **Deploy site**
- O mejor: usa la configuración manual del backend (más rápido)

### Problema: ngrok muestra página de advertencia

**Solución:**
- En la página de advertencia, haz clic en **"Visit Site"**
- O agrega el header `ngrok-skip-browser-warning: true` en las peticiones

---

## 📱 Instalación de PWA desde Netlify

1. **Abre la app en Netlify** desde tu teléfono
2. **Sigue las instrucciones** del componente PWAInstallPrompt
3. **La PWA se instalará** y guardará la configuración del backend
4. **Si cambia ngrok**, actualiza la URL desde Perfil → Configuración del Backend

---

## 🚀 Próximos Pasos (Opcional)

### Para Producción Real:

1. **Backend en hosting real:**
   - Railway, Render, Fly.io, etc.
   - URL fija permanente
   - No necesitas ngrok

2. **Frontend en Netlify:**
   - Ya lo tienes configurado
   - URL fija y estable

3. **Configuración:**
   - Actualiza `NEXT_PUBLIC_API_URL` en Netlify con la URL del hosting
   - O usa la configuración manual del backend

---

## ✅ Checklist Final

- [ ] Frontend desplegado en Netlify
- [ ] URL de Netlify funciona
- [ ] Backend corriendo en localhost:3001
- [ ] Backend expuesto con ngrok
- [ ] CORS configurado en backend para permitir Netlify
- [ ] URL del backend configurada (variable de entorno O configuración manual)
- [ ] Login funciona
- [ ] PWA instalada

---

## 💡 Tips

- **Usa la configuración manual del backend** (Opción B) para cambios rápidos
- **Guarda la URL de Netlify** en favoritos
- **Cuando reinicies ngrok**, actualiza la URL del backend desde la app (30 segundos)
- **Para producción**, considera hosting real para el backend

