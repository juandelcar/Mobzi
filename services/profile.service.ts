/**
 * Servicio de Perfil
 * Funciones para interactuar con el backend de perfil
 */

import api, { ApiResponse } from '../lib/api.client';

// ============================================
// Tipos
// ============================================
export interface UsuarioProfile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
  municipioPreferido: string;
}

export interface Estadisticas {
  rutasGuardadas: number;
  rutasFavoritas: number;
  busquedasRealizadas: number;
  tiempoAhorrado: number;
}

export interface Preferencias {
  notificaciones: boolean;
  tema: string;
  idioma: string;
  mostrarFavoritas: boolean;
}

export interface RutaGuardada {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  municipio: string;
  empresa: string;
  ruta: string;
  fechaCreacion: string;
  favorita: boolean;
}

export interface ProfileData {
  usuario: UsuarioProfile;
  estadisticas: Estadisticas;
  preferencias: Preferencias;
}

// ============================================
// Obtener perfil completo
// ============================================
export const getProfile = async (): Promise<ApiResponse<ProfileData>> => {
  return await api.get<ProfileData>('/profile', {
    requireAuth: true,
  });
};

// ============================================
// Actualizar perfil
// ============================================
export const updateProfile = async (data: {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  municipioPreferido?: string;
}): Promise<ApiResponse<{ usuario: UsuarioProfile }>> => {
  return await api.put<{ usuario: UsuarioProfile }>('/profile', data, {
    requireAuth: true,
  });
};

// ============================================
// Actualizar preferencias
// ============================================
export const updatePreferences = async (data: {
  notificaciones?: boolean;
  tema?: string;
  idioma?: string;
  mostrarFavoritas?: boolean;
}): Promise<ApiResponse<{ preferencias: Preferencias }>> => {
  return await api.put<{ preferencias: Preferencias }>('/profile/preferencias', data, {
    requireAuth: true,
  });
};

// ============================================
// Obtener rutas guardadas
// ============================================
export const getRutasGuardadas = async (): Promise<ApiResponse<RutaGuardada[]>> => {
  return await api.get<RutaGuardada[]>('/profile/rutas-guardadas', {
    requireAuth: true,
  });
};

// ============================================
// Guardar ruta (favorita o normal)
// ============================================
export const saveRuta = async (data: {
  rutaId: string;
  favorita?: boolean;
  action?: 'toggle';
}): Promise<ApiResponse<{ rutaGuardada?: RutaGuardada; deleted?: boolean }>> => {
  return await api.post<{ rutaGuardada?: RutaGuardada; deleted?: boolean }>('/profile/rutas-guardadas', data, {
    requireAuth: true,
  });
};

// ============================================
// Obtener estado de una ruta guardada
// ============================================
export const getRutaGuardadaStatus = async (
  rutaId: string
): Promise<ApiResponse<{ guardada: boolean; favorita: boolean; rutaGuardada: RutaGuardada | null }>> => {
  return await api.get<{ guardada: boolean; favorita: boolean; rutaGuardada: RutaGuardada | null }>(
    `/profile/rutas-guardadas/${rutaId}/status`,
    {
      requireAuth: true,
    }
  );
};

// ============================================
// Eliminar ruta guardada por ID
// ============================================
export const deleteRutaGuardada = async (
  rutaGuardadaId: string
): Promise<ApiResponse<void>> => {
  return await api.delete<void>(`/profile/rutas-guardadas/${rutaGuardadaId}`, {
    requireAuth: true,
  });
};

// ============================================
// Eliminar cuenta de usuario
// ============================================
export const deleteAccount = async (): Promise<ApiResponse<void>> => {
  return await api.delete<void>('/profile', {
    requireAuth: true,
  });
};

// ============================================
// Registrar búsqueda
// ============================================
export const registerSearch = async (data: {
  query: string;
  municipioId?: string;
  resultadosEncontrados?: number;
}): Promise<ApiResponse<void>> => {
  return await api.post<void>('/profile/busquedas', data, {
    requireAuth: true,
  });
};

const ProfileService = {
  getProfile,
  updateProfile,
  updatePreferences,
  getRutasGuardadas,
  saveRuta,
  getRutaGuardadaStatus,
  deleteRutaGuardada,
  deleteAccount,
  registerSearch,
};

export default ProfileService;

