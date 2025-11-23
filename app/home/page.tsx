"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./home.module.css";
import Menu from "@/app/menu/Menu";
import mapboxgl from "mapbox-gl";
import ProtectedRoute from "@/components/ProtectedRoute";
import * as publicService from "@/services/public.service";
import * as profileService from "@/services/profile.service";
import { useAuth } from "@/hooks/useAuth";
import * as authService from "@/services/auth.service";

// Tipos de datos
type Municipio = {
  id: string;
  nombre: string;
  centro: { lng: number; lat: number };
};
type Item = { id: string; nombre: string };
type Ruta = { id: string; nombre: string; origen: string; destino: string; empresaId?: string; costoMinimo?: number; costoMaximo?: number; moneda?: string };

// ============================================
// DATOS DE EJEMPLO - COMENTADOS
// Ahora los datos se obtienen desde el backend
// ============================================
// const ROUTE_DETAILS: Record<
//   string,
//   {
//     costoMinimo: number;
//     costoMaximo: number;
//     moneda: string;
//     duracion: string;
//     frecuencia: string;
//     paradas: string[];
//     coordenadas: [number, number][];
//     notas?: string;
//   }
// > = {
//   "rt-1": {
//     costoMinimo: 8,
//     costoMaximo: 10,
//     moneda: "MXN",
//     duracion: "25 - 30 min",
//     frecuencia: "Cada 12 min",
//     paradas: [
//       "Centro de Huamantla",
//       "Universidad Tecnológica de Tlaxcala",
//       "Libramiento Oriente",
//       "Barrio de San Sebastián",
//       "Zona Industrial Xicohténcatl",
//     ],
//     coordenadas: [
//       [-97.931, 19.315],
//       [-97.925, 19.317],
//       [-97.920, 19.318],
//       [-97.915, 19.320],
//       [-97.910, 19.323],
//     ],
//     notas: "Tarifa preferencial para estudiantes disponible al presentar credencial.",
//   },
//   "rt-2": {
//     costoMinimo: 9,
//     costoMaximo: 11,
//     moneda: "MXN",
//     duracion: "35 - 40 min",
//     frecuencia: "Cada 15 min",
//     paradas: [
//       "Terminal Huamantla",
//       "Av. Juárez",
//       "Mercado Municipal",
//       "San Lucas Tecopilco",
//       "San José Xicohténcatl",
//     ],
//     coordenadas: [
//       [-97.935, 19.313],
//       [-97.929, 19.314],
//       [-97.924, 19.316],
//       [-97.920, 19.319],
//       [-97.916, 19.322],
//     ],
//   },
//   "rt-3": {
//     costoMinimo: 10,
//     costoMaximo: 13,
//     moneda: "MXN",
//     duracion: "45 - 50 min",
//     frecuencia: "Cada 20 min",
//     paradas: [
//       "Huamantla Centro",
//       "Colonia Santa Anita",
//       "Lib. Tlaxcala-Oriente",
//       "San Felipe",
//       "Ixtenco Centro",
//     ],
//     coordenadas: [
//       [-97.932, 19.314],
//       [-97.928, 19.318],
//       [-97.924, 19.320],
//       [-97.919, 19.323],
//       [-97.913, 19.327],
//     ],
//   },
//   "rt-4": {
//     costoMinimo: 12,
//     costoMaximo: 15,
//     moneda: "MXN",
//     duracion: "50 - 55 min",
//     frecuencia: "Cada 25 min",
//     paradas: [
//       "Terminal Huamantla",
//       "San Lucas",
//       "Santa Anita",
//       "La Candelaria",
//       "Zitlaltepec Centro",
//     ],
//     coordenadas: [
//       [-97.934, 19.312],
//       [-97.929, 19.315],
//       [-97.924, 19.317],
//       [-97.920, 19.320],
//       [-97.914, 19.325],
//     ],
//   },
//   "rt-5": {
//     costoMinimo: 7,
//     costoMaximo: 9,
//     moneda: "MXN",
//     duracion: "20 - 25 min",
//     frecuencia: "Cada 10 min",
//     paradas: [
//       "Periférico Oriente",
//       "Colonia Los Volcanes",
//       "Hospital General",
//       "Mercado Municipal",
//       "Centro Histórico",
//     ],
//     coordenadas: [
//       [-97.937, 19.312],
//       [-97.930, 19.314],
//       [-97.926, 19.316],
//       [-97.921, 19.318],
//       [-97.917, 19.321],
//     ],
//   },
// };

