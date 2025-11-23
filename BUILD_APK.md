# Guía para Generar APK con Bubblewrap

Esta guía te ayudará a generar una APK de tu aplicación Mobzi usando Bubblewrap (Trusted Web Activity).

## Prerrequisitos

1. **Node.js** (v18 o superior)
2. **Java JDK** (v11 o superior) - Requerido para firmar la APK
3. **Android SDK** - Para herramientas de Android
4. **Ngrok** - Para exponer tu backend públicamente
5. **Caddy** - Para servir el frontend (o cualquier servidor web)

## Paso 1: Instalar Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

## Paso 2: Configurar Ngrok para Backend

1. Inicia ngrok para exponer tu backend:
```bash
ngrok http 3001
```

2. Copia la URL HTTPS que ngrok te proporciona (ej: `https://abc123.ngrok.io`)

3. Configura esta URL en tu backend para CORS:
```bash
# En tu archivo .env del backend
CORS_ORIGIN=https://TU_URL_NGROK_FRONTEND.ngrok.io
```

## Paso 3: Configurar Caddy/Ngrok para Frontend

1. Si usas Caddy, asegúrate de que esté sirviendo el frontend en HTTPS
2. Si usas ngrok para el frontend también:
```bash
ngrok http 3000
```

3. Copia la URL HTTPS del frontend (ej: `https://xyz789.ngrok.io`)

## Paso 4: Actualizar twa-manifest.json

Edita `frontend/twa-manifest.json` y reemplaza:

- `YOUR_NGROK_URL` con tu URL de ngrok del frontend (ej: `https://xyz789.ngrok.io`)
- `webManifestUrl` con la URL completa a tu manifest.json (ej: `https://xyz789.ngrok.io/manifest.json`)

Ejemplo:
```json
{
  "iconUrl": "https://xyz789.ngrok.io/square_logo.png",
  "webManifestUrl": "https://xyz789.ngrok.io/manifest.json",
  ...
}
```

## Paso 5: Configurar Variables de Entorno

Crea un archivo `.env.production` en `frontend/`:

```env
NEXT_PUBLIC_API_URL=https://TU_URL_NGROK_BACKEND.ngrok.io/api/v1
NEXT_PUBLIC_BACKEND_URL=https://TU_URL_NGROK_BACKEND.ngrok.io
```

## Paso 6: Construir el Frontend para Producción

```bash
cd frontend
npm run build
```

## Paso 7: Inicializar Bubblewrap (Primera vez)

```bash
cd frontend
bubblewrap init --manifest=https://TU_URL_NGROK_FRONTEND.ngrok.io/manifest.json
```

Esto creará una carpeta `android/` con la configuración de Android.

## Paso 8: Actualizar Configuración de Android

Si ya tienes la carpeta `android/`, actualiza el manifest:

```bash
cd frontend
bubblewrap update --manifest=https://TU_URL_NGROK_FRONTEND.ngrok.io/manifest.json
```

## Paso 9: Generar Keystore (Primera vez)

```bash
cd frontend/android
keytool -genkey -v -keystore android.keystore -alias mobzi -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANTE**: Guarda la contraseña del keystore de forma segura. La necesitarás para futuras actualizaciones.

## Paso 10: Construir la APK

```bash
cd frontend/android
./gradlew assembleRelease
```

La APK se generará en: `frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk`

## Paso 11: Firmar la APK

```bash
cd frontend/android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore android.keystore app/build/outputs/apk/release/app-release-unsigned.apk mobzi
```

## Paso 12: Alinear la APK (Opcional pero recomendado)

```bash
cd frontend/android
zipalign -v 4 app/build/outputs/apk/release/app-release-unsigned.apk app/build/outputs/apk/release/mobzi-release.apk
```

## Scripts Automatizados

Puedes agregar estos scripts a `frontend/package.json`:

```json
{
  "scripts": {
    "build:apk": "npm run build && cd android && ./gradlew assembleRelease",
    "sign:apk": "cd android && jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore android.keystore app/build/outputs/apk/release/app-release-unsigned.apk mobzi"
  }
}
```

## Notas Importantes

1. **URLs de ngrok**: Las URLs de ngrok cambian cada vez que reinicias ngrok (en el plan gratuito). Para producción, considera usar un dominio personalizado o el plan de ngrok con dominio fijo.

2. **HTTPS**: Bubblewrap requiere HTTPS para funcionar. Asegúrate de que tanto el frontend como el backend estén accesibles vía HTTPS.

3. **CORS**: Asegúrate de que el backend permita CORS desde la URL de ngrok del frontend.

4. **Manifest**: El manifest.json debe estar accesible públicamente en la URL especificada.

5. **Actualizaciones**: Para actualizar la app, solo necesitas actualizar el contenido web. La APK seguirá apuntando a la misma URL.

## Solución de Problemas

### Error: "Failed to fetch manifest"
- Verifica que la URL del manifest sea accesible
- Asegúrate de que el manifest.json tenga el formato correcto

### Error: "CORS policy"
- Verifica la configuración de CORS en el backend
- Asegúrate de que el backend permita el origen del frontend

### Error: "Keystore not found"
- Asegúrate de haber generado el keystore
- Verifica la ruta en twa-manifest.json

### La app no se conecta al backend
- Verifica que NEXT_PUBLIC_API_URL esté configurada correctamente
- Asegúrate de que el backend esté accesible desde la URL de ngrok

