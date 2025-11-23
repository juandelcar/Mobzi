"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation";
import styles from "./register.module.css";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  // const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Limpiar errores al escribir
    if (error) setError(null);
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    // Validación básica del frontend
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Las contraseñas no coinciden" });
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setFieldErrors({ password: "La contraseña debe tener al menos 8 caracteres" });
      setLoading(false);
      return;
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: formData.acceptTerms,
      });
      // El contexto redirige automáticamente a /home
    } catch (err: unknown) {
      const e = err as Error & { errors?: Array<{ field: string; message: string }> };
      if (Array.isArray(e.errors)) {
        const errors: Record<string, string> = {};
        e.errors.forEach((error) => {
          errors[error.field] = error.message;
        });
        setFieldErrors(errors);
      } else {
        setError(e instanceof Error ? e.message : "Error al registrar usuario. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    setShowConfirmPassword(!showConfirmPassword);
  };


  return (
    <div className={styles.registerContainer}>

      <div className="relative w-full max-w-md">
        <div className={styles.registerCard}>
          <div className="text-center mb-8">
            {/* <div className={styles.logoContainer}>
          <img 
            src="/logo_w_1.png" 
            alt="Mobzi Logo" 
            className={styles.logo}
          />
        </div> */}
            <h1 className={styles.title}>Crea una cuenta</h1>
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

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.nameRow}>
              <div className={styles.formField}>
                <label htmlFor="firstName" className={styles.fieldLabel}>
                  Nombre
                </label>
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={styles.inputField}
                    placeholder="Tu nombre"
                    required
                    disabled={loading}
                  />
                  {fieldErrors.firstName && (
                    <span style={{ color: '#c33', fontSize: '12px', marginTop: '4px' }}>
                      {fieldErrors.firstName}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.formField}>
                <label htmlFor="lastName" className={styles.fieldLabel}>
                  Apellido
                </label>
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={styles.inputField}
                    placeholder="Tu apellido"
                    required
                    disabled={loading}
                  />
                  {fieldErrors.lastName && (
                    <span style={{ color: '#c33', fontSize: '12px', marginTop: '4px' }}>
                      {fieldErrors.lastName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="email" className={styles.fieldLabel}>
                Correo electrónico
              </label>
              <div className={styles.inputContainer}>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={styles.inputField}
                    placeholder="tu@email.com"
                    required
                    disabled={loading}
                  />
                  {fieldErrors.email && (
                    <span style={{ color: '#c33', fontSize: '12px', marginTop: '4px' }}>
                      {fieldErrors.email}
                    </span>
                  )}
                <svg
                  className={styles.inputIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="password" className={styles.fieldLabel}>
                Contraseña
              </label>
              <div className={styles.inputContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={styles.inputField}
                    placeholder="Mínimo 8 caracteres"
                    required
                    disabled={loading}
                  />
                  {fieldErrors.password && (
                    <span style={{ color: '#c33', fontSize: '12px', marginTop: '4px' }}>
                      {fieldErrors.password}
                    </span>
                  )}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className={styles.passwordToggle}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                </button>
              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="confirmPassword" className={styles.fieldLabel}>
                Confirmar contraseña
              </label>
              <div className={styles.inputContainer}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={styles.inputField}
                    placeholder="Repite tu contraseña"
                    required
                    disabled={loading}
                  />
                  {fieldErrors.confirmPassword && (
                    <span style={{ color: '#c33', fontSize: '12px', marginTop: '4px' }}>
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className={styles.passwordToggle}
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? (
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
              <div className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                  required
                />
                <label htmlFor="acceptTerms" className={styles.checkboxLabel}>
                  Acepto los{" "}
                  <a href="#" className={styles.termsLink}>
                    términos y condiciones
                  </a>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.primaryButton}
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>

            <div className={styles.divider}>
              <div className={styles.dividerLine}></div>
              <div className={styles.dividerText}></div>
            </div>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              ¿Ya tienes una cuenta?{" "}
              <a href="/auth/login" className={styles.loginLink}>
                Inicia sesión
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
