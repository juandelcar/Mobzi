/**
 * Configuración de la API
 */

// Función para obtener la URL base del backend (se ejecuta dinámicamente)
export const getBaseURL = (): string => {
  // PRIORIDAD 1: URL configurada manualmente en localStorage (más flexible)
  // Esto permite cambiar la URL sin recompilar la APK
  const storedUrl = getBackendUrlFromStorage();
  if (storedUrl) {
    console.log('🔗 Using baseURL (from localStorage):', storedUrl);
    return storedUrl;
  }

  // PRIORIDAD 2: Variable de entorno (útil para producción con ngrok o URLs personalizadas)
  if (process.env.NEXT_PUBLIC_API_URL) {
    // Limpiar la URL: quitar barras al final y asegurar que tenga /api/v1
    let envUrl = process.env.NEXT_PUBLIC_API_URL.trim();
    
    // Si termina con /, quitarlo
    if (envUrl.endsWith('/')) {
      envUrl = envUrl.slice(0, -1);
    }
    
    // Si no termina con /api/v1, agregarlo
    if (!envUrl.endsWith('/api/v1')) {
      envUrl = `${envUrl}/api/v1`;
    }
    
    return envUrl;
  }

  // PRIORIDAD 3: Variable de entorno alternativa
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;
  }

  // SIEMPRE intentar detectar el host del navegador
  // Esto es crítico para funcionar desde IPs de red
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Detected hostname:', hostname);
      console.log('🔍 Full location:', window.location.href);
    }
    
    // Detectar si es ngrok
    const isNgrok = hostname.includes('.ngrok.io') || 
                    hostname.includes('.ngrok-free.dev') || 
                    hostname.includes('.ngrok.app') ||
                    hostname.includes('ngrok');
    
    // Detectar si es localhost o IP local
    const isLocal = hostname === 'localhost' || 
                    hostname === '127.0.0.1' || 
                    /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname);
    
    if (isLocal) {
      // Para IPs locales o localhost, usar la misma IP con puerto 3001
      const url = hostname === 'localhost' || hostname === '127.0.0.1' 
        ? `http://localhost:3001/api/v1`
        : `http://${hostname}:3001/api/v1`;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔗 Using baseURL (local):', url);
      }
      return url;
    } else if (isNgrok) {
      // Para ngrok con Caddy: usar la misma URL base
      // Caddy redirige /api/* al backend (puerto 3001) y el resto al frontend (puerto 3000)
      if (process.env.NEXT_PUBLIC_API_URL) {
        const url = process.env.NEXT_PUBLIC_API_URL;
        if (process.env.NODE_ENV === 'development') {
          console.log('🔗 Using baseURL (from env):', url);
        }
        return url;
      } else {
        // Usar la misma URL de ngrok pero apuntar a /api/v1
        // Caddy se encargará de redirigir al backend
        const url = `${protocol}//${hostname}/api/v1`;
        if (process.env.NODE_ENV === 'development') {
          console.log('🔗 Using baseURL (ngrok with Caddy):', url);
        }
        return url;
      }
    } else {
      // Para otros dominios (Netlify, Vercel, etc.)
      // Si no hay configuración, mostrar advertencia y usar fallback
      // El usuario debe configurar la URL del backend manualmente
      console.warn('⚠️ Dominio desconocido detectado:', hostname);
      console.warn('⚠️ Por favor configura la URL del backend desde Perfil → Configuración del Backend');
      console.warn('⚠️ O configura NEXT_PUBLIC_API_URL en las variables de entorno');
      
      // Fallback: intentar sin puerto (no funcionará, pero es mejor que nada)
      const url = `${protocol}//${hostname}/api/v1`;
      console.warn('⚠️ Usando fallback (probablemente no funcionará):', url);
      return url;
    }
  }

  // Fallback: si estamos en SSR o window no está disponible, 
  // intentar usar localhost (pero esto no debería pasar en el cliente)
  console.warn('⚠️ getBaseURL: window no disponible, usando localhost como fallback');
  return 'http://localhost:3001/api/v1';
};

export const API_CONFIG = {
  get baseURL() {
    return getBaseURL();
  },
  timeout: 60000, // 60 segundos (aumentado para ngrok que puede ser más lento)
};

// Claves para localStorage
export const STORAGE_KEYS = {
  TOKEN: 'mobzi_token',
  REFRESH_TOKEN: 'mobzi_refresh_token',
  USER: 'mobzi_user',
  REMEMBER_USER: 'mobzi_remember_user',
  BACKEND_URL: 'mobzi_backend_url', // URL del backend configurada manualmente
};

/**
 * Obtiene la URL del backend desde localStorage (si está configurada)
 */
const getBackendUrlFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const url = localStorage.getItem(STORAGE_KEYS.BACKEND_URL);
    if (url && url.trim() !== '') {
      // Asegurar que termine en /api/v1
      let cleanUrl = url.trim();
      if (!cleanUrl.endsWith('/api/v1')) {
        // Si termina con /, quitar el /
        if (cleanUrl.endsWith('/')) {
          cleanUrl = cleanUrl.slice(0, -1);
        }
        // Agregar /api/v1 si no está
        if (!cleanUrl.endsWith('/api/v1')) {
          cleanUrl = `${cleanUrl}/api/v1`;
        }
      }
      return cleanUrl;
    }
  } catch (error) {
    console.warn('⚠️ Error al leer BACKEND_URL de localStorage:', error);
  }
  return null;
};

/**
 * Guarda la URL del backend en localStorage
 */
export const setBackendUrl = (url: string): void => {
  if (typeof window === 'undefined') return;
  try {
    // Limpiar la URL
    let cleanUrl = url.trim();
    // Si termina con /api/v1, mantenerlo
    if (cleanUrl.endsWith('/api/v1')) {
      // Quitar /api/v1 para guardar solo la base
      cleanUrl = cleanUrl.replace(/\/api\/v1\/?$/, '');
    }
    // Si termina con /, quitar el /
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    localStorage.setItem(STORAGE_KEYS.BACKEND_URL, cleanUrl);
    console.log('✅ Backend URL guardada:', cleanUrl);
  } catch (error) {
    console.error('❌ Error al guardar BACKEND_URL:', error);
  }
};

/**
 * Obtiene la URL del backend configurada (sin /api/v1)
 */
export const getBackendUrlBase = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.BACKEND_URL);
  } catch {
    return null;
  }
};

