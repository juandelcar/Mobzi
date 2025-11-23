"use client";

// Imports y dependencias
import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
import styles from "./profile.module.css";
import Menu from "@/app/menu/Menu";
import ProtectedRoute from "@/components/ProtectedRoute";
import * as profileService from "@/services/profile.service";
import * as publicService from "@/services/public.service";
import * as authService from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import BackendConfigDialog from "@/components/BackendConfigDialog";
import { getBackendUrlBase } from "@/lib/api.config";

// Tipos de datos
type Usuario = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
  municipioPreferido: string;
};

type Estadisticas = {
  rutasGuardadas: number;
  rutasFavoritas: number;
  busquedasRealizadas: number;
  tiempoAhorrado: number; // en minutos
};

function ProfilePage() {
  // Estados del componente
  // ============================================
  // DATOS DE EJEMPLO - COMENTADOS
  // Ahora los datos se obtienen desde el backend
  // ============================================
  // const [usuario, setUsuario] = useState<Usuario>({
  //   id: "1",
  //   nombre: "Usuario Ejemplo",
  //   email: "usuario@ejemplo.com",
  //   telefono: "+52 123 456 7890",
  //   fechaRegistro: "2024-01-01",
  //   municipioPreferido: "Huamantla",
  // });

  // const [estadisticas, setEstadisticas] = useState<Estadisticas>({
  //   rutasGuardadas: 12,
  //   rutasFavoritas: 5,
  //   busquedasRealizadas: 48,
  //   tiempoAhorrado: 240,
  // });

  // const [preferencias, setPreferencias] = useState<Preferencias>({
  //   notificaciones: true,
  //   tema: "oscuro",
  //   idioma: "es",
  //   mostrarFavoritas: true,
  // });

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    rutasGuardadas: 0,
    rutasFavoritas: 0,
    busquedasRealizadas: 0,
    tiempoAhorrado: 0,
  });
  const [municipios, setMunicipios] = useState<Array<{ id: string; nombre: string }>>([]);

  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showBackendConfig, setShowBackendConfig] = useState(false);

  // const router = useRouter();
  const { logout } = useAuth();

  // Cargar municipios desde el backend
  useEffect(() => {
    const loadMunicipios = async () => {
      try {
        const response = await publicService.getMunicipios();
        if (response.success && response.data) {
          setMunicipios(response.data.map(m => ({ id: m.id, nombre: m.nombre })));
        }
      } catch (error) {
        console.error('Error al cargar municipios:', error);
      }
    };
    loadMunicipios();
  }, []);

  // Cargar datos del usuario desde el backend
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await profileService.getProfile();
        
        if (response && response.success && response.data) {
          const usuarioData = {
            id: response.data.usuario?.id || '',
            nombre: `${response.data.usuario?.nombre || ''}${response.data.usuario?.apellido ? ` ${response.data.usuario.apellido}` : ''}`.trim() || 'Usuario',
            email: response.data.usuario?.email || '',
            telefono: response.data.usuario?.telefono || '',
            fechaRegistro: response.data.usuario?.fechaRegistro || new Date().toISOString(),
            municipioPreferido: response.data.usuario?.municipioPreferido || '',
          };
          
          setUsuario(usuarioData);
          setFormData(usuarioData);
          
          // Asegurar que las estadísticas tengan valores por defecto si vienen vacías
          if (response.data.estadisticas) {
            setEstadisticas({
              rutasGuardadas: response.data.estadisticas.rutasGuardadas ?? 0,
              rutasFavoritas: response.data.estadisticas.rutasFavoritas ?? 0,
              busquedasRealizadas: response.data.estadisticas.busquedasRealizadas ?? 0,
              tiempoAhorrado: response.data.estadisticas.tiempoAhorrado ?? 0,
            });
          }
          
        } else {
          console.error('Error en la respuesta del perfil:', response);
          // No mostrar alert, solo log en consola para no interrumpir la experiencia
        }
      } catch (error: unknown) {
        console.error('Error al cargar perfil:', error);
        // No mostrar alert, solo log en consola
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Funciones de manejo
  const handleEdit = () => {
    if (usuario) {
      setEditando(true);
      setFormData({ ...usuario });
    } else {
      console.error('No se puede editar: usuario no cargado');
      alert('Error: No se puede editar el perfil. Por favor, recarga la página.');
    }
  };

  const handleCancel = () => {
    setEditando(false);
    if (usuario) {
      setFormData({ ...usuario });
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    try {
      setLoading(true);
      // Separar nombre completo en nombre y apellido
      const nombreParts = formData.nombre.trim().split(' ');
      const nombre = nombreParts[0] || '';
      const apellido = nombreParts.slice(1).join(' ') || '';

      // Preparar datos para enviar (solo incluir campos que tienen valor)
      const updatePayload: {
        nombre?: string;
        apellido?: string;
        telefono?: string;
        municipioPreferido?: string;
      } = {};

      if (nombre && nombre.trim() !== '') {
        updatePayload.nombre = nombre.trim();
      }
      if (apellido && apellido.trim() !== '') {
        updatePayload.apellido = apellido.trim();
      }
      if (formData.telefono && formData.telefono.trim() !== '') {
        updatePayload.telefono = formData.telefono.trim();
      }
      if (formData.municipioPreferido && formData.municipioPreferido.trim() !== '') {
        updatePayload.municipioPreferido = formData.municipioPreferido.trim();
      }

      // Validar que haya al menos un campo para actualizar
      if (Object.keys(updatePayload).length === 0) {
        alert("Por favor, completa al menos un campo para actualizar");
        return;
      }

      console.log('Enviando datos de actualización:', updatePayload); // Debug

      const response = await profileService.updateProfile(updatePayload);

      console.log('Response de updateProfile:', response); // Debug

      if (response && response.success && response.data && response.data.usuario) {
        const updatedUsuario = {
          id: response.data.usuario.id,
          nombre: `${response.data.usuario.nombre || ''}${response.data.usuario.apellido ? ` ${response.data.usuario.apellido}` : ''}`.trim() || 'Usuario',
          email: response.data.usuario.email || '',
          telefono: response.data.usuario.telefono || '',
          fechaRegistro: response.data.usuario.fechaRegistro || new Date().toISOString(),
          municipioPreferido: response.data.usuario.municipioPreferido || '',
        };
        setUsuario(updatedUsuario);
        setFormData(updatedUsuario);
        setEditando(false);
        
        // Actualizar estadísticas después de guardar
        try {
          const statsResponse = await profileService.getProfile();
          if (statsResponse.success && statsResponse.data) {
            setEstadisticas(statsResponse.data.estadisticas);
          }
        } catch (error) {
          console.warn('Error al actualizar estadísticas:', error);
        }

        // Actualizar usuario en el contexto de autenticación
        try {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            currentUser.municipioPreferido = response.data.usuario.municipioPreferido;
            localStorage.setItem('mobzi_user', JSON.stringify(currentUser));
          }
        } catch (error) {
          console.warn('Error al actualizar usuario en localStorage:', error);
        }

        alert("Perfil actualizado correctamente");
      } else {
        console.error('Error en respuesta:', response);
        const errorMessage = response?.message || response?.error || "Error al actualizar el perfil";
        alert(errorMessage);
      }
    } catch (error: unknown) {
      console.error('Error al guardar perfil:', error);
      const msg = error instanceof Error ? error.message : "Error al actualizar el perfil";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      return;
    }

    if (!confirm("Esta acción eliminará permanentemente tu cuenta y todos tus datos. ¿Continuar?")) {
      return;
    }

    try {
      setDeleting(true);
      const response = await profileService.deleteAccount();
      
      // Verificar si la respuesta es exitosa
      if (response && response.success === true) {
        alert("Cuenta eliminada correctamente");
        await logout();
        return;
      }
      
      // Si hay un error en la respuesta
      const errorMessage = response?.message || response?.error || "Error al eliminar la cuenta";
      alert(errorMessage);
    } catch (error: unknown) {
      console.error('Error al eliminar cuenta:', error);
      
      // Si el error es 401 o similar, asumir que la cuenta fue eliminada
      const e = error as { message?: string; response?: { status?: number } };
      if (
        (typeof e.message === 'string' &&
          (e.message.includes('401') ||
           e.message.includes('autenticado') ||
           e.message.includes('Unauthorized'))) ||
        e.response?.status === 401
      ) {
        await logout();
      } else {
        alert("Error al eliminar la cuenta. Por favor, intenta de nuevo.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData((prev) => prev ? ({ ...prev, [name]: value }) : null);
    }
  };

  return (
    <div className={styles.page}>
      <Menu />

      <main className={styles.container}>
        {/* Header */}
        {loading && !usuario ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Cargando perfil...</p>
          </div>
        ) : usuario ? (
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatar}>
                  {usuario.nombre && usuario.nombre.length > 0 
                    ? usuario.nombre.charAt(0).toUpperCase() 
                    : 'U'}
                </div>
                <div className={styles.avatarBadge}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
              </div>
              <div className={styles.headerInfo}>
                <h1 className={styles.title}>{usuario.nombre || 'Usuario'}</h1>
                <p className={styles.subtitle}>{usuario.email || 'Sin email'}</p>
                <p className={styles.memberSince}>
                  Miembro desde{" "}
                  {usuario.fechaRegistro 
                    ? new Date(usuario.fechaRegistro).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                      })
                    : 'Fecha no disponible'}
                </p>
              </div>
            </div>
          </header>
        ) : (
          <div className={styles.loadingContainer}>
            <p>No se pudo cargar el perfil. Por favor, recarga la página.</p>
          </div>
        )}

        {/* Estadísticas */}
        <section className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>Estadísticas</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statValue}>{estadisticas.rutasGuardadas}</p>
                <p className={styles.statLabel}>Rutas Guardadas</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statValue}>{estadisticas.rutasFavoritas}</p>
                <p className={styles.statLabel}>Rutas Favoritas</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statValue}>{estadisticas.busquedasRealizadas}</p>
                <p className={styles.statLabel}>Búsquedas Realizadas</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statValue}>{estadisticas.tiempoAhorrado}</p>
                <p className={styles.statLabel}>Minutos Ahorrados</p>
              </div>
            </div>
          </div>
        </section>

        {/* Información del perfil */}
        <section className={styles.profileSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Información del Perfil</h2>
            {!editando ? (
              <button className={styles.editButton} onClick={handleEdit}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar
              </button>
            ) : (
              <div className={styles.editActions}>
                <button
                  className={styles.cancelButton}
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  className={styles.saveButton}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            )}
          </div>

          <div className={styles.profileForm}>
            <div className={styles.formGroup}>
              <label htmlFor="nombre" className={styles.label}>Nombre</label>
              {editando && formData ? (
                <input
                  id="nombre"
                  type="text"
                  name="nombre"
                  value={formData.nombre || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  disabled={loading}
                  aria-label="Nombre"
                />
              ) : (
                <p className={styles.value}>{usuario?.nombre || 'No disponible'}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Correo Electrónico</label>
              {editando && formData ? (
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  disabled={true}
                  aria-label="Correo Electrónico"
                  title="El correo electrónico no se puede modificar"
                />
              ) : (
                <p className={styles.value}>{usuario?.email || 'No disponible'}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="telefono" className={styles.label}>Teléfono</label>
              {editando && formData ? (
                <input
                  id="telefono"
                  type="tel"
                  name="telefono"
                  value={formData.telefono || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  disabled={loading}
                  aria-label="Teléfono"
                  placeholder="Ingresa tu teléfono"
                />
              ) : (
                <p className={styles.value}>{usuario?.telefono || 'No proporcionado'}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="municipioPreferido" className={styles.label}>Municipio Preferido</label>
              {editando && formData ? (
                <select
                  id="municipioPreferido"
                  name="municipioPreferido"
                  value={formData.municipioPreferido || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                  disabled={loading}
                  aria-label="Municipio Preferido"
                >
                  <option value="">Selecciona un municipio</option>
                  {municipios.map((municipio) => (
                    <option key={municipio.id} value={municipio.id}>
                      {municipio.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={styles.value}>
                  {usuario?.municipioPreferido 
                    ? (municipios.find(m => m.id === usuario.municipioPreferido)?.nombre || usuario.municipioPreferido)
                    : 'No seleccionado'}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Acciones adicionales */}
        <section className={styles.actionsSection}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#1f2937',
            borderRadius: '8px',
            border: '1px solid #374151'
          }}>
            <h3 style={{ 
              color: '#f9fafb', 
              fontSize: '16px', 
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              Configuración del Backend
            </h3>
            <p style={{ 
              color: '#9ca3af', 
              fontSize: '14px',
              marginBottom: '12px'
            }}>
              {getBackendUrlBase() 
                ? `Backend configurado: ${getBackendUrlBase()}`
                : 'No hay backend configurado. Configura la URL para usar la aplicación.'}
            </p>
            <button
              onClick={() => setShowBackendConfig(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#f9fafb',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                width: 'fit-content',
              }}
            >
              {getBackendUrlBase() ? 'Cambiar URL del Backend' : 'Configurar Backend'}
            </button>
          </div>
          
          <button 
            className={styles.dangerButton}
            onClick={handleDeleteAccount}
            disabled={deleting || loading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l18 18M3 21l18-18" />
            </svg>
            {deleting ? "Eliminando..." : "Eliminar Cuenta"}
          </button>
        </section>

        {/* Diálogo de configuración del backend */}
        {showBackendConfig && (
          <BackendConfigDialog 
            onClose={() => setShowBackendConfig(false)}
          />
        )}
      </main>
    </div>
  );
}

export default function ProtectedProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}

