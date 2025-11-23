'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isHTTP, setIsHTTP] = useState(false);

  useEffect(() => {
    // Detectar si estamos en HTTP (no localhost)
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
      const isHTTPS = window.location.protocol === 'https:';
      setIsHTTP(!isHTTPS && !isLocalhost);
    }

    // Detectar si la app ya está instalada
    if (typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as { standalone?: boolean }).standalone === true)) {
      setIsInstalled(true);
      return;
    }

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Si no hay prompt nativo, mostrar instrucciones manuales
      setShowManualInstructions(true);
      return;
    }

    // Mostrar el prompt de instalación
    deferredPrompt.prompt();

    // Esperar a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ Usuario aceptó instalar la PWA');
      setIsInstalled(true);
    } else {
      console.log('❌ Usuario rechazó instalar la PWA');
    }

    // Limpiar el prompt
    setDeferredPrompt(null);
  };

  // No mostrar si ya está instalada
  if (isInstalled) {
    return null;
  }

  // Si está en HTTP y no hay prompt, mostrar instrucciones
  if (isHTTP && !deferredPrompt) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '16px 20px',
        maxWidth: '90%',
        width: '400px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ color: '#f9fafb', fontSize: '16px', fontWeight: '600', margin: 0 }}>
            📱 Instalar App
          </h3>
          <button
            onClick={() => setShowManualInstructions(!showManualInstructions)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            {showManualInstructions ? '−' : '+'}
          </button>
        </div>
        
        {!showManualInstructions ? (
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            Para instalar la app desde HTTP, sigue las instrucciones manuales.
          </p>
        ) : (
          <div style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '12px', fontWeight: '500' }}>Instrucciones para instalar:</p>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ marginBottom: '8px', fontWeight: '600' }}>📱 Chrome/Edge (Desktop):</p>
              <ol style={{ margin: '0 0 12px 20px', padding: 0 }}>
                <li>Haz clic en el ícono de instalación (➕) en la barra de direcciones</li>
                <li>O ve al menú (⋮) → &quot;Instalar Mobzi&quot;</li>
                <li>O ve a Configuración → Aplicaciones → Instalar aplicación</li>
              </ol>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <p style={{ marginBottom: '8px', fontWeight: '600' }}>🤖 Android (Chrome):</p>
              <ol style={{ margin: '0 0 12px 20px', padding: 0 }}>
                <li>Abre el menú del navegador (⋮)</li>
                <li>Selecciona &quot;Agregar a pantalla de inicio&quot; o &quot;Instalar app&quot;</li>
                <li>Confirma la instalación</li>
              </ol>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <p style={{ marginBottom: '8px', fontWeight: '600' }}>🍎 iOS (Safari):</p>
              <ol style={{ margin: '0 0 12px 20px', padding: 0 }}>
                <li>Toca el botón de compartir (□↑)</li>
                <li>Selecciona &quot;Agregar a pantalla de inicio&quot;</li>
                <li>Personaliza el nombre si quieres y toca &quot;Agregar&quot;</li>
              </ol>
            </div>

            <div style={{ 
              padding: '10px', 
              backgroundColor: '#1e3a5f', 
              borderRadius: '6px',
              marginTop: '12px'
            }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#93c5fd' }}>
                💡 <strong>Nota:</strong> En HTTP, algunos navegadores pueden requerir instalación manual. 
                Para mejor experiencia, usa HTTPS o localhost.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Si hay prompt disponible, mostrar botón de instalación
  if (deferredPrompt) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <h3 style={{ color: '#f9fafb', fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
              📱 Instalar Mobzi
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
              Instala la app para acceso rápido
            </p>
          </div>
          <button
            onClick={handleInstallClick}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: '#f9fafb',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
            }}
          >
            Instalar
          </button>
        </div>
      </div>
    );
  }

  return null;
}