function HomePage() {
  // Estados
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  // Inicializar con municipio preferido del usuario si está autenticado
  const [municipioId, setMunicipioId] = useState<string>("");
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [empresas, setEmpresas] = useState<Item[]>([]);
  const [rutaId, setRutaId] = useState<string>("");
  const [empresaId, setEmpresaId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [selectedRouteDetails, setSelectedRouteDetails] = useState<publicService.RutaDetails | null>(null);
  const [loadingRouteDetails, setLoadingRouteDetails] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);
  const [rutaGuardada, setRutaGuardada] = useState<{ guardada: boolean; favorita: boolean }>({
    guardada: false,
    favorita: false,
  });
  const [panelMinimizado, setPanelMinimizado] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const lastLoadedRouteRef = useRef<string | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const selectionInProgressRef = useRef(false);
  const drawnByHandlerRef = useRef<string | null>(null);

  // Función reutilizable para dibujar los detalles de una ruta en el mapa
  const drawDetailsOnMap = async (details: publicService.RutaDetails) => {
    const map = mapInstanceRef.current;
    if (!map || !details) return;

    const sourceId = `rutaSeleccionada_${details.id}`;
    const layerId = `rutaLine_${details.id}`;

    // limpiar marcadores anteriores
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const rawCoords = details.coordenadas || [];
    const coords = rawCoords.filter((p) => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (coords.length === 0) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const waypoints = coords.map((c) => `${c[0]},${c[1]}`).join(";");
    let routeCoords = coords;
    try {
      const useDirections = coords.length <= 25;
      const url = useDirections
        ? `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?geometries=geojson&overview=full&alternatives=false&access_token=${token}`
        : `https://api.mapbox.com/matching/v5/mapbox/driving/${waypoints}?geometries=geojson&overview=full&access_token=${token}`;
      const resp = await fetch(url);
      const data = await resp.json();
      routeCoords = (useDirections ? data.routes?.[0]?.geometry?.coordinates : data.matchings?.[0]?.geometry?.coordinates) || coords;
    } catch (err) {
      console.debug("Mapbox directions failed, using raw coords", err);
      routeCoords = coords;
    }

    const color = details.id.charCodeAt(details.id.length - 1) % 2 === 0 ? "#FFD700" : "#00BFFF";

    try {
      // eliminar otras capas/fuentes de rutas antiguas
      try {
        const style = map.getStyle();
        (style.layers || []).forEach((layer) => {
          if (layer && layer.id && String(layer.id).startsWith("rutaLine_") && String(layer.id) !== layerId) {
            try { if (map.getLayer(layer.id)) map.removeLayer(layer.id); } catch {}
          }
        });
        Object.keys(style.sources || {}).forEach((srcId) => {
          if (String(srcId).startsWith("rutaSeleccionada_") && String(srcId) !== sourceId) {
            try { if (map.getSource(srcId)) map.removeSource(srcId); } catch {}
          }
        });
      } catch {}

      if (map.getSource(sourceId)) {
        const src = map.getSource(sourceId) as unknown as { setData?: (data: unknown) => void } | undefined;
        if (src && typeof src.setData === "function") {
          src.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeCoords } });
        }
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeCoords } },
        });
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({ id: layerId, type: "line", source: sourceId, paint: { "line-color": color, "line-width": 5 } });
      } else {
        try { map.setPaintProperty(layerId, "line-color", color); } catch {}
      }
    } catch (err) {
      console.error("Error al crear/actualizar fuente o capa:", err);
    }

    details.paradas.forEach((stop, i) => {
      const point = coords[i];
      if (!point) return;
      const el = document.createElement("div");
      el.className = styles.mapMarkerLabel;
      el.textContent = String(i + 1);
      el.style.borderColor = color;
      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom", offset: [0, -12] })
        .setLngLat(point)
        .setPopup(new mapboxgl.Popup().setText(stop))
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (routeCoords.length === 1) {
      map.flyTo({ center: routeCoords[0], zoom: Math.max(map.getZoom(), 14) });
    } else {
      const bounds = new mapboxgl.LngLatBounds(routeCoords[0], routeCoords[0]);
      routeCoords.slice(1).forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, { padding: 60 });
    }
  };

  const fetchAndSetRouteDetails = async (id: string) => {
    // Cancel any previous details fetch
    try { fetchControllerRef.current?.abort(); } catch {}
    const controller = new AbortController();
    fetchControllerRef.current = controller;
    selectionInProgressRef.current = true;

    setLoadingRouteDetails(true);
    setSelectedRouteDetails(null);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
      const url = apiBase ? `${apiBase}/rutas/${encodeURIComponent(id)}` : `/api/v1/rutas/${encodeURIComponent(id)}`;
      const resp = await fetch(url, { signal: controller.signal, headers: { 'Content-Type': 'application/json' } });
      const data = await resp.json();

      if (resp.ok && data && data.success && data.data) {
        const details = data.data as publicService.RutaDetails;
        setSelectedRouteDetails(details);
        lastLoadedRouteRef.current = id;
        // Dibujar inmediatamente desde el handler para evitar carreras
        drawnByHandlerRef.current = id;
        try { await drawDetailsOnMap(details); } catch { /* ignore */ }
      } else {
        console.error('Error en detalles de ruta (fetch):', data);
        setSelectedRouteDetails(null);
      }

      if (isAuthenticated) {
        try {
          const statusResp = await fetch(apiBase ? `${apiBase}/rutas/${encodeURIComponent(id)}/guardada` : `/api/v1/rutas/${encodeURIComponent(id)}/guardada`, { signal: controller.signal });
          const statusData = await statusResp.json().catch(() => null);
          if (statusResp.ok && statusData && statusData.success && statusData.data) {
            setRutaGuardada({ guardada: statusData.data.guardada, favorita: statusData.data.favorita });
          } else {
            setRutaGuardada({ guardada: false, favorita: false });
          }
        } catch {
          setRutaGuardada({ guardada: false, favorita: false });
        }
      } else {
        setRutaGuardada({ guardada: false, favorita: false });
      }
    } catch (err) {
      if ((err as unknown as { name?: string })?.name === 'AbortError') {
        console.debug('Detalles de ruta abortados:', id);
        return;
      }
      console.error('Error al obtener detalles de ruta (handler):', err);
      setSelectedRouteDetails(null);
      setRutaGuardada({ guardada: false, favorita: false });
    } finally {
      setLoadingRouteDetails(false);
      fetchControllerRef.current = null;
      selectionInProgressRef.current = false;
    }
  };

  // Enviar logs al backend temporalmente para poder recogerlos desde el servidor
  const sendDebugLog = async (event: string, payload?: unknown) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const url = apiBase.endsWith('/') ? `${apiBase}debug/logs` : `${apiBase}/debug/logs`;
      void fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, payload, ts: new Date().toISOString() }) });
    } catch {
      // noop
    }
    // También guardar en memoria local del cliente para que puedas inspeccionar sin backend
    try {
      const map = mapInstanceRef.current;
      const style = map ? (map.getStyle() as unknown as { layers?: Array<{ id: string }>; sources?: Record<string, unknown> }) : undefined;
      const mapState = map ? {
        layers: (style?.layers || []).map((l) => String(l.id)),
        sources: Object.keys(style?.sources || {}),
      } : null;
      // @ts-expect-error - augment window for debug session
      window.__mobziLogs = window.__mobziLogs || [];
      // @ts-expect-error - augment window for debug session
      window.__mobziLogs.push({ event, payload, mapState, ts: new Date().toISOString() });
    } catch {}
  };

  // Cargar municipios desde el backend y establecer municipio preferido
  useEffect(() => {
    const loadMunicipios = async () => {
      try {
        const response = await publicService.getMunicipios();
        if (response.success && response.data) {
          setMunicipios(response.data);
          
          const municipioParam = searchParams.get("municipio");
          if (municipioParam) {
            const found = response.data.find(
              (m) => m.id === municipioParam || m.nombre.toLowerCase() === municipioParam.toLowerCase()
            );
            if (found) {
              setMunicipioId(found.id);
              return;
            }
          }

          // Si el usuario está autenticado, usar su municipio preferido
          if (isAuthenticated) {
            const currentUser = authService.getCurrentUser();
            if (currentUser?.municipioPreferido) {
              // Verificar que el municipio preferido existe en la lista
              const municipioPreferido = response.data.find(
                m => m.id === currentUser.municipioPreferido
              );
              if (municipioPreferido) {
                setMunicipioId(currentUser.municipioPreferido);
                return;
              }
            }
          }
          
          // Si no hay municipio preferido o no está autenticado, usar el primero o "huamantla" por defecto
          setMunicipioId((prev) => {
            if (prev) return prev; // No cambiar si ya hay un valor
            if (response.data && response.data.length > 0) {
              const defaultMunicipio = response.data.find(m => m.id === "huamantla") || response.data[0];
              return defaultMunicipio ? defaultMunicipio.id : "huamantla";
            }
            return "huamantla";
          });
        }
      } catch (error) {
        console.error('Error al cargar municipios:', error);
        // Fallback a huamantla si hay error
        setMunicipioId((prev) => prev || "huamantla");
      }
    };
    loadMunicipios();
  }, [isAuthenticated, searchParams]);

  // Cargar rutas y empresas por municipio desde el backend
  useEffect(() => {
    if (!municipioId) {
      return;
    }
    const load = async () => {
      try {
        const [rutasResponse, empresasResponse] = await Promise.all([
          publicService.getRutasByMunicipio(municipioId),
          publicService.getEmpresasByMunicipio(municipioId),
        ]);
        
        if (rutasResponse.success && rutasResponse.data) {
          setRutas(rutasResponse.data);
        }
        if (empresasResponse.success && empresasResponse.data) {
          setEmpresas(empresasResponse.data);
        }
      
      const rutaParam = searchParams.get("ruta");
      setEmpresaId("");
      setRutaId(rutaParam || "");
      if (!rutaParam) {
        setSelectedRouteDetails(null);
      }
      } catch (error) {
        console.error('Error al cargar rutas y empresas:', error);
      }
    };
    load();
  }, [municipioId, searchParams]);

  const selectedMunicipio = useMemo(
    () => municipios.find((m) => m.id === municipioId),
    [municipios, municipioId]
  );

  const selectedRoute = useMemo(
    () => rutas.find((r) => r.id === rutaId) ?? null,
    [rutas, rutaId]
  );

  // Cargar detalles de la ruta seleccionada desde el backend
  useEffect(() => {
    if (!rutaId) {
      setSelectedRouteDetails(null);
      setRutaGuardada({ guardada: false, favorita: false });
      return;
    }

    // Si ya cargamos previamente los detalles para esta ruta desde el handler, evitar refetch
    if (lastLoadedRouteRef.current === rutaId && selectedRouteDetails) {
      return;
    }

    const loadRouteDetails = async () => {
      setLoadingRouteDetails(true);
      setSelectedRouteDetails(null);
      try {
        const [detailsResponse, statusResponse] = await Promise.all([
          publicService.getRutaDetails(rutaId),
          isAuthenticated ? profileService.getRutaGuardadaStatus(rutaId) : Promise.resolve(null),
        ]);

        if (detailsResponse.success && detailsResponse.data) {
          setSelectedRouteDetails(detailsResponse.data);
          lastLoadedRouteRef.current = rutaId;
        }

        if (statusResponse && statusResponse.success && statusResponse.data) {
          setRutaGuardada({
            guardada: statusResponse.data.guardada,
            favorita: statusResponse.data.favorita,
          });
        } else if (!isAuthenticated) {
          setRutaGuardada({ guardada: false, favorita: false });
        }
      } catch (error) {
        console.error('Error al cargar detalles de la ruta:', error);
        setSelectedRouteDetails(null);
        setRutaGuardada({ guardada: false, favorita: false });
      } finally {
        setLoadingRouteDetails(false);
      }
    };

    loadRouteDetails();
  }, [rutaId, isAuthenticated, selectedRouteDetails]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!rutaId || !selectedRouteDetails) {
      // eliminar cualquier capa/fuente previa que use el prefijo de rutas
      try {
        const style = map.getStyle();
        (style.layers || []).forEach((layer) => {
          if (layer && layer.id && String(layer.id).startsWith("rutaLine_")) {
            try { if (map.getLayer(layer.id)) map.removeLayer(layer.id); } catch {}
          }
        });
        // eliminar fuentes asociadas
        Object.keys(style.sources || {}).forEach((srcId) => {
          if (String(srcId).startsWith("rutaSeleccionada_")) {
            try { if (map.getSource(srcId)) map.removeSource(srcId); } catch {}
          }
        });
      } catch {
        // fallback a ids fijos por compatibilidad
        try { if (map.getLayer("rutaLine")) map.removeLayer("rutaLine"); } catch {}
        try { if (map.getSource("rutaSeleccionada")) map.removeSource("rutaSeleccionada"); } catch {}
      }

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    }
  }, [rutaId, selectedRouteDetails]);

  useEffect(() => {
    if (empresaId) {
      setPanelMinimizado(false);
    }
  }, [empresaId]);

  // Filtrar rutas basado en la búsqueda
  // Nota: La búsqueda ahora se hace solo por nombre de ruta
  // Para búsqueda avanzada con paradas, se necesitaría cargar los detalles de todas las rutas
  const filteredRoutes = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchQuery = query.toLowerCase().trim();
    return rutas.filter((ruta) => {
      // Buscar en nombre de la ruta
      return ruta.nombre.toLowerCase().includes(searchQuery);
    });
  }, [query, rutas]);

  // Registrar búsqueda cuando se realiza una búsqueda
  useEffect(() => {
    const registerSearchQuery = async () => {
      if (query.trim() && isAuthenticated && filteredRoutes.length >= 0) {
        try {
          await profileService.registerSearch({
            query: query.trim(),
            municipioId: municipioId || undefined,
            resultadosEncontrados: filteredRoutes.length,
          });
        } catch (error) {
          // Silenciar errores de registro de búsqueda
          console.warn('Error al registrar búsqueda:', error);
        }
      }
    };

    // Debounce: esperar 1 segundo después de que el usuario deje de escribir
    const timeoutId = setTimeout(() => {
      registerSearchQuery();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [query, isAuthenticated, municipioId, filteredRoutes.length]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || !selectedMunicipio) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;
    try {
      const gl = mapboxgl as unknown as { setTelemetryEnabled?: (enabled: boolean) => void };
      gl.setTelemetryEnabled?.(false);
    } catch {}

    const map = new mapboxgl.Map({
      container: mapRef.current!,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [selectedMunicipio.centro.lng, selectedMunicipio.centro.lat],
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl());
    mapInstanceRef.current = map;

    return () => map.remove();
  }, [selectedMunicipio]);

  // Dibujar ruta seleccionada en el mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedRouteDetails) return;

    // cleanup/teardown vars handled in return

    // si la ruta ya fue dibujada por el handler, evitar dibujar de nuevo
    if (drawnByHandlerRef.current === selectedRouteDetails.id) {
      drawnByHandlerRef.current = null;
      return;
    }

    if (map.loaded()) {
      (async () => {
        try {
          await drawDetailsOnMap(selectedRouteDetails);
        } catch (err) {
          console.error('drawDetailsOnMap error:', err);
        }
      })();
    } else {
      map.once("load", () => {
        (async () => {
          try {
            await drawDetailsOnMap(selectedRouteDetails);
          } catch (err) {
            console.error('drawDetailsOnMap error (on load):', err);
          }
        })();
      });
    }

    return () => {
      try { if (map.getLayer(`rutaLine_${selectedRouteDetails.id}`)) map.removeLayer(`rutaLine_${selectedRouteDetails.id}`); } catch {}
      try { if (map.getSource(`rutaSeleccionada_${selectedRouteDetails.id}`)) map.removeSource(`rutaSeleccionada_${selectedRouteDetails.id}`); } catch {}
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [rutaId, selectedRouteDetails]);

  // Determinar si hay panel lateral visible
  const hasSidePanel = useMemo(() => {
    const hasSearch = query.trim().length > 0;
    const empresaPanelVisible = !!empresaId && !panelMinimizado;
    const rutaPanelVisible = !!selectedRouteDetails && !panelMinimizado;
    return hasSearch || empresaPanelVisible || rutaPanelVisible || loadingRouteDetails;
  }, [query, empresaId, panelMinimizado, selectedRouteDetails, loadingRouteDetails]);

  // Bloquear inputs (selects y búsqueda) mientras hay una ruta o empresa seleccionada
  const inputsLocked = Boolean(selectedRouteDetails || empresaId);

  // Ajustar mapa cuando cambia el layout (ancho disponible)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    // Esperar al siguiente tick para que el DOM aplique cambios de layout
    const id = setTimeout(() => {
      try {
        map.resize();
      } catch {}
    }, 0);
    return () => clearTimeout(id);
  }, [hasSidePanel]);

  // Cambiar prioridad de selección (empresa → ruta)
  // const handleSelectRoute = (id: string) => {
  //   setEmpresaId("");
  //   setRutaId(id);
  // };


  // ==========================
