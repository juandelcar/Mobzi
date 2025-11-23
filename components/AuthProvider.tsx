/**
 * AuthProvider Component
 * Wrapper cliente para el AuthProvider
 */

'use client';

import { useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';

export default function AuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const register = async () => {
        try {
          const existing = await navigator.serviceWorker.getRegistration('/');
          if (!existing) {
            await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
          }
        } catch {
          // silencioso
        }
      };
      register();
    }
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}

