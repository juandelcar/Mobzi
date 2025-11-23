/**
 * Cliente API para comunicarse con el backend
 */

import { API_CONFIG, STORAGE_KEYS, getBaseURL, getBackendUrlBase } from './api.config';

// Función helper para obtener URL del backend desde localStorage
const getBackendUrlFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const url = getBackendUrlBase();
    if (url && url.trim() !== '') {
      // Asegurar que termine en /api/v1
      let cleanUrl = url.trim();
      if (!cleanUrl.endsWith('/api/v1')) {
        if (cleanUrl.endsWith('/')) {
          cleanUrl = cleanUrl.slice(0, -1);
        }
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

// ============================================
// Tipos
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
  error?: string;
}

export interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

// ============================================
// Función para obtener el token
// ============================================
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

// ============================================
// Función para hacer requests
// ============================================
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> => {
  const { requireAuth = false, ...fetchOptions } = options;

  // Construir URL dinámicamente en cada petición para asegurar el hostname correcto
  // Forzar detección en el cliente
  let baseURL: string;
  
  // Prioridad 1: URL configurada manualmente en localStorage (más flexible para ngrok)
  const storedUrl = getBackendUrlFromStorage();
  if (storedUrl) {
    baseURL = storedUrl;
    console.log('🔗 [apiRequest] Using BACKEND_URL from localStorage:', baseURL);
  } else if (process.env.NEXT_PUBLIC_API_URL) {
    // Prioridad 2: Variable de entorno (más confiable)
    baseURL = process.env.NEXT_PUBLIC_API_URL;
    console.log('🔗 [apiRequest] Using NEXT_PUBLIC_API_URL:', baseURL);
  } else if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const fullUrl = window.location.href;
    const origin = window.location.origin;
    
    console.log('🔍 [apiRequest] Detected hostname:', hostname);
    console.log('🔍 [apiRequest] Full location:', fullUrl);
    console.log('🔍 [apiRequest] Origin:', origin);
    
    // Detectar si es ngrok (VERIFICACIÓN MÁS AGRESIVA)
    // Verificar en hostname, URL completa y origin
    const isNgrok = 
      hostname.includes('.ngrok.io') || 
      hostname.includes('.ngrok-free.dev') || 
      hostname.includes('.ngrok.app') ||
      hostname.includes('ngrok') ||
      fullUrl.includes('.ngrok.io') ||
      fullUrl.includes('.ngrok-free.dev') ||
      fullUrl.includes('.ngrok.app') ||
      origin.includes('.ngrok.io') ||
      origin.includes('.ngrok-free.dev') ||
      origin.includes('.ngrok.app');
    
    console.log('🔍 [apiRequest] Is ngrok?', isNgrok);
    
    // Detectar si es localhost o IP local
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isLocalIP = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname);
    const isLocal = isLocalhost || isLocalIP;
    
    if (isLocal) {
      // Para IPs locales, usar la misma IP con puerto 3001
      // Para localhost, usar localhost
      if (isLocalhost) {
        baseURL = `http://localhost:3001/api/v1`;
      } else {
        // Es una IP de red local, usar esa IP
        baseURL = `http://${hostname}:3001/api/v1`;
      }
      console.log('🔗 [apiRequest] Using local network:', baseURL);
      console.log('🔗 [apiRequest] Hostname detectado:', hostname, 'isLocalhost:', isLocalhost, 'isLocalIP:', isLocalIP);
    } else if (isNgrok) {
      // Para ngrok: Si el frontend está en ngrok, necesitamos la URL del backend de ngrok
      // IMPORTANTE: Si frontend y backend están en ngroks diferentes, 
      // debes configurar la URL del backend manualmente desde Perfil → Configuración del Backend
      // O usar NEXT_PUBLIC_API_URL con la URL del backend de ngrok
      
      // Si hay URL en localStorage, ya la usamos arriba (prioridad 1)
      // Si no, intentar usar la misma URL de ngrok (asumiendo que Caddy redirige /api/*)
      // PERO esto solo funciona si frontend y backend están en el mismo ngrok
      baseURL = `${protocol}//${hostname}/api/v1`;
      console.warn('⚠️ [apiRequest] NGROK DETECTED pero no hay BACKEND_URL configurada');
      console.warn('⚠️ [apiRequest] Usando URL del frontend (solo funciona si Caddy redirige /api/*):', baseURL);
      console.warn('⚠️ [apiRequest] Si frontend y backend están en ngroks diferentes, configura la URL del backend desde Perfil');
    } else {
      // Para otros dominios (Vercel, Netlify, etc.), intentar sin puerto primero
      baseURL = `${protocol}//${hostname}/api/v1`;
      console.warn('⚠️ [apiRequest] Unknown domain, using without port. Configure NEXT_PUBLIC_API_URL if needed:', baseURL);
    }
  } else {
    // Fallback: intentar usar getBaseURL, pero verificar si window está disponible después
    // A veces window puede no estar disponible inmediatamente
    if (typeof window !== 'undefined' && window.location) {
      // Reintentar con window.location
      const hostname = window.location.hostname;
      const isLocalIP = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname);
      
      if (isLocalIP) {
        baseURL = `http://${hostname}:3001/api/v1`;
        console.log('🔗 [apiRequest] Fallback: Usando IP local detectada:', baseURL);
      } else {
        baseURL = getBaseURL();
        console.warn('⚠️ [apiRequest] Fallback: usando getBaseURL():', baseURL);
      }
    } else {
      baseURL = getBaseURL();
      console.warn('⚠️ [apiRequest] window no disponible, usando getBaseURL():', baseURL);
    }
  }
  
  // CORRECCIÓN OBLIGATORIA ANTES de construir la URL final
  // 1. Eliminar :3001 de cualquier URL que contenga ngrok
  if (baseURL.includes('ngrok') || baseURL.includes('.ngrok')) {
    if (baseURL.includes(':3001')) {
      console.warn('🔧 [apiRequest] CORRIGIENDO baseURL: Eliminando :3001 de URL de ngrok');
      console.warn('🔧 [apiRequest] baseURL antes:', baseURL);
      baseURL = baseURL.replace(':3001', '');
      console.log('✅ [apiRequest] baseURL corregida:', baseURL);
    }
  }
  
  // 2. Si baseURL contiene localhost pero window.location tiene una IP de red, corregir
  if (baseURL.includes('localhost') && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const isLocalIP = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname);
    if (isLocalIP && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      console.warn('🔧 [apiRequest] CORRIGIENDO: Reemplazando localhost con IP de red');
      console.warn('🔧 [apiRequest] baseURL antes:', baseURL);
      baseURL = baseURL.replace('localhost', hostname);
      console.log('✅ [apiRequest] baseURL corregida con IP:', baseURL);
    }
  }
  
  let url = `${baseURL}${endpoint}`;
  
  // CORRECCIÓN FINAL OBLIGATORIA: Si la URL contiene :3001 y es ngrok, ELIMINAR el puerto
  // Esta es una verificación de seguridad adicional que SIEMPRE se ejecuta
  if (url.includes(':3001')) {
    // Verificar si es ngrok de cualquier forma (más robusto)
    const isNgrokUrl = url.includes('ngrok') || 
                       url.includes('.ngrok.io') || 
                       url.includes('.ngrok-free.dev') || 
                       url.includes('.ngrok.app') ||
                       url.toLowerCase().includes('ngrok');
    
    if (isNgrokUrl) {
      console.error('🔧 [apiRequest] CORRECCIÓN FINAL: Eliminando :3001 de URL de ngrok');
      console.error('🔧 [apiRequest] URL antes de corrección:', url);
      url = url.replace(':3001', '');
      console.log('✅ [apiRequest] URL final corregida:', url);
    }
  }
  
  // CORRECCIÓN ABSOLUTA FINAL: Si contiene ngrok y :3001, ELIMINARLO sin excepciones
  // Esta es la última línea de defensa
  if (url.includes('ngrok') && url.includes(':3001')) {
    console.error('🚨 [apiRequest] CORRECCIÓN ABSOLUTA: URL contiene ngrok y :3001');
    console.error('🚨 [apiRequest] URL antes:', url);
    url = url.replace(':3001', '');
    console.error('✅ [apiRequest] URL después de corrección absoluta:', url);
  }
  
  // CORRECCIÓN ULTRA FINAL: Justo antes de usar la URL, eliminar :3001 si contiene ngrok
  // Esta es la corrección más agresiva y se ejecuta SIEMPRE
  if (url.includes('ngrok') && url.includes(':3001')) {
    const urlAntes = url;
    url = url.replace(':3001', '');
    console.error('🚨🚨🚨 CORRECCIÓN ULTRA FINAL APLICADA 🚨🚨🚨');
    console.error('URL ANTES:', urlAntes);
    console.error('URL DESPUÉS:', url);
  }
  
  // Log final para debugging
  console.log('🌐 [apiRequest] URL final que se usará:', url);

  // Headers por defecto
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Agregar token si es requerido
  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    // CORRECCIÓN DE ÚLTIMO MOMENTO: Justo antes de hacer el fetch
    // Si la URL contiene ngrok y :3001, eliminarlo INMEDIATAMENTE
    if (url.includes('ngrok') && url.includes(':3001')) {
      console.error('🚨🚨🚨 CORRECCIÓN DE ÚLTIMO MOMENTO 🚨🚨🚨');
      console.error('URL ANTES DEL FETCH:', url);
      url = url.replace(':3001', '');
      console.error('URL DESPUÉS DE CORRECCIÓN:', url);
    }
    
    // Log de la URL para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 API Request URL:', url);
    }
    
    // Log SIEMPRE para debugging en producción también
    console.log('🌐 [FINAL] URL que se enviará al servidor:', url);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: AbortSignal.timeout(API_CONFIG.timeout),
    });

    // Verificar el Content-Type antes de parsear
    const contentType = response.headers.get('content-type');
    let data: ApiResponse<T>;

    // Intentar parsear como JSON solo si el content-type es JSON
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        // Si falla el parseo JSON, leer como texto
        const text = await response.text();
        data = { success: false, message: text || 'Error en la respuesta del servidor' };
      }
    } else {
      // Si no es JSON, leer como texto
      const text = await response.text();
      data = { success: false, message: text || 'Error en la respuesta del servidor' };
    }

    // Si la respuesta no es exitosa
    if (!response.ok) {
      // Si es 401, limpiar tokens
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      }

      // Si es 429 (Too Many Requests), manejar especialmente
      if (response.status === 429) {
        // Intentar obtener información del tiempo de espera desde los headers
        const retryAfter = response.headers.get('Retry-After') || response.headers.get('X-RateLimit-Reset');
        let message = data.message || 'Demasiadas solicitudes. Por favor, espera un momento.';
        
        if (retryAfter) {
          const seconds = parseInt(retryAfter);
          const minutes = Math.ceil(seconds / 60);
          message += ` Intenta de nuevo en aproximadamente ${minutes} minuto${minutes > 1 ? 's' : ''}.`;
        }
        
        return {
          success: false,
          message,
          error: data.error || 'RATE_LIMIT_ERROR',
        };
      }

      return {
        success: false,
        message: data.message || 'Error en la solicitud',
        errors: data.errors,
        error: data.error,
      };
    }

    // Extraer success de data si existe, y sobrescribirlo con true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { success: _success, ...restData } = data;
    return {
      success: true,
      ...restData,
    };
  } catch (error: unknown) {
    console.error('❌ Error en API request:', error);
    console.error('📍 URL intentada:', url);

    // Si es un error de timeout o abort
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      return {
        success: false,
        message: 'La solicitud tardó demasiado. Por favor, intenta de nuevo.',
        error: 'TIMEOUT_ERROR',
      };
    }

    // Mensaje más descriptivo para errores de red
    let errorMessage = 'Error de conexión con el servidor';
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      errorMessage = `No se pudo conectar al servidor en ${url}. Verifica que el backend esté corriendo y accesible desde esta red.`;
    } else if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
    }

    return {
      success: false,
      message: errorMessage,
      error: 'NETWORK_ERROR',
    };
  }
};

// ============================================
// Métodos HTTP helpers
// ============================================
export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;

