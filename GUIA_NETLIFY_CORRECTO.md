# Guía: Desplegar Next.js en Netlify Correctamente

## ❌ Problema: "Page not found" al subir `.next`

**No puedes simplemente subir la carpeta `.next` a Netlify.** Next.js necesita ser construido y desplegado correctamente.

## ✅ Solución: Configuración Correcta

### Opción 1: Desde GitHub (RECOMENDADO - Más fácil)

#### Paso 1: Instalar el plugin de Netlify

```bash
cd frontend
npm install --save-dev @netlify/plugin-nextjs
```

#### Paso 2: Subir código a GitHub

```bash
# Si no tienes git inicializado
git init
git add .
git commit -m "Initial commit"

# Sube a GitHub
git remote add origin TU_REPO_URL
git push -u origin main
```

#### Paso 3: Conectar en Netlify

1. **Ve a [Netlify](https://www.netlify.com)** y crea una cuenta
2. **Nuevo sitio desde Git**
3. **Conecta GitHub** y selecciona tu repositorio
4. **Configuración automática:**
   - Netlify detectará Next.js automáticamente
   - Build command: `cd frontend && npm run build` (o solo `npm run build` si estás en la raíz)
   - Publish directory: `frontend/.next` (o `.next` si estás en la raíz)
   - Base directory: `frontend` (si tu repo tiene frontend y backend)

5. **Variables de entorno** (opcional):
   - `NEXT_PUBLIC_API_URL`: URL de tu backend ngrok
   - Ejemplo: `https://abc123.ngrok-free.dev/api/v1`

6. **Deploy**

#### Paso 4: Verificar

- Netlify construirá tu app automáticamente
- Te dará una URL como: `https://mobzi-app.netlify.app`
- Debería funcionar correctamente

---

### Opción 2: Arrastrar y Soltar (Más complejo, no recomendado)

**⚠️ Esta opción NO funciona bien con Next.js App Router.** Mejor usa la Opción 1.

Si realmente quieres intentarlo:

1. **Construye localmente:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Crea un archivo `_redirects` en `public/`:**
   ```
   /*    /index.html   200
   ```

3. **Arrastra la carpeta `frontend` completa** (no solo `.next`)

4. **Configura en Netlify:**
   - Publish directory: `.next`
   - Build command: (dejar vacío, ya construiste localmente)

**Pero esto puede no funcionar correctamente.** Mejor usa GitHub.

---

### Opción 3: Usar Vercel (Más fácil para Next.js)

Vercel es creado por los mismos que hacen Next.js, así que funciona perfectamente:

1. **Ve a [Vercel](https://vercel.com)**
2. **Importa tu repositorio de GitHub**
3. **Vercel detecta Next.js automáticamente**
4. **Configura variables de entorno:**
   - `NEXT_PUBLIC_API_URL`: URL de tu backend ngrok
5. **Deploy** - ¡Listo en 2 minutos!

---

## 🔧 Configuración del Archivo `netlify.toml`

Ya creé el archivo `netlify.toml` en `frontend/`. Contiene:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
```

Esto le dice a Netlify:
- Cómo construir tu app
- Dónde están los archivos construidos
- Usar el plugin oficial de Next.js

---

## 📋 Checklist para Deploy Correcto

- [ ] Instalado `@netlify/plugin-nextjs` (ya está en package.json)
- [ ] Creado `netlify.toml` (ya está creado)
- [ ] Código subido a GitHub
- [ ] Sitio conectado en Netlify desde GitHub
- [ ] Build command configurado: `cd frontend && npm run build`
- [ ] Publish directory: `frontend/.next`
- [ ] Base directory: `frontend` (si aplica)
- [ ] Variables de entorno configuradas (opcional)
- [ ] Deploy exitoso

---

## 🚨 Errores Comunes

### Error: "Page not found"

**Causa:** Subiste solo `.next` sin el plugin de Netlify

**Solución:** 
1. Usa GitHub + Netlify (Opción 1)
2. O instala el plugin: `npm install --save-dev @netlify/plugin-nextjs`
3. Asegúrate de que `netlify.toml` existe

### Error: "Build failed"

**Causa:** Falta el plugin o configuración incorrecta

**Solución:**
1. Verifica que `@netlify/plugin-nextjs` esté en `package.json`
2. Verifica que `netlify.toml` esté en la raíz del frontend
3. Verifica que el build funcione localmente: `npm run build`

### Error: "Module not found"

**Causa:** Base directory incorrecto

**Solución:**
- Si tu repo tiene `frontend/` y `backend/`, configura:
  - Base directory: `frontend`
  - Build command: `npm run build` (ya estás en frontend)
  - Publish directory: `.next`

---

## 💡 Recomendación Final

**Para Next.js, Vercel es más fácil:**
- Detecta Next.js automáticamente
- No necesitas configuración
- Funciona perfecto desde el primer deploy

**Para Netlify:**
- Necesitas el plugin `@netlify/plugin-nextjs`
- Necesitas `netlify.toml`
- Funciona bien, pero requiere más configuración

---

## 🎯 Pasos Rápidos (Resumen)

1. **Instala el plugin:**
   ```bash
   cd frontend
   npm install --save-dev @netlify/plugin-nextjs
   ```

2. **Sube a GitHub** (si no lo has hecho)

3. **Conecta en Netlify:**
   - Nuevo sitio desde Git
   - Selecciona tu repo
   - Netlify detectará la configuración automáticamente
   - Deploy

4. **Configura backend URL:**
   - Desde la app: Perfil → Configuración del Backend
   - O variable de entorno: `NEXT_PUBLIC_API_URL`

5. **¡Listo!**

