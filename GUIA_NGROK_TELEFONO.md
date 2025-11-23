# Guía: Usar PWA en tu Teléfono con ngrok

## 🎯 Objetivo
Acceder a tu PWA desde tu teléfono usando ngrok y que el backend funcione correctamente.

## 📋 Configuración Requerida

### Opción 1: Frontend y Backend en ngroks SEPARADOS (Recomendado)

#### Paso 1: Iniciar Backend con ngrok

```bash
# Terminal 1: Iniciar el backend
cd backend
npm run dev
# El backend corre en http://localhost:3001

# Terminal 2: Exponer backend con ngrok
ngrok http 3001
```

**Copia la URL HTTPS de ngrok del backend**, ejemplo:
```
https://abc123.ngrok-free.dev
```

#### Paso 2: Iniciar Frontend con ngrok

```bash
# Terminal 3: Iniciar el frontend
cd frontend
npm run dev
# El frontend corre en http://localhost:3000

# Terminal 4: Exponer frontend con ngrok
ngrok http 3000
```

**Copia la URL HTTPS de ngrok del frontend**, ejemplo:
```
https://xyz789.ngrok-free.dev
```

#### Paso 3: Configurar Backend URL en la App

1. **Abre la app en tu teléfono** usando la URL del frontend de ngrok:
   ```
   https://xyz789.ngrok-free.dev
   ```

2. **Ve a Perfil → Configuración del Backend**

3. **Ingresa la URL del backend de ngrok** (sin /api/v1):
   ```
   https://abc123.ngrok-free.dev
   ```

4. **Haz clic en "Probar Conexión"** para verificar

5. **Guarda** la configuración

6. **Recarga la página** y ahora debería funcionar el login

#### Paso 4: Instalar PWA

1. Una vez que la app funcione correctamente
2. Sigue las instrucciones para instalar la PWA
3. La PWA guardará la configuración del backend

---

### Opción 2: Frontend y Backend en el MISMO ngrok (con Caddy)

Si usas Caddy como proxy reverso, puedes tener todo en un solo ngrok:

#### Configuración Caddy

```caddyfile
# Caddyfile
:8080 {
    # Redirigir /api/* al backend
    handle /api/* {
        reverse_proxy localhost:3001
    }
    
    # Todo lo demás al frontend
    handle {
        reverse_proxy localhost:3000
    }
}
```

#### Iniciar todo

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Caddy
caddy run

# Terminal 4: ngrok (apunta a Caddy)
ngrok http 8080
```

**Usa la URL de ngrok** en tu teléfono y todo debería funcionar automáticamente.

---

## 🔧 Solución de Problemas

### Problema: Las peticiones van a localhost en lugar de ngrok

**Solución:**
1. Abre la consola del navegador en tu teléfono (si es posible)
2. O usa Chrome DevTools remoto:
   - Conecta tu teléfono por USB
   - En Chrome Desktop: `chrome://inspect`
   - Selecciona tu teléfono y la pestaña
3. Verifica los logs:
   - Busca `🔍 [apiRequest] Detected hostname:`
   - Debe mostrar el hostname de ngrok, no localhost
4. Si muestra localhost:
   - Limpia el localStorage: `localStorage.clear()`
   - Recarga la página
   - Configura la URL del backend manualmente

### Problema: No puedo iniciar sesión

**Verifica:**

1. **Backend está corriendo:**
   ```bash
   curl https://TU-BACKEND-NGROK.ngrok-free.dev/health
   ```
   Debe responder con `{"status":"ok",...}`

2. **Backend URL está configurada:**
   - Ve a Perfil → Configuración del Backend
   - Debe mostrar la URL del backend de ngrok
   - Si no, configúrala

3. **CORS está configurado en el backend:**
   - Verifica que el backend permita el origen del frontend de ngrok
   - En `backend/.env`:
     ```
     CORS_ORIGIN=https://TU-FRONTEND-NGROK.ngrok-free.dev
     ```

4. **Revisa la consola:**
   - Busca errores de CORS
   - Busca errores de red
   - Verifica la URL que se está usando

### Problema: ngrok muestra página de advertencia

**Solución:**
1. En la página de advertencia de ngrok, haz clic en **"Visit Site"**
2. O agrega el header en las peticiones:
   ```javascript
   headers: {
     'ngrok-skip-browser-warning': 'true'
   }
   ```

---

## 📱 Acceso desde Teléfono

### Método 1: ngrok (Recomendado para pruebas)

1. Inicia ngrok para frontend y backend
2. Abre la URL de ngrok del frontend en tu teléfono
3. Configura la URL del backend desde la app
4. Instala la PWA

### Método 2: IP Local (Solo misma red WiFi)

1. **Obtén tu IP local:**
   ```bash
   # Windows
   ipconfig
   # Busca "IPv4 Address", ejemplo: 192.168.1.100
   
   # Mac/Linux
   ifconfig
   # Busca "inet", ejemplo: 192.168.1.100
   ```

2. **Inicia el frontend accesible desde la red:**
   ```bash
   cd frontend
   npm run dev
   # Next.js por defecto solo escucha en localhost
   # Necesitas configurarlo para escuchar en todas las interfaces
   ```

3. **Configura Next.js para escuchar en todas las interfaces:**
   - Edita `package.json`:
     ```json
     {
       "scripts": {
         "dev": "next dev -H 0.0.0.0"
       }
     }
     ```

4. **Accede desde tu teléfono:**
   ```
   http://192.168.1.100:3000
   ```

5. **Configura el backend:**
   - Si el backend también está en la misma red:
     ```
     http://192.168.1.100:3001
     ```
   - O usa ngrok solo para el backend

---

## ✅ Checklist

Antes de probar en tu teléfono:

- [ ] Backend está corriendo en `localhost:3001`
- [ ] Backend está expuesto con ngrok: `https://abc123.ngrok-free.dev`
- [ ] Frontend está corriendo en `localhost:3000`
- [ ] Frontend está expuesto con ngrok: `https://xyz789.ngrok-free.dev`
- [ ] Puedes acceder al backend: `curl https://abc123.ngrok-free.dev/health`
- [ ] Puedes acceder al frontend desde el navegador
- [ ] CORS está configurado en el backend para permitir el frontend de ngrok
- [ ] Has configurado la URL del backend en la app (Perfil → Configuración del Backend)

---

## 🎯 Flujo Recomendado

1. **Inicia backend + ngrok backend**
2. **Inicia frontend + ngrok frontend**
3. **Abre frontend de ngrok en teléfono**
4. **Configura backend URL en la app**
5. **Prueba login**
6. **Instala PWA**
7. **¡Listo!**

---

## 💡 Tips

- **ngrok free plan:** Las URLs cambian cada vez que reinicias ngrok
- **Solución:** Usa el diálogo de configuración del backend para actualizar la URL fácilmente
- **Para producción:** Considera usar ngrok con dominio fijo ($8/mes) o hosting real

