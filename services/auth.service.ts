/**
 * Servicio de Autenticación
 * Funciones para interactuar con el backend de autenticación
 */

import api, { ApiResponse } from '../lib/api.client';
import { STORAGE_KEYS } from '../lib/api.config';

// ============================================
// Tipos
// ============================================
export interface Usuario {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  tipoUsuario: 'regular' | 'admin';
  municipioPreferido?: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberUser?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  usuario: Usuario;
  token: string;
  refreshToken: string;
  expiresIn: string;
}

// ============================================
// Guardar datos de autenticación
// ============================================
const saveAuthData = (data: AuthResponse, remember: boolean = false): void => {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.usuario));
  localStorage.setItem(STORAGE_KEYS.REMEMBER_USER, remember.toString());
};

// ============================================
// Limpiar datos de autenticación
// ============================================
const clearAuthData = (): void => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.REMEMBER_USER);
};

// ============================================
// Obtener usuario actual
// ============================================
export const getCurrentUser = (): Usuario | null => {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// ============================================
// Verificar si hay token
// ============================================
export const hasToken = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
};

// ============================================
// Registrar usuario
// ============================================
export const register = async (
  data: RegisterData
): Promise<ApiResponse<AuthResponse>> => {
  const response = await api.post<AuthResponse>('/auth/register', data);

  if (response.success && response.data) {
    saveAuthData(response.data, data.acceptTerms);
  }

  return response;
};

// ============================================
// Iniciar sesión
// ============================================
export const login = async (
  data: LoginData
): Promise<ApiResponse<AuthResponse>> => {
  const response = await api.post<AuthResponse>('/auth/login', data);

  if (response.success && response.data) {
    saveAuthData(response.data, data.rememberUser || false);
  }

  return response;
};

// ============================================
// Cerrar sesión
// ============================================
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout', {}, { requireAuth: true });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  } finally {
    clearAuthData();
  }
};

// ============================================
// Verificar token
// ============================================
export const verifyToken = async (): Promise<ApiResponse<{ usuario: Usuario }>> => {
  return await api.get<{ usuario: Usuario }>('/auth/verify', {
    requireAuth: true,
  });
};

const AuthService = {
  register,
  login,
  logout,
  verifyToken,
  getCurrentUser,
  hasToken,
};

export default AuthService;

