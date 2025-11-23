/**
 * Servicio Público
 * Funciones para interactuar con endpoints públicos del backend
 */

import api, { ApiResponse } from '../lib/api.client';

// ============================================
// Tipos
// ============================================
export interface Municipio {
  id: string;
  nombre: string;
  centro: { lng: number; lat: number };
}

export interface RutaPublica {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  empresaId?: string;
  costoMinimo?: number;
  costoMaximo?: number;
  moneda?: string;
}

export interface EmpresaPublica {
  id: string;
  nombre: string;
}

export interface RutaDetails {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  costoMinimo: number;
  costoMaximo: number;
  moneda: string;
  duracion: string;
  frecuencia: string;
  paradas: string[];
  coordenadas: [number, number][];
  horarios: Array<{ dia: string; salidas: string[] }>;
  notas?: string;
}

let municipiosCache: Municipio[] | null = null;
let municipiosCacheAt = 0;
let municipiosPending: Promise<ApiResponse<Municipio[]>> | null = null;
const MUNICIPIOS_TTL = 300000;

// ============================================
// Obtener todos los municipios
// ============================================
export const getMunicipios = async (): Promise<ApiResponse<Municipio[]>> => {
  if (municipiosCache && Date.now() - municipiosCacheAt < MUNICIPIOS_TTL) {
    return { success: true, data: municipiosCache };
  }
  if (municipiosPending) {
    return municipiosPending;
  }
  municipiosPending = api.get<Municipio[]>('/municipios')
    .then((res) => {
      if (res.success && res.data) {
        municipiosCache = res.data;
        municipiosCacheAt = Date.now();
      }
      municipiosPending = null;
      return res;
    })
    .catch((e) => {
      municipiosPending = null;
      throw e;
    });
  return municipiosPending;
};

// ============================================
// Obtener rutas por municipio
// ============================================
export const getRutasByMunicipio = async (
  municipioId: string
): Promise<ApiResponse<RutaPublica[]>> => {
  const id = (municipioId || '').trim() || 'huamantla';
  return await api.get<RutaPublica[]>(`/rutas?municipio=${encodeURIComponent(id)}`);
};

// ============================================
// Obtener empresas por municipio
// ============================================
export const getEmpresasByMunicipio = async (
  municipioId: string
): Promise<ApiResponse<EmpresaPublica[]>> => {
  const id = (municipioId || '').trim() || 'huamantla';
  return await api.get<EmpresaPublica[]>(`/empresas?municipio=${encodeURIComponent(id)}`);
};

// ============================================
// Obtener detalles de una ruta específica
// ============================================
export const getRutaDetails = async (rutaId: string): Promise<ApiResponse<RutaDetails>> => {
  return await api.get<RutaDetails>(`/rutas/${rutaId}`);
};

const PublicService = {
  getMunicipios,
  getRutasByMunicipio,
  getEmpresasByMunicipio,
  getRutaDetails,
};

export default PublicService;

