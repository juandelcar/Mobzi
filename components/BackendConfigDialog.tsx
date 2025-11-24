'use client';

import { useState, useEffect } from 'react';
import { getBackendUrlBase, setBackendUrl } from '@/lib/api.config';

interface BackendConfigDialogProps {
  onClose?: () => void;
  showOnlyIfNotConfigured?: boolean;
}

export default function BackendConfigDialog({ 
  onClose, 
  showOnlyIfNotConfigured = false 
}: BackendConfigDialogProps) {
  const [backendUrl, setBackendUrlInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Cargar URL actual si existe
    const currentUrl = getBackendUrlBase();
    if (currentUrl) {
      setBackendUrlInput(currentUrl);
    }

    // Si showOnlyIfNotConfigured es true, solo mostrar si no hay URL configurada
    if (showOnlyIfNotConfigured) {
      if (!currentUrl) {
        setIsOpen(true);
      }
    } else {
      setIsOpen(true);
    }
  }, [showOnlyIfNotConfigured]);

  const handleTest = async () => {
    if (!backendUrl.trim()) {
      setTestResult({ success: false, message: 'Por favor ingresa una URL' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Limpiar la URL de entrada
      let testUrl = backendUrl.trim();
      
      // Si la URL termina con /api/v1, quitarlo para obtener la base
      if (testUrl.endsWith('/api/v1')) {
        testUrl = testUrl.replace(/\/api\/v1\/?$/, '');
      }
      // Si termina con /, quitarlo
      if (testUrl.endsWith('/')) {
        testUrl = testUrl.slice(0, -1);
      }

      // Probar el endpoint /health directamente (está en la raíz del backend, no en /api/v1)
      const healthUrl = `${testUrl}/health`;
      
      // Headers para evitar la página de advertencia de ngrok
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      };
      
      const healthResponse = await fetch(healthUrl, {
        method: 'GET',
        headers,
      });

      if (!healthResponse.ok) {
        throw new Error(`HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
      }

      // Verificar que la respuesta sea JSON, no HTML (página de advertencia de ngrok)
      const contentType = healthResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Intentar leer como texto para ver qué devolvió
        const text = await healthResponse.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error('Ngrok está mostrando su página de advertencia. Por favor, visita la URL en el navegador primero para aceptar la advertencia, luego intenta de nuevo.');
        }
        throw new Error(`El servidor devolvió ${contentType} en lugar de JSON. Verifica que la URL sea correcta.`);
      }

      const healthData = await healthResponse.json();
      
      // Si llegamos aquí, la conexión fue exitosa
      setTestResult({ 
        success: true, 
        message: `✅ Conexión exitosa con el backend. Base de datos: ${healthData.database || 'desconocido'}` 
      });
      
      // Guardar la URL base (sin /api/v1) para uso futuro
      setBackendUrl(testUrl);
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}. Verifica que la URL sea correcta y que ngrok esté corriendo.` 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!backendUrl.trim()) {
      setTestResult({ success: false, message: 'Por favor ingresa una URL' });
      return;
    }

    // Limpiar la URL antes de guardar
    let cleanUrl = backendUrl.trim();
    if (cleanUrl.endsWith('/api/v1')) {
      cleanUrl = cleanUrl.replace(/\/api\/v1\/?$/, '');
    }
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    setBackendUrl(cleanUrl);
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
    // Recargar la página para aplicar los cambios
    window.location.reload();
  };

  const handleClose = () => {
    if (showOnlyIfNotConfigured && !getBackendUrlBase()) {
      // Si es obligatorio y no hay URL, no permitir cerrar
      return;
    }
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !showOnlyIfNotConfigured) {
          handleClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: '#1f2937',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ 
          color: '#f9fafb', 
          fontSize: '20px', 
          fontWeight: 'bold', 
          marginBottom: '16px' 
        }}>
          Configurar Backend
        </h2>
        
        <p style={{ 
          color: '#9ca3af', 
          fontSize: '14px', 
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          {showOnlyIfNotConfigured 
            ? 'Para usar la aplicación, necesitas configurar la URL del backend. Ingresa la URL de tu servidor ngrok o backend.'
            : 'Configura la URL del backend. Esta URL se usará para todas las peticiones de la aplicación.'}
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'block', 
            color: '#d1d5db', 
            fontSize: '14px', 
            fontWeight: '500',
            marginBottom: '8px' 
          }}>
            URL del Backend
          </label>
          <input
            type="text"
            value={backendUrl}
            onChange={(e) => {
              setBackendUrlInput(e.target.value);
              setTestResult(null);
            }}
            placeholder="https://tu-url-ngrok.ngrok-free.dev"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f9fafb',
              fontSize: '14px',
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleTest();
              }
            }}
          />
          <p style={{ 
            color: '#6b7280', 
            fontSize: '12px', 
            marginTop: '6px' 
          }}>
            Ejemplo: https://abc123.ngrok-free.dev
          </p>
        </div>

        {testResult && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor: testResult.success ? '#064e3b' : '#7f1d1d',
            color: testResult.success ? '#86efac' : '#fca5a5',
            fontSize: '14px',
          }}>
            {testResult.message}
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end' 
        }}>
          {!showOnlyIfNotConfigured && (
            <button
              onClick={handleClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#374151',
                color: '#f9fafb',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleTest}
            disabled={testing || !backendUrl.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: '#f9fafb',
              border: 'none',
              borderRadius: '8px',
              cursor: testing || !backendUrl.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: testing || !backendUrl.trim() ? 0.5 : 1,
            }}
          >
            {testing ? 'Probando...' : 'Probar Conexión'}
          </button>
          <button
            onClick={handleSave}
            disabled={!backendUrl.trim() || (testResult ? !testResult.success : true)}
            style={{
              padding: '10px 20px',
              backgroundColor: (testResult?.success === true) ? '#10b981' : '#6b7280',
              color: '#f9fafb',
              border: 'none',
              borderRadius: '8px',
              cursor: (!backendUrl.trim() || (testResult ? !testResult.success : true)) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: (!backendUrl.trim() || (testResult ? !testResult.success : true)) ? 0.5 : 1,
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

