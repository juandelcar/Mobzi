'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/login.module.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // TODO: Implementar endpoint de recuperación de contraseña
      // Por ahora, solo mostramos un mensaje
      setMessage('Funcionalidad en desarrollo. Por favor, contacta al administrador.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la solicitud.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Recuperar Contraseña</h1>
          <p className={styles.loginSubtitle}>
            Ingresa tu correo electrónico y te enviaremos instrucciones para recuperar tu contraseña.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              padding: '12px',
              backgroundColor: '#064e3b',
              color: '#86efac',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={loading || !email}
          >
            {loading ? 'Enviando...' : 'Enviar Instrucciones'}
          </button>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              ¿Recordaste tu contraseña?{' '}
              <Link 
                href="/auth/login" 
                className={styles.registerLink}
              >
                Volver al inicio de sesión
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

