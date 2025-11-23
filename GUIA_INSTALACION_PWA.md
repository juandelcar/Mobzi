# Guía: Instalar PWA en lugar de Acceso Directo

## 🔴 Problema
Al agregar a pantalla principal, solo se crea un acceso directo en lugar de una PWA completa.

## ✅ Soluciones Implementadas

### 1. **Verificar que el Service Worker esté activo**

1. Abre las **Herramientas de Desarrollador** (F12)
2. Ve a la pestaña **Application** (o **Aplicación**)
3. En el menú lateral, busca **Service Workers**
4. Debe mostrar:
   - ✅ Status: **activated and is running**
   - ✅ Scope: **/** (o la URL de tu app)

Si no está activo:
- Recarga la página (Ctrl+R o Cmd+R)
- Si sigue sin funcionar, ve a **Service Workers** → **Unregister** → Recarga la página

### 2. **Verificar el Manifest**

1. En **Application** → **Manifest**
2. Debe mostrar:
   - ✅ Name: "Mobzi - Rutas y transporte público"
   - ✅ Display: "standalone"
   - ✅ Icons: Debe mostrar los íconos correctamente

Si hay errores:
- Verifica que `/manifest.json` sea accesible
- Abre `http://tu-url/manifest.json` en el navegador
- Debe mostrar el JSON sin errores

### 3. **Instalación Correcta**

#### **Chrome/Edge (Desktop):**
1. Debe aparecer un ícono de instalación (➕) en la barra de direcciones
2. O ve al menú (⋮) → **"Instalar Mobzi"**
3. Al instalar, debe abrirse como una ventana independiente (sin barra de direcciones)

#### **Android (Chrome):**
1. Abre el menú del navegador (⋮)
2. Busca **"Instalar app"** o **"Agregar a pantalla de inicio"**
3. Si solo aparece "Agregar a pantalla de inicio", puede crear un acceso directo
4. Para forzar PWA:
   - Ve a **chrome://flags/**
   - Busca **"Add to Home Screen"**
   - Habilita **"Add to Home Screen"**
   - Reinicia Chrome

#### **iOS (Safari):**
1. Toca el botón de compartir (□↑)
2. Selecciona **"Agregar a pantalla de inicio"**
3. En iOS, siempre se instala como PWA (no acceso directo)

### 4. **Verificar que esté instalada como PWA**

Después de instalar:

1. Abre la app desde el ícono en la pantalla de inicio
2. Debe abrirse:
   - ✅ **Sin barra de direcciones** (o barra mínima)
   - ✅ **Sin botones del navegador** (atrás, adelante, etc.)
   - ✅ **Como una app independiente**

Si se abre como acceso directo:
- Tiene barra de direcciones visible
- Muestra botones del navegador
- Se ve como una pestaña del navegador

### 5. **Forzar Instalación como PWA (Chrome)**

Si Chrome sigue creando acceso directo:

1. Abre **chrome://flags/**
2. Busca estas flags y habilítalas:
   - `#enable-desktop-pwas`
   - `#enable-tab-strip`
   - `#enable-desktop-pwas-tab-strip`
3. Reinicia Chrome
4. Intenta instalar de nuevo

### 6. **Verificar Requisitos de PWA**

Para que una PWA sea instalable, debe cumplir:

- ✅ **HTTPS** (o localhost)
- ✅ **Manifest.json** válido
- ✅ **Service Worker** registrado
- ✅ **Íconos** en tamaños correctos (192x192 y 512x512 mínimo)
- ✅ **Display: standalone** en el manifest

### 7. **Debugging**

Si no funciona, verifica en la consola:

```javascript
// Verificar Service Worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});

// Verificar Manifest
fetch('/manifest.json')
  .then(r => r.json())
  .then(manifest => console.log('Manifest:', manifest));

// Verificar si es instalable
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ PWA es instalable!', e);
});
```

### 8. **Solución Rápida**

Si nada funciona:

1. **Limpia la caché del navegador**
2. **Desinstala** cualquier acceso directo existente
3. **Recarga** la página (Ctrl+Shift+R o Cmd+Shift+R)
4. **Espera** a que el Service Worker se active
5. **Intenta instalar** de nuevo

### 9. **Verificar en Network**

1. Abre **Network** en DevTools
2. Recarga la página
3. Busca:
   - ✅ `manifest.json` → Status 200
   - ✅ `service-worker.js` → Status 200
   - ✅ Los íconos deben cargar correctamente

## 📝 Notas Importantes

- **HTTP vs HTTPS**: En HTTP (red local), algunos navegadores pueden crear acceso directo en lugar de PWA
- **Chrome**: A veces requiere flags adicionales para PWA en HTTP
- **Firefox**: No soporta instalación de PWA en desktop (solo Android)
- **Safari iOS**: Siempre instala como PWA cuando usas "Agregar a pantalla de inicio"

## 🎯 Checklist Final

Antes de instalar, verifica:

- [ ] Service Worker está activo
- [ ] Manifest.json es accesible y válido
- [ ] Los íconos cargan correctamente
- [ ] Estás en HTTPS o localhost (para mejor compatibilidad)
- [ ] No hay errores en la consola
- [ ] El prompt de instalación aparece (o las instrucciones manuales)

## 🔧 Si Sigue Sin Funcionar

1. Verifica que todos los archivos estén en `/public`:
   - `manifest.json`
   - `service-worker.js`
   - `square_logo.png` (íconos)

2. Verifica que Next.js esté sirviendo los archivos estáticos correctamente

3. Prueba en otro navegador (Chrome, Edge, Safari)

4. Si estás en HTTP, considera usar HTTPS con ngrok o un certificado local

