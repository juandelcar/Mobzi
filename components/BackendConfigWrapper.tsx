'use client';

import { useEffect, useState } from 'react';
import BackendConfigDialog from './BackendConfigDialog';
import { getBackendUrlBase } from '@/lib/api.config';

/**
 * Wrapper que muestra automáticamente el diálogo de configuración
 * si no hay URL del backend configurada
 */
export default function BackendConfigWrapper() {
  const [showDialog, setShowDialog] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Verificar si hay URL configurada
    const backendUrl = getBackendUrlBase();
    
    // Si no hay URL configurada Y no hay variable de entorno, mostrar diálogo
    if (!backendUrl && !process.env.NEXT_PUBLIC_API_URL) {
      // Esperar un poco para que la app cargue
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 1000);
      
      setChecked(true);
      return () => clearTimeout(timer);
    }
    
    setChecked(true);
  }, []);

  if (!checked || !showDialog) {
    return null;
  }

  return (
    <BackendConfigDialog 
      showOnlyIfNotConfigured={true}
      onClose={() => setShowDialog(false)}
    />
  );
}

