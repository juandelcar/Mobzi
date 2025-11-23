"use client";

// Imports y dependencias
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./routes.module.css";
import Menu from "@/app/menu/Menu";
import ProtectedRoute from "@/components/ProtectedRoute";
import * as profileService from "@/services/profile.service";

// Tipos de datos
type RutaGuardada = {
  id: string;
  rutaId?: string; // ID de la ruta en el sistema
  nombre: string;
  origen: string;
  destino: string;
  municipio: string;
  empresa: string;
  ruta: string;
  fechaCreacion: string;
  favorita: boolean;
};

function RoutesPage() {
  // Estados del componente
  const router = useRouter();
  const [rutas, setRutas] = useState<RutaGuardada[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFavoritas, setFilterFavoritas] = useState(false);
  const [loading, setLoading] = useState(true);
  const routeInfoRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const routeDetailRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const routeDateRefs = useRef<Map<string, HTMLParagraphElement>>(new Map());

  // Mapeo de nombres de rutas a IDs del sistema
  const rutaNameToIdMap: Record<string, string> = {
    "Ruta Centro - Xicohténcatl": "rt-1",
    "Ruta Huamantla - San José Xicohténcatl": "rt-2",
    "Ruta Huamantla - Ixtenco": "rt-3",
    "Ruta Huamantla - Zitlaltepec": "rt-4",
    "Ruta Periférico - Centro": "rt-5",
  };

  // Datos simulados de horarios y paradas (en producción vendrían de la API)
  // const horariosPorRuta = useRef<Record<string, Array<{ dia: string; salidas: string[] }>>>({
  //   "1": [
  //     { dia: "Lunes - Viernes", salidas: ["06:00", "06:30", "07:00", "07:30", "08:00", "09:00", "12:00", "17:00", "18:00", "20:00"] },
  //     { dia: "Sábado", salidas: ["07:00", "08:00", "10:00", "12:00", "14:00", "18:00"] },
  //     { dia: "Domingo", salidas: ["08:00", "10:00", "12:00", "16:00", "19:00"] },
  //   ],
  //   "2": [
  //     { dia: "Lunes - Viernes", salidas: ["06:15", "06:45", "07:15", "08:15", "12:30", "15:00", "18:30", "21:00"] },
  //     { dia: "Sábado", salidas: ["07:30", "09:00", "11:00", "13:30", "17:30"] },
  //   ],
  //   "3": [
  //     { dia: "Lunes - Domingo", salidas: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"] },
  //   ],
  // }).current;

  // const paradasPorRuta = useRef<Record<string, Array<{ nombre: string }>>>({
  //   "1": [
  //     { nombre: "Centro de Huamantla" },
  //     { nombre: "Av. Juárez" },
  //     { nombre: "Bodega Aurrera" },
  //     { nombre: "Periférico Oriente" },
  //     { nombre: "Zona Industrial" },
  //   ],
  //   "2": [
  //     { nombre: "UTT" },
  //     { nombre: "Libramiento" },
  //     { nombre: "Av. Hidalgo" },
  //     { nombre: "Colonia Centro" },
  //   ],
  //   "3": [
  //     { nombre: "Mercado Municipal" },
  //     { nombre: "Parque Juárez" },
  //     { nombre: "Capilla San Miguel" },
  //     { nombre: "Rotonda Oriente" },
  //   ],
  // }).current;

  // const [abiertaRutaId, setAbiertaRutaId] = useState<string | null>(null);
  // const [tabActivaPorRuta, setTabActivaPorRuta] = useState<Record<string, "horarios" | "paradas">>({});

  // const isLoggedIn = (): boolean => {
  //   try {
  //     return !!localStorage.getItem("mobzi_user");
  //   } catch {
  //     return false;
  //   }
  // };

  // const descargarCSV = (ruta: RutaGuardada) => {
  //   if (!isLoggedIn()) {
  //     alert("Para descargar la información necesitas iniciar sesión.");
  //     return;
  //   }
  //   const horarios = horariosPorRuta[ruta.id] ?? [];
  //   const paradas = paradasPorRuta[ruta.id] ?? [];

  //   const filas: string[] = [];
  //   filas.push("Sección,Campo,Valor");
  //   filas.push(`Ruta,Nombre,"${ruta.nombre}"`);
  //   filas.push(`Ruta,Origen,"${ruta.origen}"`);
  //   filas.push(`Ruta,Destino,"${ruta.destino}"`);
  //   filas.push(`Ruta,Municipio,"${ruta.municipio}"`);
  //   filas.push(`Ruta,Empresa,"${ruta.empresa}"`);
  //   filas.push(`Ruta,Identificador,"${ruta.ruta}"`);
  //   horarios.forEach(h => {
  //     filas.push(`Horarios,${h.dia},"${h.salidas.join(" ")}"`);
  //   });
  //   paradas.forEach((p, idx) => {
  //     filas.push(`Paradas,${idx + 1},"${p.nombre}"`);
  //   });

  //   const contenido = "\uFEFF" + filas.join("\n");
  //   const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `MOBZI_${ruta.nombre.replace(/\s+/g, "_")}.csv`;
  //   document.body.appendChild(a);
  //   a.click();
  //   a.remove();
  //   URL.revokeObjectURL(url);
  // };

  // Cargar rutas guardadas desde el backend
  useEffect(() => {
    const loadRutas = async () => {
      try {
        setLoading(true);
        const response = await profileService.getRutasGuardadas();
        if (response.success && response.data) {
          setRutas(response.data);
        }
      } catch (error) {
        console.error('Error al cargar rutas guardadas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRutas();
  }, []);

  // Detectar textos largos y aplicar animación de scroll
  useEffect(() => {
    if (loading) return;

    const checkAndAnimate = () => {
      // Verificar routeInfoValue
      routeInfoRefs.current.forEach((element) => {
        if (element) {
          // El contenedor es el div padre que tiene overflow: hidden
          const container = element.parentElement;
          if (container) {
            const textWidth = element.scrollWidth;
            const containerWidth = container.clientWidth;
            if (textWidth > containerWidth) {
              element.classList.add(styles.scrolling);
              // Calcular el desplazamiento correcto
              const offset = textWidth - containerWidth;
              element.style.setProperty('--scroll-offset', `-${offset}px`);
            } else {
              element.classList.remove(styles.scrolling);
              element.style.removeProperty('--scroll-offset');
            }
          }
        }
      });

      // Verificar routeDetailValue
      routeDetailRefs.current.forEach((element) => {
        if (element) {
          const container = element.parentElement;
          if (container) {
            const textWidth = element.scrollWidth;
            const containerWidth = container.clientWidth;
            if (textWidth > containerWidth) {
              element.classList.add(styles.scrolling);
              // Calcular el desplazamiento correcto
              const offset = textWidth - containerWidth;
              element.style.setProperty('--scroll-offset', `-${offset}px`);
            } else {
              element.classList.remove(styles.scrolling);
              element.style.removeProperty('--scroll-offset');
            }
          }
        }
      });

      // Verificar routeCardDate
      routeDateRefs.current.forEach((element) => {
        if (element) {
          // El contenedor es routeCardHeader
          const container = element.parentElement;
          if (container) {
            const textWidth = element.scrollWidth;
            const containerWidth = container.clientWidth;
            if (textWidth > containerWidth) {
              element.classList.add(styles.scrolling);
              // Calcular el desplazamiento correcto
              const offset = textWidth - containerWidth;
              element.style.setProperty('--scroll-offset', `-${offset}px`);
            } else {
              element.classList.remove(styles.scrolling);
              element.style.removeProperty('--scroll-offset');
            }
          }
        }
      });
    };

    // Ejecutar después de que el DOM se actualice
    const timeoutId = setTimeout(checkAndAnimate, 200);
    
    // Re-ejecutar cuando cambie el tamaño de la ventana
    window.addEventListener('resize', checkAndAnimate);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkAndAnimate);
    };
  }, [rutas, loading]);

  // Funciones de manejo
  const handleToggleFavorita = async (ruta: RutaGuardada) => {
    if (!ruta.rutaId) {
      alert('No se puede actualizar el estado de favorito: ID de ruta no disponible');
      return;
    }

    try {
      const response = await profileService.saveRuta({
        rutaId: ruta.rutaId,
        favorita: !ruta.favorita,
        action: 'toggle',
      });

      if (response.success) {
        // Actualizar estado local
        setRutas((prev) =>
          prev.map((r) =>
            r.id === ruta.id
              ? { ...r, favorita: response.data?.rutaGuardada?.favorita ?? !r.favorita }
              : r
          )
        );
      } else {
        alert(response.message || 'Error al actualizar favorito');
      }
    } catch (error) {
      console.error('Error al actualizar favorito:', error);
      alert('Error al actualizar favorito');
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta ruta?")) {
      return;
    }

    try {
      const response = await profileService.deleteRutaGuardada(id);
      if (response.success) {
        // Eliminar del estado local
        setRutas((prev) => prev.filter((ruta) => ruta.id !== id));
      } else {
        alert(response.message || 'Error al eliminar la ruta');
      }
    } catch (error) {
      console.error('Error al eliminar ruta:', error);
      alert('Error al eliminar la ruta');
    }
  };

  const handleVerEnMapa = (ruta: RutaGuardada) => {
    // Usar el rutaId si está disponible (viene del backend)
    if (ruta.rutaId) {
      router.push(`/home?ruta=${encodeURIComponent(ruta.rutaId)}&municipio=${encodeURIComponent(ruta.municipio)}`);
      return;
    }
    
    // Fallback: intentar obtener el ID del sistema basado en el nombre de la ruta
    const rutaSystemId = rutaNameToIdMap[ruta.ruta] || "";
    
    if (rutaSystemId) {
      // Navegar a home con el parámetro de la ruta del sistema
      router.push(`/home?ruta=${encodeURIComponent(rutaSystemId)}&municipio=${encodeURIComponent(ruta.municipio)}`);
    } else {
      // Si no se encuentra el mapeo, mostrar un mensaje de error
      alert('No se pudo encontrar la ruta en el sistema. Por favor, intenta de nuevo.');
    }
  };

  // Filtrar rutas
  const rutasFiltradas = rutas.filter((ruta) => {
    const matchSearch =
      ruta.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ruta.origen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ruta.destino.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFavoritas = !filterFavoritas || ruta.favorita;
    return matchSearch && matchFavoritas;
  });

  return (
    <div className={styles.page}>
      <Menu />

      <main className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>Mis Rutas</h1>
          <p className={styles.subtitle}>
            Gestiona tus rutas guardadas y accede rápidamente a tus destinos
            frecuentes
          </p>
        </header>

        {/* Barra de búsqueda y filtros */}
        <div className={styles.searchSection}>
          <div className={styles.searchBar}>
            <svg
              className={styles.searchIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar rutas..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className={`${styles.filterButton} ${
              filterFavoritas ? styles.filterButtonActive : ""
            }`}
            onClick={() => setFilterFavoritas(!filterFavoritas)}
          >
            <svg
              viewBox="0 0 24 24"
              fill={filterFavoritas ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Favoritas
          </button>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Cargando rutas...</p>
          </div>
        ) : rutasFiltradas.length === 0 ? (
          <div className={styles.emptyState}>
            <svg
              className={styles.emptyIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <h2>No hay rutas guardadas</h2>
            <p>
              {searchQuery || filterFavoritas
                ? "No se encontraron rutas con los filtros aplicados"
                : "Comienza guardando tus rutas favoritas desde la página principal"}
            </p>
            {!searchQuery && !filterFavoritas && (
              <a href="/home" className={styles.primaryButton}>
                Explorar Rutas
              </a>
            )}
          </div>
        ) : (
          <div className={styles.routesGrid}>
            {rutasFiltradas.map((ruta) => (
              <div
                key={ruta.id}
                className={`${styles.routeCard} ${
                  ruta.favorita ? styles.routeCardFavorita : ""
                }`}
              >
                <div className={styles.routeCardHeader}>
                  <div className={styles.routeCardTitle}>
                    <h3>{ruta.nombre}</h3>
                    <button
                      className={`${styles.favoriteButton} ${
                        ruta.favorita ? styles.favoriteButtonActive : ""
                      }`}
                      onClick={() => handleToggleFavorita(ruta)}
                      aria-label={
                        ruta.favorita
                          ? "Quitar de favoritos"
                          : "Agregar a favoritos"
                      }
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill={ruta.favorita ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>
                  <p
                    ref={(el) => {
                      if (el) routeDateRefs.current.set(`${ruta.id}-date`, el);
                    }}
                    className={styles.routeCardDate}
                  >
                    Guardada el {new Date(ruta.fechaCreacion).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className={styles.routeCardBody}>
                  <div className={styles.routeInfo}>

                    <div className={styles.routeInfoItem}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="10" r="3" />
                        <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
                      </svg>
                      <div>
                        <span className={styles.routeInfoLabel}>Origen</span>
                        <span
                          ref={(el) => {
                            if (el) routeInfoRefs.current.set(`${ruta.id}-origen`, el);
                          }}
                          className={styles.routeInfoValue}
                        >
                          {ruta.origen}
                        </span>
                      </div>
                    </div>

                    <div className={styles.routeArrow}>→</div>

                    <div className={styles.routeInfoItem}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <div>
                        <span className={styles.routeInfoLabel}>Destino</span>
                        <span
                          ref={(el) => {
                            if (el) routeInfoRefs.current.set(`${ruta.id}-destino`, el);
                          }}
                          className={styles.routeInfoValue}
                        >
                          {ruta.destino}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.routeDetails}>
                    <div className={styles.routeDetailItem}>
                      <span className={styles.routeDetailLabel}>Municipio</span>
                      <span
                        ref={(el) => {
                          if (el) routeDetailRefs.current.set(`${ruta.id}-municipio`, el);
                        }}
                        className={styles.routeDetailValue}
                      >
                        {ruta.municipio}
                      </span>
                    </div>
                    <div className={styles.routeDetailItem}>
                      <span className={styles.routeDetailLabel}>Empresa</span>
                      <span
                        ref={(el) => {
                          if (el) routeDetailRefs.current.set(`${ruta.id}-empresa`, el);
                        }}
                        className={styles.routeDetailValue}
                      >
                        {ruta.empresa}
                      </span>
                    </div>
                    <div className={styles.routeDetailItem}>
                      <span className={styles.routeDetailLabel}>Ruta</span>
                      <span
                        ref={(el) => {
                          if (el) routeDetailRefs.current.set(`${ruta.id}-ruta`, el);
                        }}
                        className={styles.routeDetailValue}
                      >
                        {ruta.ruta}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Apartado: Horarios y Paradas */}
                {/* <div className={styles.extraSection}>
                  <div className={styles.extraHeader}>
                    <div className={styles.extraTabs}>
                      <button
                        className={`${styles.extraTab} ${(
                          tabActivaPorRuta[ruta.id] ?? "horarios"
                        ) === "horarios" ? styles.extraTabActive : ""}`}
                        onClick={() => {
                          setAbiertaRutaId(prev => (prev === ruta.id ? ruta.id : ruta.id));
                          setTabActivaPorRuta(prev => ({ ...prev, [ruta.id]: "horarios" }));
                        }}
                      >
                        Horarios
                      </button>
                      <button
                        className={`${styles.extraTab} ${(
                          tabActivaPorRuta[ruta.id] ?? "horarios"
                        ) === "paradas" ? styles.extraTabActive : ""}`}
                        onClick={() => {
                          setAbiertaRutaId(prev => (prev === ruta.id ? ruta.id : ruta.id));
                          setTabActivaPorRuta(prev => ({ ...prev, [ruta.id]: "paradas" }));
                        }}
                      >
                        Paradas
                      </button>
                    </div>
                    <div className={styles.extraActions}>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => setAbiertaRutaId(prev => (prev === ruta.id ? null : ruta.id))}
                      >
                        {abiertaRutaId === ruta.id ? "Ocultar" : "Ver horarios y paradas"}
                      </button>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => descargarCSV(ruta)}
                      >
                        Descargar info
                      </button>
                    </div>
                  </div>

                  {abiertaRutaId === ruta.id && (
                    <div className={styles.extraBody}>
                      {(tabActivaPorRuta[ruta.id] ?? "horarios") === "horarios" ? (
                        <div className={styles.scheduleTableWrap}>
                          <table className={styles.scheduleTable}>
                            <thead>
                              <tr>
                                <th>Día</th>
                                <th>Salidas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(horariosPorRuta[ruta.id] ?? []).map((h, i) => (
                                <tr key={i}>
                                  <td>{h.dia}</td>
                                  <td className={styles.scheduleTimes}>
                                    {h.salidas.join("  ·  ")}
                                  </td>
                                </tr>
                              ))}
                              {(horariosPorRuta[ruta.id] ?? []).length === 0 && (
                                <tr>
                                  <td colSpan={2} className={styles.emptyCell}>
                                    Sin datos. (Se mostrarán cuando el backend esté disponible).
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <ul className={styles.stopsList}>
                          {(paradasPorRuta[ruta.id] ?? []).map((p, i) => (
                            <li key={i} className={styles.stopItem}>
                              <span className={styles.stopIndex}>{i + 1}</span>
                              <span className={styles.stopName}>{p.nombre}</span>
                            </li>
                          ))}
                          {(paradasPorRuta[ruta.id] ?? []).length === 0 && (
                            <li className={styles.emptyCell}>
                              Sin datos. (Se mostrarán cuando el backend esté disponible).
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                </div> */}

                <div className={styles.routeCardActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleVerEnMapa(ruta)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Ver en mapa
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                    onClick={() => handleEliminar(ruta.id)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProtectedRoutesPage() {
  return (
    <ProtectedRoute>
      <RoutesPage />
    </ProtectedRoute>
  );
}

