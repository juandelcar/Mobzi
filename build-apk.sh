#!/bin/bash

# Script para construir la APK de Mobzi
# Asegúrate de tener configuradas las variables de entorno antes de ejecutar

set -e  # Salir si hay algún error

echo "🚀 Iniciando construcción de APK para Mobzi..."

# Verificar que las variables de entorno estén configuradas
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_API_URL no está configurada"
    echo "   Crea un archivo .env.production con las variables necesarias"
    exit 1
fi

# Paso 1: Construir el frontend
echo "📦 Construyendo el frontend..."
npm run build

# Paso 2: Verificar que existe la carpeta android
if [ ! -d "android" ]; then
    echo "📱 Inicializando proyecto Android con Bubblewrap..."
    echo "   Asegúrate de tener tu manifest.json accesible públicamente"
    read -p "   Ingresa la URL pública de tu manifest.json: " MANIFEST_URL
    bubblewrap init --manifest="$MANIFEST_URL"
fi

# Paso 3: Actualizar la configuración de Android
echo "🔄 Actualizando configuración de Android..."
read -p "   Ingresa la URL pública de tu manifest.json: " MANIFEST_URL
bubblewrap update --manifest="$MANIFEST_URL"

# Paso 4: Verificar que existe el keystore
if [ ! -f "android/android.keystore" ]; then
    echo "🔐 Generando keystore..."
    echo "   IMPORTANTE: Guarda la contraseña del keystore de forma segura"
    cd android
    keytool -genkey -v -keystore android.keystore -alias mobzi -keyalg RSA -keysize 2048 -validity 10000
    cd ..
fi

# Paso 5: Construir la APK
echo "🔨 Construyendo APK..."
cd android
./gradlew assembleRelease

# Paso 6: Firmar la APK
echo "✍️  Firmando APK..."
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore android.keystore app/build/outputs/apk/release/app-release-unsigned.apk mobzi

# Paso 7: Alinear la APK
echo "📐 Alineando APK..."
zipalign -v 4 app/build/outputs/apk/release/app-release-unsigned.apk app/build/outputs/apk/release/mobzi-release.apk

cd ..

echo "✅ APK generada exitosamente!"
echo "📍 Ubicación: android/app/build/outputs/apk/release/mobzi-release.apk"

