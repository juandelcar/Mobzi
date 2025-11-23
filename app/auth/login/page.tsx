'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberUser: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/home';
      router.push(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpiar error al escribir
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(formData.email, formData.password, formData.rememberUser);
      // Redirigir a la página solicitada o a /home
      const redirect = searchParams.get('redirect') || '/home';
      router.push(redirect);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    router.push('/home');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.loginContainer}>
      
      <div className="relative w-full max-w-md">
        <div className={styles.loginCard}>
          <div className="text-center mb-8">
            {/* <div className={styles.logoContainer}>
            <img src="/icon_1.2.png" alt="MOBZI Logo" className={styles.logo} />
            </div> */}
            <h1 className={styles.title}>Inicia sesión</h1>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={styles.formField}>
              <label htmlFor="email" className={styles.fieldLabel}>
                Correo electrónico
              </label>
              <div className={styles.inputContainer}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={styles.inputField}
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <div className={styles.inputIcon}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="password" className={styles.fieldLabel}>
                Contraseña
              </label>
              <div className={styles.inputContainer}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className={styles.inputField}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className={styles.passwordToggle}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className={styles.checkboxContainer}>
              <label className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  name="rememberUser"
                  checked={formData.rememberUser}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>Recordar usuario</span>
              </label>
              <Link 
                href="/forgot-password" 
                className={styles.forgotLink}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Continuar'}
            </button>

            <div className={styles.divider}>
              <div className={styles.dividerLine}></div>
              <div className={styles.dividerText}>-</div>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              className={styles.secondaryButton}
            >
              Continuar como invitado
            </button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              ¿No tienes una cuenta?{' '}
              <Link 
                href="/auth/register" 
                className={styles.registerLink}
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.loginContainer}>
        <div className="relative w-full max-w-md">
          <div className={styles.loginCard}>
            <div className="text-center mb-8">
              <h1 className={styles.title}>Inicia sesión</h1>
            </div>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              Cargando...
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
