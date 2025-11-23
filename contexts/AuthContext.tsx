/**
 * Contexto de Autenticación
 * Proporciona estado y funciones de autenticación a toda la aplicación
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import * as authService from '../services/auth.service';
import { Usuario } from '../services/auth.service';

// ============================================
// Tipos
// ============================================
interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberUser?: boolean) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ============================================
// Crear contexto
// ============================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ============================================
  // Verificar autenticación al cargar
  // ============================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar si hay token
        if (!authService.hasToken()) {
          setLoading(false);
          return;
        }

        // Obtener usuario del localStorage
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          setUsuario(storedUser);
        }

        // Verificar token con el backend
        const response = await authService.verifyToken();
        if (response.success && response.data) {
          setUsuario(response.data.usuario);
        } else {
          // Token inválido, limpiar
          setUsuario(null);
          await authService.logout();
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ============================================
  // Función de login
  // ============================================
  const handleLogin = async (
    email: string,
    password: string,
    rememberUser: boolean = false
  ): Promise<void> => {
    const response = await authService.login({ email, password, rememberUser });

    if (response.success && response.data) {
      setUsuario(response.data.usuario);
      // No redirigir aquí, dejar que el componente lo maneje
    } else {
      const err = new Error(response.message || 'Error al iniciar sesión') as Error & { errors?: Array<{ field: string; message: string }> };
      if (response.errors) {
        err.errors = response.errors;
      }
      throw err;
    }
  };

  // ============================================
  // Función de registro
  // ============================================
  const handleRegister = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }): Promise<void> => {
    const response = await authService.register(data);

    if (response.success && response.data) {
      setUsuario(response.data.usuario);
      router.push('/home');
    } else {
      const err = new Error(response.message || 'Error al registrar usuario') as Error & { errors?: Array<{ field: string; message: string }> };
      if (response.errors) {
        err.errors = response.errors;
      }
      throw err;
    }
  };

  // ============================================
  // Función de logout
  // ============================================
  const handleLogout = async (): Promise<void> => {
    await authService.logout();
    setUsuario(null);
    router.push('/auth/login');
  };

  // ============================================
  // Refrescar información del usuario
  // ============================================
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authService.verifyToken();
      if (response.success && response.data) {
        setUsuario(response.data.usuario);
      }
    } catch (error) {
      console.error('Error al refrescar usuario:', error);
    }
  };

  const value: AuthContextType = {
    usuario,
    loading,
    isAuthenticated: !!usuario,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// Hook para usar el contexto
// ============================================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;

