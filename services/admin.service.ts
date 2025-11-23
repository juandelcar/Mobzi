/**
 * Servicio de Administración
 * Funciones para interactuar con el backend de administración
 */

import api, { ApiResponse } from '../lib/api.client';

// ============================================
// Tipos
// ============================================
export interface UsuarioAdmin {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
  tipoUsuario: string;
  rutasRegistradas: number;
  activo: boolean;
}

export interface RutaAdmin {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  municipio: string;
  empresa: string;
  costoMinimo: number;
  costoMaximo: number;
  moneda: string;
  duracion: string;
  frecuencia: string;
  paradas: string[];
  coordenadas: [number, number][];
  horarios: Array<{ dia: string; salidas: string[] }>;
  usuariosRegistrados: number;
  fechaCreacion: string;
  activa: boolean;
  notas?: string;
}

// ============================================
// Obtener todos los usuarios
// ============================================
export const getUsuarios = async (): Promise<ApiResponse<UsuarioAdmin[]>> => {
  return await api.get<UsuarioAdmin[]>('/admin/usuarios', {
    requireAuth: true,
  });
};

// ============================================
// Obtener todas las rutas
// ============================================
export const getRutas = async (): Promise<ApiResponse<RutaAdmin[]>> => {
  return await api.get<RutaAdmin[]>('/admin/rutas', {
    requireAuth: true,
  });
};

export const createRuta = async (data: {
  nombre: string;
  origen: string;
  destino: string;
  municipioId: string;
  empresaId: string;
  costoMinimo: number;
  costoMaximo: number;
  moneda?: string;
  duracion?: string;
  frecuencia?: string;
  activa?: boolean;
  notas?: string;
  paradas?: string[];
  coordenadas?: [number, number][];
  horarios?: Array<{ dia: string; salidas: string[] }>;
}): Promise<ApiResponse<RutaAdmin>> => {
  const payload = {
    nombre: data.nombre,
    origen: data.origen,
    destino: data.destino,
    municipioId: data.municipioId,
    empresaId: data.empresaId,
    costoMinimo: data.costoMinimo,
    costoMaximo: data.costoMaximo,
    moneda: data.moneda ?? 'MXN',
    duracion: data.duracion,
    frecuencia: data.frecuencia,
    activa: data.activa ?? true,
    notas: data.notas,
    paradas: data.paradas,
    coordenadas: data.coordenadas,
    horarios: data.horarios,
  };
  return await api.post<RutaAdmin>('/admin/rutas', payload, { requireAuth: true });
};

export const updateRuta = async (
  id: string,
  data: {
    nombre?: string;
    origen?: string;
    destino?: string;
    municipioId?: string;
    empresaId?: string;
    costoMinimo?: number;
    costoMaximo?: number;
    moneda?: string;
    duracion?: string;
    frecuencia?: string;
    activa?: boolean;
    notas?: string;
    paradas?: string[];
    coordenadas?: [number, number][];
    horarios?: Array<{ dia: string; salidas: string[] }>;
  }
): Promise<ApiResponse<RutaAdmin>> => {
  return await api.put<RutaAdmin>(`/admin/rutas/${id}`, data, { requireAuth: true });
};

export const deleteRuta = async (id: string): Promise<ApiResponse<void>> => {
  return await api.delete<void>(`/admin/rutas/${id}`, { requireAuth: true });
};

export interface EmpresaAdmin {
  id: string;
  nombre: string;
  municipio_id: string;
  telefono?: string | null;
  email?: string | null;
  activa: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export const getEmpresas = async (): Promise<ApiResponse<EmpresaAdmin[]>> => {
  return await api.get<EmpresaAdmin[]>('/admin/empresas', { requireAuth: true });
};

export const createEmpresa = async (empresa: {
  nombre: string;
  municipioId: string;
  telefono?: string | null;
  email?: string | null;
  activa?: boolean;
}): Promise<ApiResponse<EmpresaAdmin>> => {
  return await api.post<EmpresaAdmin>('/admin/empresas', empresa, { requireAuth: true });
};

export const updateEmpresa = async (
  id: string,
  updates: {
    nombre?: string;
    municipioId?: string;
    telefono?: string | null;
    email?: string | null;
    activa?: boolean;
  }
): Promise<ApiResponse<EmpresaAdmin>> => {
  return await api.put<EmpresaAdmin>(`/admin/empresas/${id}`, updates, { requireAuth: true });
};

export const deleteEmpresa = async (id: string): Promise<ApiResponse<void>> => {
  return await api.delete<void>(`/admin/empresas/${id}`, { requireAuth: true });
};

export const getUsuariosConRutas = async (): Promise<ApiResponse<Array<{ id: string; rutas_nombres?: string }>>> => {
  return await api.get<Array<{ id: string; rutas_nombres?: string }>>('/admin/usuarios/rutas', { requireAuth: true });
};

export const setUsuarioActivo = async (id: string, activo: boolean): Promise<ApiResponse<{ id: string }>> => {
  return await api.patch<{ id: string }>(`/admin/usuarios/${id}/activo`, { activo }, { requireAuth: true });
};

export const deleteUsuario = async (id: string): Promise<ApiResponse<void>> => {
  return await api.delete<void>(`/admin/usuarios/${id}`, { requireAuth: true });
};

const AdminService = {
  getUsuarios,
  getRutas,
  createRuta,
  updateRuta,
  deleteRuta,
  getEmpresas,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  getUsuariosConRutas,
  setUsuarioActivo,
  deleteUsuario,
};

export default AdminService;

