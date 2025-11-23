'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Esperar a que la página cargue completamente
      window.addEventListener('load', () => {
        // Registrar el service worker con scope completo
        navigator.serviceWorker
          .register('/service-worker.js', {
            scope: '/',
          })
          .then((registration) => {
            console.log('✅ Service Worker registrado:', registration.scope);
            console.log('✅ Estado:', registration.active ? 'Activo' : 'Instalando');
            
            // Verificar si hay una actualización disponible
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🔄 Nueva versión disponible');
                  }
                });
              }
            });

            // Verificar actualizaciones periódicamente
            setInterval(() => {
              registration.update();
            }, 60000); // Cada minuto
          })
          .catch((error) => {
            console.warn('⚠️ Error al registrar Service Worker:', error);
          });
      });
    }
  }, []);

  return null;
}

