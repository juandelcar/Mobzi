/**
 * Componente para proteger rutas que requieren autenticación
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, usuario, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Esperar a que termine la verificación de autenticación
    if (loading) return;

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Si requiere admin y no es admin, redirigir al home
    if (requireAdmin && usuario?.tipoUsuario !== 'admin') {
      router.push('/home');
      return;
    }
  }, [isAuthenticated, usuario, loading, requireAdmin, router, pathname]);

  // Mostrar loading mientras verifica
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #0062ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Cargando...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (ya se redirigió)
  if (!isAuthenticated) {
    return null;
  }

  // Si requiere admin y no es admin, no mostrar nada (ya se redirigió)
  if (requireAdmin && usuario?.tipoUsuario !== 'admin') {
    return null;
  }

  return <>{children}</>;
}