// FUNCIÓN ACTUALIZADA: handleSelectRoute
  // Ahora solo establece la ruta seleccionada
  // Los detalles se cargan automáticamente en el useEffect
// ==========================
const handleSelectRoute = (id: string) => {
  console.debug("HomePage: handleSelectRoute ->", id);
  void sendDebugLog('handleSelectRoute', { id });
  // bloquear seleccion concurrente
  if (selectionInProgressRef.current) {
    console.debug('Selection in progress, ignoring new select', id);
    return;
  }
  setEmpresaId("");
  // limpiar overlays antes de cambiar
  clearRouteOverlays();
  setRutaId(id);
  // Cargar detalles inmediatamente para evitar carreras
  void fetchAndSetRouteDetails(id);
  setPanelMinimizado(false);
  };

  // Limpia capas/fuentes/markers relacionadas con rutas en el mapa
  const clearRouteOverlays = () => {
    const map = mapInstanceRef.current;
    console.debug("HomePage: clearRouteOverlays");
    void sendDebugLog('clearRouteOverlays');
    try {
      if (!map) return;
      const style = map.getStyle();
      (style.layers || []).forEach((layer) => {
        if (layer && layer.id && String(layer.id).startsWith("rutaLine_")) {
          try { if (map.getLayer(layer.id)) map.removeLayer(layer.id); } catch {}
        }
      });
      Object.keys(style.sources || {}).forEach((srcId) => {
        if (String(srcId).startsWith("rutaSeleccionada_")) {
          try { if (map.getSource(srcId)) map.removeSource(srcId); } catch {}
        }
      });
    } catch {
      try { if (map && map.getLayer("rutaLine")) map.removeLayer("rutaLine"); } catch {}
      try { if (map && map.getSource("rutaSeleccionada")) map.removeSource("rutaSeleccionada"); } catch {}
    }
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    setSelectedRouteDetails(null);
  };

  // Funciones para guardar rutas (toggle)
  const handleSaveRoute = async (favorita?: boolean) => {
    if (!rutaId || !isAuthenticated) {
      alert('Debes iniciar sesión para guardar rutas');
      return;
    }

    setSavingRoute(true);
    try {
      const response = await profileService.saveRuta({
        rutaId,
        favorita,
        action: 'toggle',
      });

      if (response.success) {
        // Actualizar estado local basado en la respuesta
        if (favorita !== undefined) {
          // Toggle de favorito
          if (response.data?.rutaGuardada) {
            setRutaGuardada({
              guardada: true,
              favorita: response.data.rutaGuardada.favorita,
            });
          } else {
            // Si se eliminó (no debería pasar con favoritos, pero por si acaso)
            setRutaGuardada({ guardada: false, favorita: false });
          }
        } else {
          // Toggle de guardar: eliminar o crear
          if (response.data?.deleted) {
            setRutaGuardada({ guardada: false, favorita: false });
          } else if (response.data?.rutaGuardada) {
            setRutaGuardada({
              guardada: true,
              favorita: response.data.rutaGuardada.favorita || false,
            });
          }
        }
      } else {
        alert(response.message || 'Error al guardar la ruta');
      }
    } catch (error) {
      console.error('Error al guardar ruta:', error);
      alert('Error al guardar la ruta');
    } finally {
      setSavingRoute(false);
    }
};

  const handleCerrarPanel = () => {
    if (selectedRoute && selectedRouteDetails) {
      setRutaId("");
      setSelectedRouteDetails(null);
    } else if (empresaId) {
      setEmpresaId("");
    }
    setPanelMinimizado(false);
  };

  const handleToggleMinimizar = () => {
    setPanelMinimizado((prev) => !prev);
  };


  return (
    <div className={styles.page}>
      <Menu />
      <main className={styles.container}>
        {/* Barra de búsqueda */}
        <div className={styles.searchBarContainer}>
          <div className={styles.searchBar}>
            <input
              className={styles.searchInput}
              placeholder="A dónde quieres ir"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={inputsLocked}
            />
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
          </div>
        </div>

        {/* Filtros */}
        <div className={styles.filters}>
          <select
            title="Selecciona un municipio"
            className={styles.select}
            value={municipioId}
            onChange={(e) => setMunicipioId(e.target.value)}
            disabled={inputsLocked}
          >
            {municipios.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>

          <select
            title="Selecciona una ruta"
            className={styles.select}
            value={rutaId}
            disabled={inputsLocked || loadingRouteDetails}
            onChange={(e) => { clearRouteOverlays(); handleSelectRoute(e.target.value); }}
          >
            <option value="">Selecciona una ruta</option>
            {rutas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>

          <select
            title="Selecciona una empresa"
            className={styles.select}
            value={empresaId}
            disabled={inputsLocked || loadingRouteDetails}
            onChange={(e) => { clearRouteOverlays(); setEmpresaId(e.target.value); }}
          >
            <option value="">Selecciona una empresa</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Mapa + Panel */}
        <div className={styles.mapSection}>
          <section className={`${styles.mapWrap} ${!hasSidePanel ? styles.mapWrapFull : ""}`}>
            {/* Botones de acción en la esquina superior izquierda */}
          {rutaId && selectedRouteDetails && (
            <div className={styles.routeActionButtons}>
                <button
                  className={`${styles.actionButton} ${rutaGuardada.favorita ? styles.actionButtonActive : ''}`}
                  onClick={() => handleSaveRoute(true)}
                  disabled={savingRoute || !isAuthenticated}
                  title={rutaGuardada.favorita ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    fill={rutaGuardada.favorita ? "currentColor" : "none"} 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>Favoritos</span>
                </button>
                <button
                  className={`${styles.actionButton} ${rutaGuardada.guardada ? styles.actionButtonSaved : ''}`}
                  onClick={() => handleSaveRoute()}
                  disabled={savingRoute || !isAuthenticated}
                  title={rutaGuardada.guardada ? "Quitar de Mis rutas" : "Guardar en Mis rutas"}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    fill={rutaGuardada.guardada ? "currentColor" : "none"} 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>Guardar</span>
                </button>
            </div>
          )}
          {panelMinimizado && ((selectedRoute && selectedRouteDetails) || empresaId) && (
            <div className={styles.panelRestoreChip}>
              <span className={styles.panelRestoreChipText}>
                {(selectedRoute && selectedRouteDetails)
                  ? selectedRoute.nombre
                  : (empresas.find((e) => e.id === empresaId)?.nombre ?? "Empresa")}
              </span>
              <button
                type="button"
                className={styles.panelRestoreChipBtn}
                onClick={() => setPanelMinimizado(false)}
              >
                Ver detalles
              </button>
            </div>
          )}
          <div ref={mapRef} className={styles.map} />
        </section>

          {query.trim() && filteredRoutes.length > 0 ? (
            <aside className={styles.routeDetailsPanel}>
              <header className={styles.routeDetailsHeader}>
                <span className={styles.routeDetailsBadge}>Resultados de búsqueda</span>
                <h2>
                  {filteredRoutes.length} {filteredRoutes.length === 1 ? "ruta encontrada" : "rutas encontradas"}
                </h2>
              </header>

              <section className={styles.routeListByEmpresa}>
                <ul className={styles.routeCardsList}>
                  {filteredRoutes.map((r) => (
                    <li
                      key={r.id}
                      className={`${styles.routeCardItem} ${styles.clickableCard}`}
                      onClick={() => {
                        handleSelectRoute(r.id);
                        setQuery("");
                      }}
                    >
                      <h4 className={styles.routeName}>{r.nombre}</h4>
                      <div className={styles.routeEndpointsMini}>
                        <span>Origen: {r.origen}</span>
                        <span>Destino: {r.destino}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          ) : query.trim() && filteredRoutes.length === 0 ? (
            <aside className={styles.routeDetailsPanel}>
              <header className={styles.routeDetailsHeader}>
                <span className={styles.routeDetailsBadge}>Sin resultados</span>
                <h2>No se encontraron rutas</h2>
                <p className={styles.noRoutes}>
                  Intenta buscar con otros términos o verifica la ortografía.
                </p>
              </header>
            </aside>
          ) : empresaId && !panelMinimizado ? (
            <aside className={styles.routeDetailsPanel}>
              <header className={styles.routeDetailsHeader}>
                <span className={styles.routeDetailsBadge}>Empresa seleccionada</span>
                <h2>{empresas.find((emp) => emp.id === empresaId)?.nombre ?? "Empresa"}</h2>
                <div className={styles.panelControls}>
                  <button
                    type="button"
                    className={`${styles.panelControlBtn} ${styles.panelControlMin}`}
                    title="Minimizar panel"
                    onClick={handleToggleMinimizar}
                  >
                    –
                  </button>
                  <button
                    type="button"
                    className={`${styles.panelControlBtn} ${styles.panelControlClose}`}
                    title="Cerrar panel"
                    onClick={handleCerrarPanel}
                  >
                    ×
                  </button>
                </div>
              </header>

              <section className={styles.routeListByEmpresa}>
                <h3>Rutas disponibles</h3>
                <ul className={styles.routeCardsList}>
                  {rutas
                    .filter((r) => !empresaId || r.empresaId === empresaId)
                    .map((r) => (
                      <li
                        key={r.id}
                        className={`${styles.routeCardItem} ${styles.clickableCard}`}
                        onClick={() => handleSelectRoute(r.id)}
                      >
                        <h4 className={styles.routeName}>{r.nombre}</h4>
                        <div className={styles.routeEndpointsMini}>
                          <span>Origen: {r.origen}</span>
                          <span>Destino: {r.destino}</span>
                        </div>
                        {(r.costoMinimo !== undefined || r.costoMaximo !== undefined) && (
                          <div className={styles.routeCostMini}>
                            {r.costoMinimo !== undefined && (
                              <span>Mín: {r.moneda ?? 'MXN'} {r.costoMinimo}</span>
                            )}
                            {r.costoMaximo !== undefined && (
                              <span>Máx: {r.moneda ?? 'MXN'} {r.costoMaximo}</span>
                            )}
                          </div>
                        )}
                      </li>
                  ))}
                </ul>
              </section>
            </aside>
          ) : (
            (loadingRouteDetails && (
              <aside className={styles.routeDetailsPanel}>
                <header className={styles.routeDetailsHeader}>
                  <span className={styles.routeDetailsBadge}>Cargando</span>
                  <h2>Cargando detalles de la ruta...</h2>
                </header>
              </aside>
            )) || (selectedRouteDetails && !panelMinimizado && (
              <aside className={styles.routeDetailsPanel}>
                <header className={styles.routeDetailsHeader}>
                  <span className={styles.routeDetailsBadge}>Ruta seleccionada</span>
                  <h2>{selectedRoute?.nombre ?? selectedRouteDetails.nombre}</h2>
                  <div className={styles.panelControls}>
                    <button
                      type="button"
                      className={`${styles.panelControlBtn} ${styles.panelControlMin}`}
                      title="Minimizar panel"
                      onClick={handleToggleMinimizar}
                    >
                      –
                    </button>
                    <button
                      type="button"
                      className={`${styles.panelControlBtn} ${styles.panelControlClose}`}
                      title="Cerrar panel"
                      onClick={handleCerrarPanel}
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.routeEndpoints}>
                    <div>
                      <span className={styles.routeMetaLabel}>Origen</span>
                      <p>{selectedRouteDetails.paradas[0]}</p>
                    </div>
                    <div>
                      <span className={styles.routeMetaLabel}>Destino</span>
                      <p>{selectedRouteDetails.paradas.slice(-1)[0]}</p>
                    </div>
                  </div>
                </header>

                <section className={styles.routeCostSection}>
                  <div>
                    <span className={styles.routeCostLabel}>Pasaje mínimo</span>
                    <p className={styles.routeCostValue}>
                      {selectedRouteDetails.moneda} {selectedRouteDetails.costoMinimo}
                    </p>
                  </div>
                  <div>
                    <span className={styles.routeCostLabel}>Pasaje máximo</span>
                    <p className={styles.routeCostValue}>
                      {selectedRouteDetails.moneda} {selectedRouteDetails.costoMaximo}
                    </p>
                  </div>
                </section>

                <section className={styles.routeMetaInfo}>
                  <div>
                    <span className={styles.routeMetaLabel}>Duración</span>
                    <p>{selectedRouteDetails.duracion}</p>
                  </div>
                  <div>
                    <span className={styles.routeMetaLabel}>Frecuencia</span>
                    <p>{selectedRouteDetails.frecuencia}</p>
                  </div>
                </section>

                <section className={styles.routeStopsSection}>
                  <h3>Paradas</h3>
                  <ol className={styles.routeStopsList}>
                    {selectedRouteDetails.paradas.map((stop, i) => (
                      <li key={i}>
                        <span className={styles.stopIndex}>{i + 1}</span>
                        <span className={styles.stopName}>{stop}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                {selectedRouteDetails.notas && (
                  <footer className={styles.routeNotes}>
                    <h4>Notas</h4>
                    <p>{selectedRouteDetails.notas}</p>
                  </footer>
                )}
              </aside>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProtectedHomePage() {
  return (
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  );
}
