# Soluciones para Backend con ngrok en APK

## 🔴 Problema Actual

Cuando compilas una APK con Bubblewrap, las variables de entorno de Next.js (`NEXT_PUBLIC_API_URL`) se "bakean" en el build. Si la URL de ngrok cambia (plan gratuito), la APK ya no puede conectarse al backend.

---

## ✅ Opciones de Solución

### **Opción 1: Usar ngrok con Dominio Fijo (Recomendado para Producción)**

**Ventajas:**
- ✅ URL fija que no cambia
- ✅ No necesitas recompilar la APK
- ✅ Funciona de forma estable

**Desventajas:**
- ❌ Requiere plan de pago de ngrok ($8/mes)

**Pasos:**

1. **Obtener dominio fijo en ngrok:**
   ```bash
   # Instalar ngrok y autenticarte
   ngrok config add-authtoken TU_TOKEN
   
   # Iniciar con dominio fijo
   ngrok http 3001 --domain=tu-dominio-fijo.ngrok.app
   ```

2. **Configurar en el build:**
   ```bash
   cd frontend
   NEXT_PUBLIC_API_URL=https://tu-dominio-fijo.ngrok.app/api/v1 npm run build
   ```

3. **Compilar APK:**
   ```bash
   bubblewrap build
   ```

---

### **Opción 2: Configuración Dinámica desde localStorage (GRATIS)**

**Ventajas:**
- ✅ Gratis
- ✅ No necesitas recompilar la APK
- ✅ Puedes cambiar la URL del backend sin actualizar la app

**Desventajas:**
- ⚠️ Requiere configurar la URL manualmente la primera vez

**Cómo funciona:**
La app busca la URL del backend en `localStorage`. Si no existe, muestra un diálogo para configurarla.

**Implementación:**
Ya está implementado en el código. Solo necesitas:

1. **Compilar la APK SIN `NEXT_PUBLIC_API_URL`:**
   ```bash
   cd frontend
   # NO configures NEXT_PUBLIC_API_URL
   npm run build
   bubblewrap build
   ```

2. **Al abrir la app por primera vez:**
   - La app detectará que no hay URL configurada
   - Mostrará un diálogo para ingresar la URL de ngrok del backend
   - Guardará la URL en `localStorage`
   - Usará esa URL para todas las peticiones

3. **Si cambia la URL de ngrok:**
   - Ve a Configuración en la app
   - Actualiza la URL del backend
   - La app usará la nueva URL inmediatamente

---

### **Opción 3: Endpoint de Configuración Remota (GRATIS)**

**Ventajas:**
- ✅ Gratis
- ✅ Centralizado
- ✅ Puedes cambiar la URL sin tocar la app

**Desventajas:**
- ⚠️ Necesitas un servidor/hosting para el archivo de configuración

**Pasos:**

1. **Crear archivo de configuración público:**
   ```json
   // Hosteado en GitHub Pages, Netlify, Vercel, etc.
   {
     "backendUrl": "https://tu-nueva-url-ngrok.ngrok-free.dev/api/v1"
   }
   ```

2. **La app carga la configuración al iniciar:**
   - Al abrir la app, hace una petición a la URL de configuración
   - Obtiene la URL del backend actualizada
   - La usa para todas las peticiones

**Implementación:**
Ver código en `lib/api.config.ts` (ya incluye soporte para esto)

---

### **Opción 4: Usar Servicio de Hosting Real (Mejor para Producción)**

**Ventajas:**
- ✅ URL fija y estable
- ✅ Mejor rendimiento
- ✅ Más profesional

**Desventajas:**
- ⚠️ Requiere configurar hosting

**Opciones de hosting:**

#### **Railway (Recomendado - Fácil)**
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Desde la carpeta backend
cd backend
railway login
railway init
railway up
```

#### **Render**
1. Conecta tu repo de GitHub
2. Selecciona el backend
3. Render te da una URL fija automáticamente

#### **Fly.io**
```bash
# Instalar flyctl
flyctl auth login
flyctl launch
```

**Después de hostear:**
1. Actualiza `NEXT_PUBLIC_API_URL` con la URL del hosting
2. Recompila la APK
3. Listo

---

### **Opción 5: Detección Automática Mejorada (Ya Implementado)**

**Ventajas:**
- ✅ Funciona automáticamente
- ✅ Detecta ngrok dinámicamente

**Cómo funciona:**
El código ya detecta automáticamente si estás usando ngrok basándose en el hostname. Si el frontend está en ngrok, asume que el backend está en la misma URL base con `/api/v1`.

**Limitación:**
Solo funciona si el frontend y backend están en la misma URL de ngrok (usando Caddy como proxy).

---

## 🎯 Recomendación por Escenario

### **Desarrollo/Testing:**
→ **Opción 2** (Configuración dinámica desde localStorage)
- Gratis
- Flexible
- Fácil de cambiar

### **Producción Temporal:**
→ **Opción 1** (ngrok con dominio fijo)
- $8/mes
- Estable
- No requiere recompilar

### **Producción Real:**
→ **Opción 4** (Hosting real)
- Más profesional
- Mejor rendimiento
- URL fija permanente

---

## 🔧 Implementación Rápida (Opción 2)

Si quieres usar la **Opción 2** (configuración dinámica), el código ya está listo. Solo necesitas:

1. **Compilar sin `NEXT_PUBLIC_API_URL`:**
   ```bash
   cd frontend
   npm run build
   bubblewrap build
   ```

2. **Al instalar la APK:**
   - La app mostrará un diálogo para configurar la URL del backend
   - Ingresa: `https://tu-url-ngrok.ngrok-free.dev/api/v1`
   - La app guardará y usará esa URL

3. **Si cambia ngrok:**
   - Ve a Configuración → Backend URL
   - Actualiza la URL
   - Listo

---

## 🐛 Debugging

Si el backend no funciona en tu teléfono:

1. **Verifica que ngrok esté corriendo:**
   ```bash
   ngrok http 3001
   ```

2. **Verifica la URL en la app:**
   - Abre la consola del navegador (si es posible)
   - O revisa los logs de la app
   - Busca mensajes que digan `🔗 [apiRequest] Using...`

3. **Prueba la URL directamente:**
   ```bash
   curl https://tu-url-ngrok.ngrok-free.dev/api/v1/health
   ```

4. **Verifica CORS:**
   - Asegúrate de que el backend permita el origen del frontend
   - Revisa `backend/src/index.ts` - configuración de CORS

---

## 📝 Notas Importantes

- **ngrok free plan:** Las URLs cambian cada vez que reinicias ngrok
- **ngrok paid plan:** Puedes tener dominios fijos
- **Variables de entorno:** Se "bakean" en el build de Next.js, no se pueden cambiar después
- **localStorage:** Persiste entre sesiones, perfecto para configuración dinámica
- **CORS:** Siempre verifica que el backend permita el origen correcto

