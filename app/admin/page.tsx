"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { ZipWriter, BlobWriter, TextReader, BlobReader } from "@zip.js/zip.js";
import styles from "./admin.module.css";
import Menu from "@/app/menu/Menu";
import ProtectedRoute from "@/components/ProtectedRoute";
import * as adminService from "@/services/admin.service";
import * as publicService from "@/services/public.service";

// Tipos de datos
type Usuario = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
  tipoUsuario: string;
  rutasRegistradas: number;
  activo: boolean;
};

type Ruta = {
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
};

type TabType = "rutas" | "usuarios" | "empresas" | "descargas";

const loadLogoDataUrl = (path: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = path;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("No se pudo crear el contexto del canvas"));
        return;
      }
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("No se pudo cargar el logotipo de MOBZI"));
  });

function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("rutas");
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<adminService.EmpresaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRutaForm, setShowRutaForm] = useState(false);
  const [showRutaUpload, setShowRutaUpload] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewRoutes, setPreviewRoutes] = useState<Array<{ nombre: string; origen: string; destino: string; paradas: string[]; horarios: Array<{ dia: string; salidas: string[] }> }>>([]);
  type RutaCreateInput = Parameters<typeof adminService.createRuta>[0];
  const [importPayloads, setImportPayloads] = useState<RutaCreateInput[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [searchRutas, setSearchRutas] = useState("");
  const [searchUsuarios, setSearchUsuarios] = useState("");
  const [searchEmpresas, setSearchEmpresas] = useState("");
  const [paradasInput, setParadasInput] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [showEmpresaForm, setShowEmpresaForm] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<adminService.EmpresaAdmin | null>(null);
  const [empresaForm, setEmpresaForm] = useState<{ id?: string; nombre?: string; municipioId?: string; telefono?: string; email?: string; activa?: boolean }>({});
  const empresaFileInputRef = useRef<HTMLInputElement>(null);
  const [empresaDragActive, setEmpresaDragActive] = useState(false);
  const [empresaImportBusy, setEmpresaImportBusy] = useState(false);
  const [empresaImportMessage, setEmpresaImportMessage] = useState<string | null>(null);
  const [selectedEmpresaFileName, setSelectedEmpresaFileName] = useState<string | null>(null);
  const [importEmpresaPayloads, setImportEmpresaPayloads] = useState<Array<{ nombre: string; municipioId: string; telefono?: string | null; email?: string | null; activa?: boolean }>>([]);
  const [previewEmpresas, setPreviewEmpresas] = useState<Array<{ nombre: string; municipio: string; telefono?: string; email?: string; activa?: boolean }>>([]);
  const [empresaSelectedIndices, setEmpresaSelectedIndices] = useState<Set<number>>(new Set());
  const [rutasImportDone, setRutasImportDone] = useState(false);
  const [empresaImportDone, setEmpresaImportDone] = useState(false);

  const [rutasPage, setRutasPage] = useState(1);
  const [rutasPageSize, setRutasPageSize] = useState(10);
  const [usuariosPage, setUsuariosPage] = useState(1);
  const [usuariosPageSize, setUsuariosPageSize] = useState(10);
  const [empresasPage, setEmpresasPage] = useState(1);
  const [empresasPageSize, setEmpresasPageSize] = useState(10);

  // Formulario de ruta
  const [rutaForm, setRutaForm] = useState<Partial<Ruta> & { municipioId?: string; empresaId?: string }>({
    nombre: "",
    origen: "",
    destino: "",
    municipio: "Huamantla",
    empresa: "",
    costoMinimo: 0,
    costoMaximo: 0,
    moneda: "MXN",
    duracion: "",
    frecuencia: "",
    paradas: [],
    coordenadas: [],
    horarios: [],
    usuariosRegistrados: 0,
    fechaCreacion: new Date().toISOString().split("T")[0],
    activa: true,
    notas: "",
  });
  const [municipiosOptions, setMunicipiosOptions] = useState<Array<{ id: string; nombre: string }>>([]);
  const [empresasOptions, setEmpresasOptions] = useState<Array<{ id: string; nombre: string }>>([]);

  // Cargar datos desde el backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [rutasResponse, usuariosResponse, empresasResponse] = await Promise.all([
          adminService.getRutas(),
          adminService.getUsuarios(),
          adminService.getEmpresas(),
        ]);

        if (rutasResponse.success && rutasResponse.data) {
          setRutas(rutasResponse.data);
        }
        if (empresasResponse.success && empresasResponse.data) {
          setEmpresas(empresasResponse.data);
        }

        if (usuariosResponse.success && usuariosResponse.data) {
          setUsuarios(usuariosResponse.data);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  useEffect(() => {
    const loadMunicipios = async () => {
      try {
        const resp = await publicService.getMunicipios();
        if (resp.success && resp.data) {
          setMunicipiosOptions(resp.data);
          const data = resp.data;
          setRutaForm((prev) => ({
            ...prev,
            municipioId:
              prev.municipioId || data.find((m) => m.id === "huamantla")?.id || data[0]?.id || "huamantla",
          }));
        }
      } catch (error) {
        console.error("Error al cargar municipios:", error);
      }
    };
    loadMunicipios();
  }, []);
  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        if (!rutaForm.municipioId) {
          setEmpresasOptions([]);
          return;
        }
        const resp = await publicService.getEmpresasByMunicipio(rutaForm.municipioId);
        if (resp.success && resp.data) {
          setEmpresasOptions(resp.data);
          const data = resp.data;
          setRutaForm((prev) => ({
            ...prev,
            empresaId: prev.empresaId || data[0]?.id,
          }));
        }
      } catch (error) {
        console.error("Error al cargar empresas:", error);
      }
    };
    loadEmpresas();
  }, [rutaForm.municipioId]);




  useEffect(() => {
    loadLogoDataUrl("/square_logo.png")
      .then(setLogoDataUrl)
      .catch(() => setLogoDataUrl(null));
  }, []);

  // Funciones de gestión de rutas
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCreateRuta = () => {
    setRutaForm({
      nombre: "",
      origen: "",
      destino: "",
      municipio: "",
      empresa: "",
      costoMinimo: 0,
      costoMaximo: 0,
      moneda: "MXN",
      duracion: "",
      frecuencia: "",
      paradas: [],
      coordenadas: [],
      horarios: [],
      usuariosRegistrados: 0,
      fechaCreacion: new Date().toISOString().split("T")[0],
      activa: true,
      notas: "",
      municipioId: municipiosOptions.find((m) => m.id === "huamantla")?.id || municipiosOptions[0]?.id || "huamantla",
      empresaId: undefined,
    });
    setParadasInput("");
    setShowRutaForm(true);
  };

  const handleImportSelected = () => {
    (async () => {
      setUploadBusy(true);
      try {
        let imported = 0;
        for (let i = 0; i < importPayloads.length; i++) {
          if (!selectedIndices.has(i)) continue;
          const resp = await adminService.createRuta(importPayloads[i]);
          if (resp.success) imported++;
          setUploadMessage(`Importadas ${imported}/${selectedIndices.size}`);
        }
        const rutasResp = await adminService.getRutas();
        if (rutasResp.success && rutasResp.data) setRutas(rutasResp.data);
        setUploadMessage('Importación completada');
      } catch {
        setUploadMessage('Error al importar seleccionadas');
      } finally {
        setUploadBusy(false);
      }
    })();
  };



  const handleDeleteRuta = (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta ruta?")) return;
    (async () => {
      try {
        const resp = await adminService.deleteRuta(id);
        if (resp.success) {
          const rutasResp = await adminService.getRutas();
          if (rutasResp.success && rutasResp.data) {
            setRutas(rutasResp.data);
          } else {
            setRutas((prev) => prev.filter((r) => r.id !== id));
          }
        } else {
          alert(resp.message || 'No se pudo eliminar la ruta');
        }
      } catch (error) {
        console.error('Error al eliminar ruta:', error);
        alert('Error al eliminar la ruta');
      }
    })();
  };

  const handleToggleRutaActiva = (id: string) => {
    (async () => {
      try {
        const ruta = rutas.find((r) => r.id === id);
        if (!ruta) return;
        const nuevoEstado = !ruta.activa;
        const resp = await adminService.updateRuta(id, { activa: nuevoEstado });
        if (!resp.success) {
          alert(resp.message || 'No se pudo actualizar el estado de la ruta');
          return;
        }
        const rutasResp = await adminService.getRutas();
        if (rutasResp.success && rutasResp.data) {
          setRutas(rutasResp.data);
        } else {
          setRutas((prev) => prev.map((r) => (r.id === id ? { ...r, activa: nuevoEstado } : r)));
        }
      } catch (error) {
        console.error('Error al actualizar estado de ruta:', error);
        alert('Error al actualizar el estado de la ruta');
      }
    })();
  };

  const handleProcessImportFile = async (file: File) => {
    setUploadBusy(true);
    setUploadMessage(null);
    setSelectedFileName(file.name);
    setPreviewRoutes([]);
    try {
      const ext = (file.name.toLowerCase().split('.').pop() || '');
      if (!['json','csv','xlsx','sql'].includes(ext)) { setUploadMessage('Formato no permitido'); return; }
      const toStr = (v: unknown) => String(v ?? '');
      const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(toStr(v)));
      const norm = (o: Record<string, unknown>): [number, number] => { let lng = toNum(o.lng); let lat = toNum(o.lat); if (Math.abs(lat) > 90 && Math.abs(lng) < 90) { const t = lng; lng = lat; lat = t; } return [lng, lat]; };
      type RutaCreateInput = Parameters<typeof adminService.createRuta>[0];
      const buildPayload = async (data: Record<string, unknown>): Promise<RutaCreateInput | null> => {
        const origenRaw = data.origen as (Record<string, unknown> | string | undefined);
        const destinoRaw = data.destino as (Record<string, unknown> | string | undefined);
        const originName = typeof origenRaw === 'string' ? origenRaw : toStr(origenRaw?.nombre) || 'Origen';
        const destName = typeof destinoRaw === 'string' ? destinoRaw : toStr(destinoRaw?.nombre) || 'Destino';
        const originCoord: [number, number] = origenRaw && typeof origenRaw === 'object' ? norm(origenRaw as Record<string, unknown>) : [0,0];
        const destCoord: [number, number] = destinoRaw && typeof destinoRaw === 'object' ? norm(destinoRaw as Record<string, unknown>) : [0,0];
        const paradasRaw = data.paradas as unknown;
        const middle = Array.isArray(paradasRaw) ? (paradasRaw as unknown[]).map((p) => ({ nombre: toStr((p as Record<string, unknown>).nombre), coord: norm(p as Record<string, unknown>) as [number, number] })) : [];
        const paradas = [originName, ...middle.map((p) => p.nombre), destName];
        const coordenadas: [number, number][] = [originCoord, ...middle.map((p) => p.coord), destCoord];
        let municipioId = (data.municipioId ? toStr(data.municipioId) : undefined);
        let empresaId = (data.empresaId ? toStr(data.empresaId) : undefined);
        if (!municipioId) {
          const mun = await publicService.getMunicipios();
          const municipioNombre = toStr(data.municipio).toLowerCase();
          municipioId = mun.success && mun.data ? mun.data.find((m: { id: string; nombre: string }) => m.nombre.toLowerCase() === municipioNombre)?.id : undefined;
        }
        if (!municipioId) { setUploadMessage('Municipio no encontrado'); return null; }
        if (!empresaId) {
          const emp = await publicService.getEmpresasByMunicipio(municipioId);
          const empresaNombre = toStr(data.empresa).toLowerCase();
          empresaId = emp.success && emp.data ? emp.data.find((e: { id: string; nombre: string }) => e.nombre.toLowerCase() === empresaNombre)?.id : undefined;
        }
        if (!empresaId) { setUploadMessage('Empresa no encontrada'); return null; }
        return {
          nombre: toStr(data.nombre),
          origen: originName,
          destino: destName,
          municipioId,
          empresaId,
          costoMinimo: toNum(data.costoMinimo ?? 0),
          costoMaximo: toNum(data.costoMaximo ?? 0),
          moneda: toStr(data.moneda || 'MXN'),
          duracion: toStr(data.duracion || ''),
          frecuencia: toStr(data.frecuencia || ''),
          activa: Boolean(data.activa ?? true),
          notas: toStr(data.notas || ''),
          paradas,
          coordenadas,
          horarios: Array.isArray(data.horarios as unknown[]) ? (data.horarios as unknown[]).map((h) => ({ dia: toStr((h as Record<string, unknown>).dia), salidas: Array.isArray((h as Record<string, unknown>).salidas as unknown[]) ? ((h as Record<string, unknown>).salidas as unknown[]).map(toStr) : [] })) : [],
        };
      };
      const payloads: RutaCreateInput[] = [];
      const previews: Array<{ nombre: string; origen: string; destino: string; paradas: string[]; horarios: Array<{ dia: string; salidas: string[] }> }> = [];
      if (ext === 'json') {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of list) {
          const d = item as Record<string, unknown>;
          const p = await buildPayload(d);
          if (p) {
            payloads.push(p);
            const origenRaw = d.origen as (Record<string, unknown> | string | undefined);
            const destinoRaw = d.destino as (Record<string, unknown> | string | undefined);
            const origenNombre = typeof origenRaw === 'string' ? origenRaw : toStr(origenRaw?.nombre);
            const destinoNombre = typeof destinoRaw === 'string' ? destinoRaw : toStr(destinoRaw?.nombre);
            const paradasRaw = d.paradas as unknown;
            const paradasPrev = Array.isArray(paradasRaw) ? (paradasRaw as unknown[]).map((x) => toStr((x as Record<string, unknown>).nombre)) : [];
            const horariosPrev = Array.isArray(d.horarios as unknown[]) ? (d.horarios as unknown[]).map((h) => ({ dia: toStr((h as Record<string, unknown>).dia), salidas: Array.isArray((h as Record<string, unknown>).salidas as unknown[]) ? ((h as Record<string, unknown>).salidas as unknown[]).map(toStr) : [] })) : [];
            previews.push({ nombre: toStr(d.nombre), origen: origenNombre, destino: destinoNombre, paradas: paradasPrev, horarios: horariosPrev });
          }
        }
      } else if (ext === 'csv') {
        const text = await file.text();
        const lines = text.trim().split(/\r?\n/);
        const headers = lines[0].split(',').map((h) => h.trim());
        for (let li = 1; li < lines.length; li++) {
          const row = lines[li] || '';
          if (!row.trim()) continue;
          const vals: string[] = []; let cur=''; let inQ=false;
          for (let i=0;i<row.length;i++){ const ch=row[i]; if(ch==='"'){ inQ=!inQ; } else if(ch===',' && !inQ){ vals.push(cur); cur=''; } else { cur+=ch; } } vals.push(cur);
          const get = (name: string) => vals[headers.indexOf(name)]?.replace(/^"|"$/g,'').trim();
          const stopsStr = get('stops') || '';
          const stops = stopsStr.split(';').filter(Boolean).map(s=>{ const [nombre,lng,lat]=s.split('|'); return { nombre, lng:Number(lng), lat:Number(lat) }; });
          const d: Record<string, unknown> = {
            nombre: get('nombre'), municipio: get('municipio'), empresa: get('empresa'),
            origen: { nombre: get('origen_nombre'), lng: Number(get('origen_lng')), lat: Number(get('origen_lat')) },
            destino: { nombre: get('destino_nombre'), lng: Number(get('destino_lng')), lat: Number(get('destino_lat')) },
            costoMinimo: Number(get('costoMinimo')||0), costoMaximo: Number(get('costoMaximo')||0), moneda: get('moneda')||'MXN', duracion: get('duracion')||'', frecuencia: get('frecuencia')||'', activa: String(get('activa')).toLowerCase()==='true', notas: get('notas')||'', paradas: stops, horarios: []
          };
          const p = await buildPayload(d);
          if (p) {
            payloads.push(p);
            previews.push({ nombre: toStr(d.nombre), origen: toStr((d.origen as Record<string, unknown>).nombre), destino: toStr((d.destino as Record<string, unknown>).nombre), paradas: stops.map((s)=>toStr(s.nombre)), horarios: [] });
          }
        }
      } else if (ext === 'xlsx') {
        const ab = await file.arrayBuffer();
        const wb = XLSX.read(ab);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
        const headers = ((rows[0] as unknown[])||[]).map((h)=>String(h));
        const idx=(n:string)=>headers.indexOf(n);
        for (let ri = 1; ri < rows.length; ri++) {
          const vals = rows[ri]||[];
          if (!vals || vals.length === 0) continue;
          const get=(n:string)=>String(vals[idx(n)] ?? '').trim();
          const stopsStr = get('stops');
          const stops = stopsStr.split(';').filter(Boolean).map(s=>{ const [nombre,lng,lat]=s.split('|'); return { nombre, lng:Number(lng), lat:Number(lat) }; });
          const d: Record<string, unknown> = {
            nombre: get('nombre'), municipio: get('municipio'), empresa: get('empresa'),
            origen: { nombre: get('origen_nombre'), lng: Number(get('origen_lng')), lat: Number(get('origen_lat')) },
            destino: { nombre: get('destino_nombre'), lng: Number(get('destino_lng')), lat: Number(get('destino_lat')) },
            costoMinimo: Number(get('costoMinimo')||0), costoMaximo: Number(get('costoMaximo')||0), moneda: get('moneda')||'MXN', duracion: get('duracion')||'', frecuencia: get('frecuencia')||'', activa: String(get('activa')).toLowerCase()==='true', notas: get('notas')||'', paradas: stops, horarios: []
          };
          const p = await buildPayload(d);
          if (p) {
            payloads.push(p);
            previews.push({ nombre: toStr(d.nombre), origen: toStr((d.origen as Record<string, unknown>).nombre), destino: toStr((d.destino as Record<string, unknown>).nombre), paradas: stops.map((s)=>toStr(s.nombre)), horarios: [] });
          }
        }
      } else if (ext === 'sql') {
        const text = await file.text();
        const pickColsVals = (stmt: string) => { const colsMatch = stmt.match(/\(([^)]*)\)\s*VALUES\s*\(([^)]*)\)/i); if(!colsMatch) return null; const cols = colsMatch[1].split(',').map(s=>s.trim()); const raw = colsMatch[2]; const vals: string[]=[]; let cur=''; let inQ=false; for(let i=0;i<raw.length;i++){ const ch=raw[i]; if(ch==="'"){ inQ=!inQ; cur+=ch; } else if(ch===',' && !inQ){ vals.push(cur.trim()); cur=''; } else { cur+=ch; } } vals.push(cur.trim()); const clean=(v:string)=>v.replace(/^'|'$|^"|"$/g,''); return { cols, vals: vals.map(clean) }; };
        const rutaStmt = text.match(/INSERT\s+INTO\s+rutas[\s\S]*?VALUES\s*\([^)]*\)/i)?.[0] || '';
        const pStmtAll = [...text.matchAll(/INSERT\s+INTO\s+paradas[\s\S]*?VALUES\s*\([^)]*\)/ig)].map(m=>m[0]);
        let data: Record<string, unknown> = {};
        if (rutaStmt) { const pv = pickColsVals(rutaStmt)!; const g=(n:string)=>pv.vals[pv.cols.indexOf(n)] || ''; data = { nombre: g('nombre'), municipio: g('municipio'), empresa: g('empresa'), origen: { nombre: g('origen_nombre'), lng:Number(g('origen_lng')), lat:Number(g('origen_lat')) }, destino: { nombre: g('destino_nombre'), lng:Number(g('destino_lng')), lat:Number(g('destino_lat')) }, costoMinimo:Number(g('costo_minimo')||0), costoMaximo:Number(g('costo_maximo')||0), moneda:g('moneda')||'MXN', duracion:g('duracion')||'', frecuencia:g('frecuencia')||'', activa:String(g('activa')).toLowerCase()==='true', notas:g('notas')||'', paradas: [], horarios: [] };
        }
        const stops: Array<{ nombre: string; lng: number; lat: number }> = [];
        for(const s of pStmtAll){ const pv = pickColsVals(s)!; const get=(n:string)=>pv.vals[pv.cols.indexOf(n)] || ''; stops.push({ nombre: get('nombre') || pv.vals[1], lng: Number(get('coordenada_lng')||pv.vals[3]), lat: Number(get('coordenada_lat')||pv.vals[4]) }); }
        data.paradas = stops;
        if (!data.origen && stops.length){ data.origen = { nombre: stops[0].nombre, lng: stops[0].lng, lat: stops[0].lat }; }
        if (!data.destino && stops.length){ const last = stops[stops.length-1]; data.destino = { nombre: last.nombre, lng: last.lng, lat: last.lat }; }
        const p = await buildPayload(data);
        if (p) {
          payloads.push(p);
          previews.push({ nombre: toStr(data.nombre), origen: toStr(((data.origen as Record<string, unknown>)?.nombre)), destino: toStr(((data.destino as Record<string, unknown>)?.nombre)), paradas: stops.map((x)=>toStr(x.nombre)), horarios: [] });
        }
      }
      if (payloads.length === 0) return;
      setImportPayloads(payloads);
      setPreviewRoutes(previews);
      setSelectedIndices(new Set(previews.map((_, i) => i)));
      setUploadMessage('Listo para importar');
    } catch {
      setUploadMessage('Archivo inválido o error al importar');
    } finally {
      setUploadBusy(false);
    }
  };

  // Funciones de gestión de usuarios
  const handleToggleUsuarioActivo = (id: string) => {
    (async () => {
      try {
        const usuario = usuarios.find((u) => u.id === id);
        if (!usuario) return;
        const nuevoEstado = !usuario.activo;
        const resp = await adminService.setUsuarioActivo(id, nuevoEstado);
        if (!resp.success) {
          alert(resp.message || 'No se pudo actualizar el estado del usuario');
          return;
        }
        const usuariosResp = await adminService.getUsuarios();
        if (usuariosResp.success && usuariosResp.data) {
          setUsuarios(usuariosResp.data);
        } else {
          setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, activo: nuevoEstado } : u)));
        }
      } catch (error) {
        console.error('Error al actualizar estado de usuario:', error);
        alert('Error al actualizar el estado del usuario');
      }
    })();
  };

  const handleDeleteUsuario = (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
    (async () => {
      try {
        const resp = await adminService.deleteUsuario(id);
        if (resp.success) {
          const usuariosResp = await adminService.getUsuarios();
          if (usuariosResp.success && usuariosResp.data) {
            setUsuarios(usuariosResp.data);
          } else {
            setUsuarios((prev) => prev.filter((u) => u.id !== id));
          }
        } else {
          alert(resp.message || 'No se pudo eliminar el usuario');
        }
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert('Error al eliminar el usuario');
      }
    })();
  };

  const handleDeleteEmpresa = (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta empresa?")) return;
    if (!confirm("Esta acción eliminará TODAS las rutas de la empresa y sus datos relacionados. ¿Confirmas la eliminación definitiva?")) return;
    (async () => {
      try {
        const resp = await adminService.deleteEmpresa(id);
        if (resp.success) {
          const empresasResp = await adminService.getEmpresas();
          if (empresasResp.success && empresasResp.data) {
            setEmpresas(empresasResp.data);
          } else {
            setEmpresas((prev) => prev.filter((e) => e.id !== id));
          }
          const rutasResp = await adminService.getRutas();
          if (rutasResp.success && rutasResp.data) {
            setRutas(rutasResp.data);
          } else {
            setRutas((prev) => prev.filter((r) => r.empresa !== id && r.empresa !== (empresas.find((e) => e.id === id)?.nombre || id)));
          }
        } else {
          alert(resp.message || 'No se pudo eliminar la empresa');
        }
      } catch (error) {
        console.error('Error al eliminar empresa:', error);
        alert('Error al eliminar la empresa');
      }
    })();
  };

  const handleSaveEmpresa = () => {
    if (!empresaForm.nombre || !empresaForm.municipioId) {
      alert('Completa Nombre y Municipio');
      return;
    }
    (async () => {
      try {
        if (editingEmpresa) {
          // EDITAR EMPRESA
          const resp = await adminService.updateEmpresa(editingEmpresa.id, {
            nombre: empresaForm.nombre,
            municipioId: empresaForm.municipioId,
            telefono: empresaForm.telefono || null,
            email: empresaForm.email || null,
            activa: empresaForm.activa,
          });
          if (!resp.success) {
            alert(resp.message || 'No se pudo actualizar la empresa');
            return;
          }
        } else {
          if (!empresaForm.nombre || !empresaForm.municipioId) {
            alert('Por favor completa los campos obligatorios (nombre y municipio)');
            return;
          }
          const resp = await adminService.createEmpresa({
            nombre: empresaForm.nombre,
            municipioId: empresaForm.municipioId,
            telefono: empresaForm.telefono || null,
            email: empresaForm.email || null,
            activa: empresaForm.activa ?? true,
          });
          if (!resp.success) {
            alert(resp.message || 'No se pudo crear la empresa');
            return;
          }
        }
        const empresasResp = await adminService.getEmpresas();
        if (empresasResp.success && empresasResp.data) {
          setEmpresas(empresasResp.data);
        }
        setShowEmpresaForm(false);
        setEditingEmpresa(null);
      } catch (error) {
        console.error('Error al guardar empresa:', error);
        alert('Error al guardar la empresa');
      }
    })();
  };
  const resetRutaImport = () => {
    setUploadBusy(false);
    setUploadMessage('Listo');
    setSelectedFileName(null);
    setPreviewRoutes([]);
    setImportPayloads([]);
    setSelectedIndices(new Set());
    setDragActive(false);
    setRutasImportDone(false);
  };
  const resetEmpresaImport = () => {
    setEmpresaImportBusy(false);
    setEmpresaImportMessage('Listo');
    setSelectedEmpresaFileName(null);
    setPreviewEmpresas([]);
    setImportEmpresaPayloads([]);
    setEmpresaSelectedIndices(new Set());
    setEmpresaDragActive(false);
    setEmpresaImportDone(false);
  };

  const handleProcessEmpresaImportFile = async (file: File) => {
    setEmpresaImportBusy(true);
    setEmpresaImportMessage(null);
    setSelectedEmpresaFileName(file.name);
    setPreviewEmpresas([]);
    try {
      const ext = (file.name.toLowerCase().split('.').pop() || '');
      if (!['json','csv','xlsx','sql'].includes(ext)) { setEmpresaImportMessage('Formato no permitido'); return; }
      const toStr = (v: unknown) => String(v ?? '').trim();
      const toBool = (v: unknown) => {
        const s = toStr(v).toLowerCase();
        return s === 'true' || s === '1' || s === 'sí' || s === 'si';
      };
      const resolveMunicipioId = async (rawId?: string, rawNombre?: string) => {
        const id = rawId ? toStr(rawId) : '';
        if (id) return id;
        const nombre = toStr(rawNombre);
        const mun = await publicService.getMunicipios();
        if (mun.success && mun.data) {
          const found = mun.data.find((m) => m.nombre.toLowerCase() === nombre.toLowerCase());
          if (found) return found.id;
        }
        return 'huamantla';
      };
      type EmpresaCreate = Parameters<typeof adminService.createEmpresa>[0];
      const payloads: EmpresaCreate[] = [];
      const previews: Array<{ nombre: string; municipio: string; telefono?: string; email?: string; activa?: boolean }> = [];

      if (ext === 'json') {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of list) {
          const d = item as Record<string, unknown>;
          const municipioId = await resolveMunicipioId(toStr(d.municipioId), toStr(d.municipio));
          payloads.push({
            nombre: toStr(d.nombre),
            municipioId,
            telefono: toStr(d.telefono) || null,
            email: toStr(d.email) || null,
            activa: d.activa === undefined ? true : toBool(d.activa),
          });
          previews.push({ nombre: toStr(d.nombre), municipio: toStr(d.municipio) || municipioId, telefono: toStr(d.telefono), email: toStr(d.email), activa: d.activa === undefined ? true : toBool(d.activa) });
        }
      } else if (ext === 'csv') {
        const text = await file.text();
        const lines = text.trim().split(/\r?\n/);
        const headers = lines[0].split(',').map((h) => h.trim());
        for (let li = 1; li < lines.length; li++) {
          const row = lines[li] || '';
          if (!row.trim()) continue;
          const vals: string[] = []; let cur=''; let inQ=false;
          for (let i=0;i<row.length;i++){ const ch=row[i]; if(ch==='"'){ inQ=!inQ; } else if(ch===',' && !inQ){ vals.push(cur); cur=''; } else { cur+=ch; } } vals.push(cur);
          const get = (name: string) => vals[headers.indexOf(name)]?.replace(/^"|"$/g,'').trim();
          const municipioId = await resolveMunicipioId(get('municipioId'), get('municipio'));
          const activa = toBool(get('activa'));
          payloads.push({ nombre: get('nombre'), municipioId, telefono: (get('telefono')||'') || null, email: (get('email')||'') || null, activa });
          previews.push({ nombre: get('nombre'), municipio: get('municipio') || municipioId, telefono: get('telefono') || '', email: get('email') || '', activa });
        }
      } else if (ext === 'xlsx') {
        const ab = await file.arrayBuffer();
        const wb = XLSX.read(ab);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
        const headers = ((rows[0] as unknown[])||[]).map((h)=>String(h));
        const idx=(n:string)=>headers.indexOf(n);
        for (let ri = 1; ri < rows.length; ri++) {
          const vals = rows[ri]||[];
          if (!vals || vals.length === 0) continue;
          const get=(n:string)=>String(vals[idx(n)] ?? '').trim();
          const municipioId = await resolveMunicipioId(get('municipioId'), get('municipio'));
          const activa = toBool(get('activa'));
          payloads.push({ nombre: get('nombre'), municipioId, telefono: (get('telefono')||'') || null, email: (get('email')||'') || null, activa });
          previews.push({ nombre: get('nombre'), municipio: get('municipio') || municipioId, telefono: get('telefono') || '', email: get('email') || '', activa });
        }
      } else if (ext === 'sql') {
        const text = await file.text();
        const pickColsVals = (stmt: string) => { const m = stmt.match(/\(([^)]*)\)\s*VALUES\s*\(([^)]*)\)/i); if(!m) return null; const cols = m[1].split(',').map(s=>s.trim()); const raw = m[2]; const vals: string[]=[]; let cur=''; let inQ=false; for(let i=0;i<raw.length;i++){ const ch=raw[i]; if(ch==="'"){ inQ=!inQ; cur+=ch; } else if(ch===',' && !inQ){ vals.push(cur.trim()); cur=''; } else { cur+=ch; } } vals.push(cur.trim()); const clean=(v:string)=>v.replace(/^'|'$|^"|"$/g,''); return { cols, vals: vals.map(clean) }; };
        const matches = [...text.matchAll(/INSERT\s+INTO\s+empresas[\s\S]*?VALUES\s*\([^)]*\)/ig)].map(m=>m[0]);
        for(const stmt of matches){
          const pv = pickColsVals(stmt);
          if (!pv) continue;
          const g=(n:string)=>pv.vals[pv.cols.indexOf(n)] || '';
          const municipioId = await resolveMunicipioId(g('municipio_id'), g('municipio'));
          const activa = toBool(g('activa'));
          payloads.push({ nombre: g('nombre'), municipioId, telefono: (g('telefono')||'') || null, email: (g('email')||'') || null, activa });
          previews.push({ nombre: g('nombre'), municipio: g('municipio') || municipioId, telefono: g('telefono') || '', email: g('email') || '', activa });
        }
      }
      if (payloads.length === 0) return;
      setImportEmpresaPayloads(payloads);
      setPreviewEmpresas(previews);
      setEmpresaSelectedIndices(new Set(previews.map((_, i) => i)));
      setEmpresaImportMessage('Listo para importar');
    } catch {
      setEmpresaImportMessage('Archivo inválido o error al importar');
    } finally {
      setEmpresaImportBusy(false);
    }
  };

  const handleImportEmpresasSelected = () => {
    (async () => {
      setEmpresaImportBusy(true);
      try {
        let imported = 0;
        for (let i = 0; i < importEmpresaPayloads.length; i++) {
          if (!empresaSelectedIndices.has(i)) continue;
          const resp = await adminService.createEmpresa(importEmpresaPayloads[i]);
          if (resp.success) imported++;
          setEmpresaImportMessage(`Importadas ${imported}/${empresaSelectedIndices.size}`);
        }
        const empresasResp = await adminService.getEmpresas();
        if (empresasResp.success && empresasResp.data) setEmpresas(empresasResp.data);
        setEmpresaImportMessage('Importación completada');
      } catch {
        setEmpresaImportMessage('Error al importar seleccionadas');
      } finally {
        setEmpresaImportBusy(false);
      }
    })();
  };

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const capitalizeFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");
  const getMunicipioNombre = (id: string) => municipiosOptions.find((m) => m.id === id)?.nombre || capitalizeFirst(id);
  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    const suffix = d.getHours() >= 12 ? "p.m." : "a.m.";
    return `${y}-${m}-${day} | ${hh}:${mm} ${suffix}`;
  };

  // Funciones de descarga
  const handleDownloadRutas = async () => {
    const header = "ID,Nombre,Origen,Destino,Municipio,Empresa,Costo Mínimo,Costo Máximo,Duración,Frecuencia,Usuarios Registrados,Fecha Creación,Activa,Paradas,Horarios";
    const lines: string[] = [header];
    for (const r of rutas) {
      let d: { paradas: string[]; horarios: Array<{ dia: string; salidas: string[] }> } | null = null;
      try {
        const details = await publicService.getRutaDetails(r.id);
        d = details.success && details.data ? details.data : null;
      } catch {
        d = null;
      }
      const paradasStr = d ? d.paradas.map((p, i) => `${i + 1}. ${p}`).join(" | ") : "";
      const horariosStr = d ? d.horarios.map(h => `${h.dia}: ${h.salidas.join(" • ")}`).join(" || ") : "";
      lines.push([
        r.id,
        `"${r.nombre}"`,
        `"${r.origen}"`,
        `"${r.destino}"`,
        `"${r.municipio}"`,
        `"${r.empresa}"`,
        r.costoMinimo,
        r.costoMaximo,
        `"${r.duracion}"`,
        `"${r.frecuencia}"`,
        r.usuariosRegistrados,
        formatDateTime(String(r.fechaCreacion)),
        r.activa ? "Sí" : "No",
        `"${paradasStr}"`,
        `"${horariosStr}"`,
      ].join(","));
    }
    const csv = "\uFEFF" + lines.join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MOBZI_Rutas_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadUsuarios = () => {
    const csv = [
      "ID,Nombre,Email,Teléfono,Fecha Registro,Tipo Usuario,Rutas Registradas,Activo",
      ...usuarios.map((u) =>
        [
          u.id,
          `"${u.nombre}"`,
          `"${u.email}"`,
          `"${u.telefono}"`,
          formatDateTime(String(u.fechaRegistro)),
          u.tipoUsuario,
          u.rutasRegistradas,
          u.activo ? "Sí" : "No",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MOBZI_Usuarios_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadEmpresas = () => {
    const csv = [
      "ID,Nombre,Municipio,Rutas,Teléfono,Email,Fecha Creación,Estado",
      ...empresas.map((e) =>
        [
          e.id,
          `"${e.nombre}"`,
          `"${getMunicipioNombre(e.municipio_id)}"`,
          String(empresaRutasCount.get(e.id) ?? 0),
          `"${e.telefono || ''}"`,
          `"${e.email || ''}"`,
          formatDateTime(String(e.fecha_creacion)),
          e.activa ? "Sí" : "No",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MOBZI_Empresas_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTodo = async () => {
    try {
      const password = prompt("Ingresa tu contraseña de administrador para proteger el archivo zip:");
      if (!password || password.trim().length === 0) {
        alert("Debes ingresar tu contraseña para continuar");
        return;
      }
      const zipWriter = new ZipWriter(new BlobWriter("application/zip"), { password });

      // Rutas CSV con paradas y horarios
      const rutasHeader = "ID,Nombre,Origen,Destino,Municipio,Empresa,Costo Mínimo,Costo Máximo,Duración,Frecuencia,Usuarios Registrados,Fecha Creación,Activa,Paradas,Horarios";
      const rutasLines: string[] = [rutasHeader];
      for (const r of rutas) {
        let d: { paradas: string[]; horarios: Array<{ dia: string; salidas: string[] }> } | null = null;
        try {
          const details = await publicService.getRutaDetails(r.id);
          d = details.success && details.data ? details.data : null;
        } catch {
          d = null;
        }
        const paradasStr = d ? d.paradas.map((p, i) => `${i + 1}. ${p}`).join(" | ") : "";
        const horariosStr = d ? d.horarios.map(h => `${h.dia}: ${h.salidas.join(" • ")}`).join(" || ") : "";
        rutasLines.push([
          r.id,
          `"${r.nombre}"`,
          `"${r.origen}"`,
          `"${r.destino}"`,
          `"${r.municipio}"`,
          `"${r.empresa}"`,
          r.costoMinimo,
          r.costoMaximo,
          `"${r.duracion}"`,
          `"${r.frecuencia}"`,
          r.usuariosRegistrados,
          formatDateTime(String(r.fechaCreacion)),
          r.activa ? "Sí" : "No",
          `"${paradasStr}"`,
          `"${horariosStr}"`,
        ].join(","));
      }
      const rutasCsv = "\uFEFF" + rutasLines.join("\n");
      await zipWriter.add(`Informacion del sistema MOBZI - ${formatDateTime(new Date().toISOString())}/Rutas/rutas.csv`, new TextReader(rutasCsv));

      // Usuarios con rutas por nombre
      const usuariosResp = await adminService.getUsuarios();
      const usuariosData = usuariosResp.success && usuariosResp.data ? usuariosResp.data : usuarios;
      const usuariosRutasResp = await adminService.getUsuariosConRutas();
      const usuariosRutas = (usuariosRutasResp.success && usuariosRutasResp.data) ? usuariosRutasResp.data as Array<{ id: string; rutas_nombres?: string }> : [];
      const rutasByUser = new Map<string, string>();
      usuariosRutas.forEach((row) => rutasByUser.set(row.id, row.rutas_nombres || ""));
      const usuariosHeader = "ID,Nombre,Email,Teléfono,Fecha Registro,Tipo Usuario,Rutas (por nombre),Activo";
      const usuariosLines: string[] = [usuariosHeader];
      usuariosData.forEach((u: Usuario) => {
        usuariosLines.push([
          u.id,
          `"${u.nombre}"`,
          `"${u.email}"`,
          `"${u.telefono || ''}"`,
          formatDateTime(String(u.fechaRegistro)),
          u.tipoUsuario,
          `"${rutasByUser.get(u.id) || ''}"`,
          u.activo ? "Sí" : "No",
        ].join(","));
      });
      const usuariosCsv = "\uFEFF" + usuariosLines.join("\n");
      await zipWriter.add(`Informacion del sistema MOBZI - ${formatDateTime(new Date().toISOString())}/Usuarios/usuarios.csv`, new TextReader(usuariosCsv));

      // Empresas CSV
      const empresasHeader = "ID,Nombre,Municipio,Rutas,Teléfono,Email,Fecha Creación,Estado";
      const empresasLines: string[] = [empresasHeader];
      empresas.forEach((e) => {
        empresasLines.push([
          e.id,
          `"${e.nombre}"`,
          `"${getMunicipioNombre(e.municipio_id)}"`,
          String(empresaRutasCount.get(e.id) ?? 0),
          `"${e.telefono || ''}"`,
          `"${e.email || ''}"`,
          formatDateTime(String(e.fecha_creacion)),
          e.activa ? 'Sí' : 'No',
        ].join(","));
      });
      const empresasCsv = "\uFEFF" + empresasLines.join("\n");
      await zipWriter.add(`Informacion del sistema MOBZI - ${formatDateTime(new Date().toISOString())}/Empresas/empresas.csv`, new TextReader(empresasCsv));

      // PDFs individuales de rutas (usar jsPDF, similar a handleDownloadRutaDetallada)
      for (const ruta of rutas) {
        let d: { paradas: string[]; horarios: Array<{ dia: string; salidas: string[] }> } | null = null;
        try {
          const details = await publicService.getRutaDetails(ruta.id);
          d = details.success && details.data ? details.data : null;
        } catch {
          d = null;
        }
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 16;
        const brandBlue = { r: 0, g: 98, b: 255 };
        const brandYellow = { r: 255, g: 193, b: 7 };
        const bgRgb = { r: 153, g: 204, b: 255 }; // #99ccff

        // Cabecera
        doc.setFontSize(20);
        doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
        doc.text("Reporte de Ruta", margin, 20);
        doc.setTextColor(brandYellow.r, brandYellow.g, brandYellow.b);
        doc.setFontSize(12);
        doc.text("MOBZI", margin, 28);
        // Eslogan en negro
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text("Conectando rutas inteligentes", margin, 34);

        // Datos generales - preparar y pintar fondo #99ccff (sin borde amarillo)
        let y = 48;
        const dataLines: Array<[string, string]> = [
          ["Nombre", ruta.nombre],
          ["Origen", ruta.origen],
          ["Destino", ruta.destino],
          ["Municipio", ruta.municipio],
          ["Empresa", ruta.empresa],
          ["Costo", `${ruta.costoMinimo} - ${ruta.costoMaximo} ${ruta.moneda}`],
          ["Duración", ruta.duracion || ""],
          ["Frecuencia", ruta.frecuencia || ""],
          ["Usuarios registrados", String(ruta.usuariosRegistrados)],
          ["Fecha de registro", formatDateTime(String(ruta.fechaCreacion))],
          ["Estado", ruta.activa ? 'Activa' : 'Inactiva']
        ];

        const dataLineHeight = 8;
        const dataBlockHeight = dataLines.length * dataLineHeight + 8;
        doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
        doc.roundedRect(margin - 4, y - 6, pageWidth - margin * 2 + 8, dataBlockHeight, 4, 4, 'F');

        // Imprimir datos (en negro)
        doc.setTextColor(0, 0, 0);
        for (const [label, value] of dataLines) {
          doc.setFontSize(12);
          doc.text(`${label}: ${value || 'Sin información'}`, margin, y);
          y += dataLineHeight;
        }

        // Secciones extra (paradas / horarios)
        if (d) {
          const paradas = d.paradas || [];
          const paradasTitleHeight = 8;
          const paradasLineHeight = 6;
          const paradasBlockHeight = paradasTitleHeight + Math.max(1, paradas.length) * paradasLineHeight + 10;
          doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
          doc.roundedRect(margin - 4, y - 6, pageWidth - margin * 2 + 8, paradasBlockHeight, 4, 4, 'F');

          doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
          doc.setFontSize(11);
          doc.text('Paradas principales', margin, y);
          y += paradasTitleHeight;

          if (!paradas.length) {
            doc.setTextColor(0, 0, 0);
            doc.text('Sin paradas registradas', margin, y);
            y += paradasLineHeight;
          } else {
            for (let i = 0; i < paradas.length; i++) {
              const p = paradas[i];
              // número en amarillo, texto en negro (imprimir número solo una vez)
              doc.setTextColor(brandYellow.r, brandYellow.g, brandYellow.b);
              doc.text(`${i + 1}.`, margin, y);
              doc.setTextColor(0, 0, 0);
              doc.text(`${p}`, margin + 12, y);
              y += paradasLineHeight;
            }
          }

          // Horarios
          const horarios = d.horarios || [];
          const horariosTitleHeight = 8;
          const horariosLineHeight = 6;
          const horariosBlockHeight = horariosTitleHeight + Math.max(1, horarios.length) * horariosLineHeight + 10;
          doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
          doc.roundedRect(margin - 4, y - 6, pageWidth - margin * 2 + 8, horariosBlockHeight, 4, 4, 'F');

          doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
          doc.setFontSize(11);
          doc.text('Horarios de salida', margin, y);
          y += horariosTitleHeight;

          if (!horarios.length) {
            doc.setTextColor(0, 0, 0);
            doc.text('Sin horarios registrados', margin, y);
            y += horariosLineHeight;
          } else {
            for (const h of horarios) {
              // día en amarillo, salidas en negro
              doc.setTextColor(brandYellow.r, brandYellow.g, brandYellow.b);
              doc.text(`${h.dia}:`, margin, y);
              doc.setTextColor(0, 0, 0);
              doc.text(`${(h.salidas || []).join(' • ')}`, margin + 28, y);
              y += horariosLineHeight;
            }
          }
        }
        const pdfBlob = doc.output("blob");
        const pdfName = ruta.nombre.replace(/\s+/g, "_");
        await zipWriter.add(`Informacion del sistema MOBZI - ${formatDateTime(new Date().toISOString())}/Rutas/Rutas Individuales/${pdfName}.pdf`, new BlobReader(pdfBlob));
      }

      const blob = await zipWriter.close();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Informacion_del_sistema_MOBZI_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar todo:", error);
      alert("No se pudo generar la descarga completa.");
    }
  };

//   PDF de ruta detallada
  const handleDownloadRutaDetallada = async (ruta: Ruta) => {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      let pageWidth = doc.internal.pageSize.getWidth();
      let pageHeight = doc.internal.pageSize.getHeight();
      const margin = 16;
      const brandBlue = { r: 0, g: 98, b: 255 };
      const brandYellow = { r: 255, g: 193, b: 7 };
      const textBase = { r: 231, g: 244, b: 255 };

      const cachedLogo = logoDataUrl ?? (await loadLogoDataUrl("/square_logo.png"));
      if (!logoDataUrl && cachedLogo) {
        setLogoDataUrl(cachedLogo);
      }

      doc.setDrawColor(brandYellow.r, brandYellow.g, brandYellow.b);
      doc.setLineWidth(1.1);
      doc.roundedRect(
        margin / 2,
        margin / 2,
        pageWidth - margin,
        pageHeight - margin,
        6,
        6,
        "S"
      );

      if (cachedLogo) {
        doc.addImage(cachedLogo, "PNG", margin, margin, 26, 26);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("Reporte de Ruta", margin + 32, margin + 12);

      doc.setFontSize(12);
      doc.setTextColor(brandYellow.r, brandYellow.g, brandYellow.b);
      doc.text("MOBZI", margin + 32, margin + 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textBase.r, textBase.g, textBase.b);
      doc.text("Conectando rutas inteligentes", margin + 32, margin + 26);

      doc.setDrawColor(brandBlue.r, brandBlue.g, brandBlue.b);
      doc.setLineWidth(0.3);
      doc.line(margin, margin + 30, pageWidth - margin, margin + 30);

      let currentY = margin + 38;

      const ensureSpace = (height: number) => {
        if (currentY + height <= pageHeight - margin) {
          return;
        }
        doc.addPage();
        pageWidth = doc.internal.pageSize.getWidth();
        pageHeight = doc.internal.pageSize.getHeight();
        doc.setDrawColor(brandYellow.r, brandYellow.g, brandYellow.b);
        doc.setLineWidth(1.1);
        doc.roundedRect(
          margin / 2,
          margin / 2,
          pageWidth - margin,
          pageHeight - margin,
          6,
          6,
          "S"
        );
        currentY = margin + 12;
      };

      const renderSectionHeader = (title: string) => {
        ensureSpace(18);
        doc.setFillColor(brandBlue.r, brandBlue.g, brandBlue.b);
        doc.setDrawColor(brandYellow.r, brandYellow.g, brandYellow.b);
        doc.roundedRect(
          margin,
          currentY - 6,
          pageWidth - margin * 2,
          10,
          2,
          2,
          "FD"
        );
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(title, margin + 4, currentY);
        currentY += 12;
      };

      const renderKeyValue = (label: string, value: string) => {
        ensureSpace(10);
        const safeValue = value && value.trim().length > 0 ? value : "Sin información";
        const wrapped = doc.splitTextToSize(
          safeValue,
          pageWidth - margin * 2 - 30
        );
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(brandYellow.r, brandYellow.g, brandYellow.b);
        doc.text(`${label}:`, margin + 2, currentY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(textBase.r, textBase.g, textBase.b);
        doc.text(wrapped, margin + 30, currentY);
        currentY += wrapped.length * 5 + 4;
      };

      renderSectionHeader("Datos generales");
      renderKeyValue("Nombre", ruta.nombre);
      renderKeyValue("Origen", ruta.origen);
      renderKeyValue("Destino", ruta.destino);
      renderKeyValue("Municipio", ruta.municipio);
      renderKeyValue("Empresa", ruta.empresa || "Sin empresa registrada");
      renderKeyValue(
        "Costo",
        `${ruta.costoMinimo} - ${ruta.costoMaximo} ${ruta.moneda}`
      );
      renderKeyValue("Duración", ruta.duracion || "No registrada");
      renderKeyValue("Frecuencia", ruta.frecuencia || "No registrada");
      renderKeyValue(
        "Usuarios registrados",
        `${ruta.usuariosRegistrados}`
      );
      renderKeyValue("Fecha de registro", formatDateTime(String(ruta.fechaCreacion)));
      renderKeyValue("Estado", ruta.activa ? "Activa" : "Inactiva");

      renderSectionHeader("Paradas principales");
      if (!ruta.paradas.length) {
        renderKeyValue("Paradas", "Sin paradas registradas");
      } else {
        ruta.paradas.forEach((parada, index) => {
          ensureSpace(8);
          const text = doc.splitTextToSize(
            `${index + 1}. ${parada}`,
            pageWidth - margin * 2 - 10
          );
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
          doc.text(`${index + 1}.`, margin + 2, currentY);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(textBase.r, textBase.g, textBase.b);
          doc.text(text, margin + 12, currentY);
          currentY += text.length * 5 + 2;
        });
      }

      renderSectionHeader("Horarios de salida");
      if (!ruta.horarios.length) {
        renderKeyValue("Horarios", "Sin horarios registrados");
      } else {
        ruta.horarios.forEach((horario) => {
          ensureSpace(10);
          const salidas = horario.salidas.join(" • ");
          const wrapped = doc.splitTextToSize(
            salidas,
            pageWidth - margin * 2
          );
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
          doc.text(horario.dia, margin + 2, currentY);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(textBase.r, textBase.g, textBase.b);
          doc.text(wrapped, margin + 2, currentY + 5);
          currentY += wrapped.length * 5 + 7;
        });
      }

      if (ruta.notas && ruta.notas.trim().length > 0) {
        renderSectionHeader("Notas adicionales");
        ensureSpace(8);
        const wrappedNotes = doc.splitTextToSize(
          ruta.notas,
          pageWidth - margin * 2
        );
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(textBase.r, textBase.g, textBase.b);
        doc.text(wrappedNotes, margin + 2, currentY);
        currentY += wrappedNotes.length * 5 + 4;
      }

      ensureSpace(18);
      const footerY = pageHeight - margin - 6;
      doc.setDrawColor(brandBlue.r, brandBlue.g, brandBlue.b);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(brandYellow.r, brandYellow.g, brandYellow.b);
      doc.text(
        "Gracias por impulsar la movilidad inteligente",
        margin,
        footerY + 6
      );

      doc.save(
        `MOBZI_${ruta.nombre.replace(/\s+/g, "_")}_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (error) {
      console.error("Error al generar el PDF de la ruta", error);
      alert("No se pudo generar el PDF de la ruta. Inténtalo nuevamente.");
    }
  };

  // Filtrar datos
  const rutasFiltradas = rutas.filter((r) => {
    const query = searchRutas.trim().toLowerCase();
    if (!query) return true;
    return (
      r.nombre.toLowerCase().includes(query) ||
      r.origen.toLowerCase().includes(query) ||
      r.destino.toLowerCase().includes(query) ||
      r.municipio.toLowerCase().includes(query) ||
      r.empresa.toLowerCase().includes(query)
    );
  }).sort((a, b) => a.nombre.localeCompare(b.nombre));

  const usuariosFiltrados = usuarios.filter((u) => {
    const query = searchUsuarios.trim().toLowerCase();
    if (!query) return true;
    return (
      u.nombre.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.telefono.toLowerCase().includes(query)
    );
  }).sort((a, b) => a.nombre.localeCompare(b.nombre));

  const empresasFiltradas = empresas.filter((e) => {
    const q = searchEmpresas.trim().toLowerCase();
    if (!q) return true;
    const municipioNombre = getMunicipioNombre(e.municipio_id).toLowerCase();
    return (
      e.nombre.toLowerCase().includes(q) ||
      municipioNombre.includes(q) ||
      (e.telefono || "").toLowerCase().includes(q) ||
      (e.email || "").toLowerCase().includes(q)
    );
  }).sort((a, b) => a.nombre.localeCompare(b.nombre));

  useEffect(() => {
    setRutasPage(1);
  }, [searchRutas]);
  useEffect(() => {
    setUsuariosPage(1);
  }, [searchUsuarios]);
  useEffect(() => {
    setEmpresasPage(1);
  }, [searchEmpresas]);
  useEffect(() => {
    if (uploadMessage === 'Importación completada') {
      setRutasImportDone(true);
      setTimeout(() => { setShowRutaUpload(false); }, 1500);
    }
  }, [uploadMessage]);
  useEffect(() => {
    if (empresaImportMessage === 'Importación completada') {
      setEmpresaImportDone(true);
      setTimeout(() => { setShowEmpresaForm(false); setEditingEmpresa(null); }, 1500);
    }
  }, [empresaImportMessage]);
  useEffect(() => {
    if (!showRutaUpload) { resetRutaImport(); }
  }, [showRutaUpload]);
  useEffect(() => {
    if (!showEmpresaForm) { resetEmpresaImport(); }
  }, [showEmpresaForm]);

  const rutasTotal = rutasFiltradas.length;
  const rutasPageCount = Math.max(1, Math.ceil(rutasTotal / rutasPageSize));
  const rutasStartIndex = Math.min((rutasPage - 1) * rutasPageSize, Math.max(0, (rutasPageCount - 1) * rutasPageSize));
  const rutasItems = rutasFiltradas.slice(rutasStartIndex, rutasStartIndex + rutasPageSize);
  useEffect(() => {
    const max = Math.max(1, Math.ceil(rutasFiltradas.length / rutasPageSize));
    if (rutasPage > max) setRutasPage(max);
  }, [rutasFiltradas.length, rutasPageSize, rutasPage]);

  const usuariosTotal = usuariosFiltrados.length;
  const usuariosPageCount = Math.max(1, Math.ceil(usuariosTotal / usuariosPageSize));
  const usuariosStartIndex = Math.min((usuariosPage - 1) * usuariosPageSize, Math.max(0, (usuariosPageCount - 1) * usuariosPageSize));
  const usuariosItems = usuariosFiltrados.slice(usuariosStartIndex, usuariosStartIndex + usuariosPageSize);
  useEffect(() => {
    const max = Math.max(1, Math.ceil(usuariosFiltrados.length / usuariosPageSize));
    if (usuariosPage > max) setUsuariosPage(max);
  }, [usuariosFiltrados.length, usuariosPageSize, usuariosPage]);

  const empresasTotal = empresasFiltradas.length;
  const empresasPageCount = Math.max(1, Math.ceil(empresasTotal / empresasPageSize));
  const empresasStartIndex = Math.min((empresasPage - 1) * empresasPageSize, Math.max(0, (empresasPageCount - 1) * empresasPageSize));
  const empresasItems = empresasFiltradas.slice(empresasStartIndex, empresasStartIndex + empresasPageSize);
  useEffect(() => {
    const max = Math.max(1, Math.ceil(empresasFiltradas.length / empresasPageSize));
    if (empresasPage > max) setEmpresasPage(max);
  }, [empresasFiltradas.length, empresasPageSize, empresasPage]);

  const empresaRutasCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of empresas) {
      const count = rutas.filter((r) => r.empresa === e.nombre || r.empresa === e.id).length;
      map.set(e.id, count);
    }
    return map;
  }, [rutas, empresas]);


  if (loading) {
    return (
      <div className={styles.page}>
        <Menu />
        <div className={styles.loading}>
          <span className={styles.spinner} aria-hidden="true" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Menu />

      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Panel de Administración</h1>
          <p className={styles.subtitle}>
            Gestiona rutas, usuarios y descarga información del sistema
          </p>
        </header>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "rutas" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("rutas")}
          >
            Gestión de Rutas
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "usuarios" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("usuarios")}
          >
            Gestión de Usuarios
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "empresas" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("empresas")}
          >
            Gestión de Empresas
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "descargas" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("descargas")}
          >
            Descargas
          </button>
        </div>

        {/* Contenido de Rutas */}
        {activeTab === "rutas" && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Rutas del Sistema</h2>
              <button
                className={styles.primaryButton}
                onClick={() => setShowRutaUpload(true)}
              >
                + Nueva Ruta
              </button>
            </div>

            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Buscar rutas por nombre, origen, destino, municipio o empresa..."
                value={searchRutas}
                onChange={(e) => setSearchRutas(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Origen - Destino</th>
                    <th>Municipio</th>
                    <th>Empresa</th>
                    <th>Costo</th>
                    <th>Usuarios</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rutasItems.map((ruta) => (
                    <tr key={ruta.id}>
                      <td>{ruta.nombre}</td>
                      <td>
                        {ruta.origen} → {ruta.destino}
                      </td>
                      <td>{ruta.municipio}</td>
                      <td>{ruta.empresa}</td>
                      <td>
                        ${ruta.costoMinimo} - ${ruta.costoMaximo} {ruta.moneda}
                      </td>
                      <td>{ruta.usuariosRegistrados}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            ruta.activa
                              ? styles.badgeActive
                              : styles.badgeInactive
                          }`}
                        >
                          {ruta.activa ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          {/* Edición deshabilitada */}
                          <button
                            className={styles.toggleButton}
                            onClick={() => handleToggleRutaActiva(ruta.id)}
                            title={ruta.activa ? "Desactivar" : "Activar"}
                          >
                            {ruta.activa ? "🔒" : "🔓"}
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteRuta(ruta.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.pagination}>
              <div className={styles.pageInfo}>
                Mostrando {rutasTotal === 0 ? 0 : rutasStartIndex + 1}–{rutasStartIndex + rutasItems.length} de {rutasTotal}
              </div>
              <div className={styles.pageControls}>
                <button className={styles.pageNavButton} disabled={rutasPage === 1} onClick={() => setRutasPage((p) => Math.max(1, p - 1))}>Anterior</button>
                <div className={styles.pageNumbers}>
                  {Array.from({ length: rutasPageCount }, (_, i) => i + 1).map((n) => (
                    <button key={n} className={`${styles.pageButton} ${n === rutasPage ? styles.pageButtonActive : ""}`} onClick={() => setRutasPage(n)}>{n}</button>
                  ))}
                </div>
                <div className={styles.pageIndicator}>Página {rutasPage} de {rutasPageCount}</div>
                <button className={styles.pageNavButton} disabled={rutasPage >= rutasPageCount} onClick={() => setRutasPage((p) => Math.min(rutasPageCount, p + 1))}>Siguiente</button>
                <div className={styles.pageSizeWrap}>
                  <label className={styles.pageSizeLabel}>Por página</label>
                  <select className={styles.pageSizeSelect} value={rutasPageSize} onChange={(e) => { const size = Number(e.target.value); setRutasPageSize(size); setRutasPage(1); }}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido de Usuarios */}
        {activeTab === "usuarios" && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Usuarios Registrados</h2>
            </div>

            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Buscar usuarios por nombre, email o teléfono..."
                value={searchUsuarios}
                onChange={(e) => setSearchUsuarios(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Fecha Registro</th>
                    <th>Rutas</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosItems.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.nombre}</td>
                      <td>{usuario.email}</td>
                      <td>{usuario.telefono}</td>
                      <td>{formatDateTime(String(usuario.fechaRegistro))}</td>
                      <td>{usuario.rutasRegistradas}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            usuario.activo
                              ? styles.badgeActive
                              : styles.badgeInactive
                          }`}
                        >
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.toggleButton}
                            onClick={() =>
                              handleToggleUsuarioActivo(usuario.id)
                            }
                            title={usuario.activo ? "Desactivar" : "Activar"}
                          >
                            {usuario.activo ? "🔒" : "🔓"}
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteUsuario(usuario.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.pagination}>
              <div className={styles.pageInfo}>
                Mostrando {usuariosTotal === 0 ? 0 : usuariosStartIndex + 1}–{usuariosStartIndex + usuariosItems.length} de {usuariosTotal}
              </div>
              <div className={styles.pageControls}>
                <button className={styles.pageNavButton} disabled={usuariosPage === 1} onClick={() => setUsuariosPage((p) => Math.max(1, p - 1))}>Anterior</button>
                <div className={styles.pageNumbers}>
                  {Array.from({ length: usuariosPageCount }, (_, i) => i + 1).map((n) => (
                    <button key={n} className={`${styles.pageButton} ${n === usuariosPage ? styles.pageButtonActive : ""}`} onClick={() => setUsuariosPage(n)}>{n}</button>
                  ))}
                </div>
                <div className={styles.pageIndicator}>Página {usuariosPage} de {usuariosPageCount}</div>
                <button className={styles.pageNavButton} disabled={usuariosPage >= usuariosPageCount} onClick={() => setUsuariosPage((p) => Math.min(usuariosPageCount, p + 1))}>Siguiente</button>
                <div className={styles.pageSizeWrap}>
                  <label className={styles.pageSizeLabel}>Por página</label>
                  <select className={styles.pageSizeSelect} value={usuariosPageSize} onChange={(e) => { const size = Number(e.target.value); setUsuariosPageSize(size); setUsuariosPage(1); }}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido de Empresas */}
        {activeTab === "empresas" && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Empresas</h2>
              <button
                className={styles.primaryButton}
                onClick={() => {
                  setEditingEmpresa(null);
                  setEmpresaForm({ id: "", nombre: "", municipioId: rutaForm.municipioId || "huamantla", telefono: "", email: "", activa: true });
                  setShowEmpresaForm(true);
                }}
              >
                + Nueva Empresa
              </button>
            </div>

            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Buscar empresas por nombre, municipio, teléfono o email"
                value={searchEmpresas}
                onChange={(e) => setSearchEmpresas(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Municipio</th>
                    <th>Rutas</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Creación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empresasItems.map((e) => (
                    <tr key={e.id}>
                      <td>{e.nombre}</td>
                      <td>{getMunicipioNombre(e.municipio_id)}</td>
                      <td>{empresaRutasCount.get(e.id) ?? 0}</td>
                      <td>{e.telefono || ""}</td>
                      <td>{e.email || ""}</td>
                      <td>{formatDateTime(e.fecha_creacion)}</td>
                      <td>
                        <span className={`${styles.badge} ${e.activa ? styles.badgeActive : styles.badgeInactive}`}>{e.activa ? "Activa" : "Inactiva"}</span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.editButton}
                            onClick={() => {
                              setEditingEmpresa(e);
                              setEmpresaForm({ id: e.id, nombre: e.nombre, municipioId: e.municipio_id, telefono: e.telefono || "", email: e.email || "", activa: e.activa });
                              setShowEmpresaForm(true);
                            }}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteEmpresa(e.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.pagination}>
              <div className={styles.pageInfo}>
                Mostrando {empresasTotal === 0 ? 0 : empresasStartIndex + 1}–{empresasStartIndex + empresasItems.length} de {empresasTotal}
              </div>
              <div className={styles.pageControls}>
                <button className={styles.pageNavButton} disabled={empresasPage === 1} onClick={() => setEmpresasPage((p) => Math.max(1, p - 1))}>Anterior</button>
                <div className={styles.pageNumbers}>
                  {Array.from({ length: empresasPageCount }, (_, i) => i + 1).map((n) => (
                    <button key={n} className={`${styles.pageButton} ${n === empresasPage ? styles.pageButtonActive : ""}`} onClick={() => setEmpresasPage(n)}>{n}</button>
                  ))}
                </div>
                <div className={styles.pageIndicator}>Página {empresasPage} de {empresasPageCount}</div>
                <button className={styles.pageNavButton} disabled={empresasPage >= empresasPageCount} onClick={() => setEmpresasPage((p) => Math.min(empresasPageCount, p + 1))}>Siguiente</button>
                <div className={styles.pageSizeWrap}>
                  <label className={styles.pageSizeLabel}>Por página</label>
                  <select className={styles.pageSizeSelect} value={empresasPageSize} onChange={(e) => { const size = Number(e.target.value); setEmpresasPageSize(size); setEmpresasPage(1); }}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido de Descargas */}
        {activeTab === "descargas" && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Descargar Información</h2>
            </div>

            <div className={styles.downloadSection}>
              {/* Descargas Generales */}
              <div className={styles.downloadCard}>
                <h3>Descargas Generales</h3>
                <p>
                  Exporta información del sistema en formato CSV.
                </p>
                <div className={styles.rutasList}>
                  <div className={styles.rutaDownloadItem}>
                    <div>
                      <strong>Rutas</strong>
                      <span className={styles.rutaInfo}>Todas las rutas del sistema</span>
                    </div>
                    <button className={styles.downloadButtonSmall} onClick={handleDownloadRutas}>
                      📥 Descargar
                    </button>
                  </div>
                  <div className={styles.rutaDownloadItem}>
                    <div>
                      <strong>Usuarios</strong>
                      <span className={styles.rutaInfo}>Todos los usuarios registrados</span>
                    </div>
                    <button className={styles.downloadButtonSmall} onClick={handleDownloadUsuarios}>
                      📥 Descargar
                    </button>
                  </div>
                  <div className={styles.rutaDownloadItem}>
                    <div>
                      <strong>Empresas</strong>
                      <span className={styles.rutaInfo}>Todas las empresas registradas</span>
                    </div>
                    <button className={styles.downloadButtonSmall} onClick={handleDownloadEmpresas}>
                      📥 Descargar
                    </button>
                  </div>
                  <div className={styles.rutaDownloadItem}>
                    <div>
                      <strong>Descargar TODO</strong>
                      <span className={styles.rutaInfo}>Rutas, Usuarios y Empresas (zip protegido)</span>
                    </div>
                    <button className={styles.downloadButtonSmall} onClick={handleDownloadTodo}>
                      📦 Descargar Todo
                    </button>
                  </div>
                </div>

              </div>

              {/* Descargas de Rutas Individuales */}
              <div className={styles.downloadCard}>
                <h3>Descargar Rutas Individuales</h3>
                <p>
                  Selecciona una ruta para descargar su información detallada.
                </p>
                <div className={styles.rutasList}>
                  {rutas.map((ruta) => (
                    <div key={ruta.id} className={styles.rutaDownloadItem}>
                      <div>
                        <strong>{ruta.nombre}</strong>
                        <span className={styles.rutaInfo}>
                          {ruta.usuariosRegistrados} usuarios registrados
                        </span>
                      </div>
                      <button
                        className={styles.downloadButtonSmall}
                        onClick={() => handleDownloadRutaDetallada(ruta)}
                      >
                        📥 Descargar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Formulario de Ruta */}
        {/* {showRutaForm && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowRutaForm(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Nueva Ruta</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowRutaForm(false)}
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Nombre de la Ruta *</label>
                  <input
                    type="text"
                    value={rutaForm.nombre || ""}
                    onChange={(e) =>
                      setRutaForm({ ...rutaForm, nombre: e.target.value })
                    }
                    placeholder="Ej: Ruta Centro - Xicohténcatl"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Origen *</label>
                    <input
                      type="text"
                      value={rutaForm.origen || ""}
                      onChange={(e) =>
                        setRutaForm({ ...rutaForm, origen: e.target.value })
                      }
                      placeholder="Ej: Centro de Huamantla"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Destino *</label>
                    <input
                      type="text"
                      value={rutaForm.destino || ""}
                      onChange={(e) =>
                        setRutaForm({ ...rutaForm, destino: e.target.value })
                      }
                      placeholder="Ej: Zona Industrial"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Municipio *</label>
                    <select
                      value={rutaForm.municipioId || ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        const nombre = municipiosOptions.find((m) => m.id === id)?.nombre || rutaForm.municipio || "";
                        setRutaForm({ ...rutaForm, municipioId: id, municipio: nombre, empresaId: undefined, empresa: "" });
                      }}
                      className={styles.select}
                      title="Selecciona un municipio"
                      required
                    >
                      <option value="" disabled>
                        Selecciona un municipio
                      </option>
                      {municipiosOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Empresa *</label>
                    <select
                      value={rutaForm.empresaId || ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        const nombre = empresasOptions.find((emp) => emp.id === id)?.nombre || rutaForm.empresa || "";
                        setRutaForm({ ...rutaForm, empresaId: id, empresa: nombre });
                      }}
                      className={styles.select}
                      title="Selecciona una empresa"
                      required
                    >
                      <option value="" disabled>
                        Selecciona una empresa
                      </option>
                      {empresasOptions.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Costo Mínimo (MXN)</label>
                    <input
                      placeholder="Costo mínimo en pesos mexicanos"
                      title="Costo mínimo en pesos mexicanos"
                      type="number"
                      value={rutaForm.costoMinimo || 0}
                      onChange={(e) =>
                        setRutaForm({
                          ...rutaForm,
                          costoMinimo: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Costo Máximo (MXN)</label>
                    <input
                      placeholder="Costo máximo en pesos mexicanos"
                      title="Costo máximo en pesos mexicanos"
                      type="number"
                      value={rutaForm.costoMaximo || 0}
                      onChange={(e) =>
                        setRutaForm({
                          ...rutaForm,
                          costoMaximo: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Duración</label>
                    <input
                      type="text"
                      value={rutaForm.duracion || ""}
                      onChange={(e) =>
                        setRutaForm({ ...rutaForm, duracion: e.target.value })
                      }
                      placeholder="Ej: 25 - 30 min"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Frecuencia</label>
                    <input
                      type="text"
                      value={rutaForm.frecuencia || ""}
                      onChange={(e) =>
                        setRutaForm({ ...rutaForm, frecuencia: e.target.value })
                      }
                      placeholder="Ej: Cada 12 min"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Paradas (separadas por comas)</label>
                  <input
                    type="text"
                    value={paradasInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setParadasInput(value);
                      setRutaForm({
                        ...rutaForm,
                        paradas: value
                          .split(",")
                          .map((p) => p.trim())
                          .filter(Boolean),
                      });
                    }}
                    placeholder="Ej: Parada 1, Parada 2, Parada 3"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Horarios de Salida</label>
                  <div className={styles.horariosContainer}>
                    {(rutaForm.horarios || []).map((horario, index) => (
                      <div key={index} className={styles.horarioItem}>
                        <div className={styles.horarioHeader}>
                          <input
                            type="text"
                            value={horario.dia}
                            onChange={(e) => {
                              const newHorarios = [...(rutaForm.horarios || [])];
                              newHorarios[index] = {
                                ...newHorarios[index],
                                dia: e.target.value,
                              };
                              setRutaForm({ ...rutaForm, horarios: newHorarios });
                            }}
                            placeholder="Ej: Lunes - Viernes"
                            className={styles.horarioDiaInput}
                          />
                          <button
                            type="button"
                            className={styles.removeHorarioButton}
                            onClick={() => {
                              const newHorarios = (rutaForm.horarios || []).filter(
                                (_, i) => i !== index
                              );
                              setRutaForm({ ...rutaForm, horarios: newHorarios });
                            }}
                            title="Eliminar día"
                          >
                            ✕
                          </button>
                        </div>
                        <div className={styles.salidasContainer}>
                          <input
                            type="text"
                            value={horario.salidas.join(", ")}
                            onChange={(e) => {
                              const salidas = e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              const newHorarios = [...(rutaForm.horarios || [])];
                              newHorarios[index] = {
                                ...newHorarios[index],
                                salidas,
                              };
                              setRutaForm({ ...rutaForm, horarios: newHorarios });
                            }}
                            placeholder="Ej: 06:00, 07:00, 08:00, 12:00"
                            className={styles.salidasInput}
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className={styles.addHorarioButton}
                      onClick={() => {
                        const newHorarios = [
                          ...(rutaForm.horarios || []),
                          { dia: "", salidas: [] },
                        ];
                        setRutaForm({ ...rutaForm, horarios: newHorarios });
                      }}
                    >
                      + Agregar Día
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Notas</label>
                  <textarea
                    value={rutaForm.notas || ""}
                    onChange={(e) =>
                      setRutaForm({ ...rutaForm, notas: e.target.value })
                    }
                    placeholder="Información adicional sobre la ruta..."
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={rutaForm.activa ?? true}
                      onChange={(e) =>
                        setRutaForm({ ...rutaForm, activa: e.target.checked })
                      }
                    />
                    Ruta activa
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.secondaryButton}
                  onClick={() => setShowRutaForm(false)}
                >
                  Cancelar
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={handleSaveRuta}
                >
                  Crear Ruta
                </button>
              </div>
            </div>
          </div>
        )} */}

        {showRutaUpload && (
          <div className={styles.modalOverlay} onClick={() => setShowRutaUpload(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Importar Ruta (en archivo XLSX ó CSV)</h2>
                <button className={styles.closeButton} onClick={() => setShowRutaUpload(false)}>✕</button>
              </div>
              <div className={styles.modalBody}>
                {rutasImportDone && (
                  <div className={styles.successBanner}>✅ Importación completada</div>
                )}
                <input title="Solo se aceptan archivos XLSX o CSV" ref={fileInputRef} type="file" accept=".json,.csv,.xlsx,.sql" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleProcessImportFile(f); }} />
                <div
                  className={`${styles.dragDropZone} ${dragActive ? styles.dragDropZoneActive : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f) handleProcessImportFile(f); }}
                >
                  <svg className={styles.dragDropIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-6-4h-6zM4 6h6v4h8v8H4V6z" />
                  </svg>
                  <p className={styles.dragDropLabel}>Arrastra y suelta el archivo aquí, o selecciónalo</p>
                  <p className={styles.dragDropText}>{uploadBusy ? 'Procesando...' : (uploadMessage || 'Listo')}</p>
                </div>
                {selectedFileName && (
                  <div className={styles.uploadStatus}><span className={styles.fileName}>Archivo: {selectedFileName}</span></div>
                )}
                {previewRoutes.length > 0 && (
                  <div className={styles.previewSection}>
                    <h3>Vista previa de las rutas</h3>
                    {previewRoutes.map((pr, idx) => (
                      <div key={idx} className={styles.previewItem}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input type="checkbox" checked={selectedIndices.has(idx)} onChange={(e) => {
                            setSelectedIndices((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(idx); else next.delete(idx);
                              return next;
                            });
                          }} />
                          <span className={styles.previewTitle}>Ruta {idx + 1}: {pr.nombre}</span>
                        </label>
                        <div className={styles.previewRow}>Origen: {pr.origen || '—'}</div>
                        <div className={styles.previewRow}>Destino: {pr.destino || '—'}</div>
                        <div className={styles.previewRow}>Paradas: {pr.paradas?.join(' | ') || '—'}</div>
                        <div className={styles.previewRow}>Horarios: {pr.horarios?.map(h => `${h.dia}: ${h.salidas.join(' • ')}`).join(' || ') || '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.secondaryButton} onClick={() => setShowRutaUpload(false)}>Cerrar</button>
                <button className={styles.primaryButton} disabled={uploadBusy || selectedIndices.size === 0} onClick={handleImportSelected}>Importar seleccionadas</button>
              </div>
            </div>
          </div>
        )}

        {/* FORMULARIO EDITAR CREAR UNA EMPRESA */}
        {showEmpresaForm && (
          <div className={styles.modalOverlay} onClick={() => setShowEmpresaForm(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{editingEmpresa ? "Editar Empresa" : "Nueva Empresa"}</h2>
                <button className={styles.closeButton} onClick={() => setShowEmpresaForm(false)}>✕</button>
              </div>
              <div className={styles.modalBody}>
                {empresaImportDone && (
                  <div className={styles.successBanner}>✅ Importación completada</div>
                )}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input type="text" value={empresaForm.nombre || ""} onChange={(e) => setEmpresaForm({ ...empresaForm, nombre: e.target.value })} placeholder="Ej: Transportes Huamantla" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <input type="email" value={empresaForm.email || ""} onChange={(e) => setEmpresaForm({ ...empresaForm, email: e.target.value })} placeholder="Ej: empresa@mobzi.com" />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Municipio *</label>
                    <select title="Selecciona un municipio" value={empresaForm.municipioId || ""} onChange={(e) => setEmpresaForm({ ...empresaForm, municipioId: e.target.value })} className={styles.select} required>
                      <option value="" disabled>Selecciona un municipio</option>
                      {municipiosOptions.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Teléfono</label>
                    <input type="text" value={empresaForm.telefono || ""} onChange={(e) => setEmpresaForm({ ...empresaForm, telefono: e.target.value })} placeholder="Ej: 246 123 4567" />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>
                      <input type="checkbox" checked={empresaForm.activa ?? true} onChange={(e) => setEmpresaForm({ ...empresaForm, activa: e.target.checked })} />
                      Empresa activa
                    </label>
                  </div>
                </div>
                <div className={styles.divider} />
                <div className={styles.formGroup}>
                  <div className={styles.previewTitle}>Importar Empresas</div>
                  <input ref={empresaFileInputRef} type="file" accept=".json,.csv,.xlsx,.sql" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleProcessEmpresaImportFile(f); }} />
                  <div
                    className={`${styles.dragDropZone} ${empresaDragActive ? styles.dragDropZoneActive : ""}`}
                    onClick={() => empresaFileInputRef.current?.click()}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setEmpresaDragActive(true); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setEmpresaDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setEmpresaDragActive(false); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setEmpresaDragActive(false); const f = e.dataTransfer.files?.[0]; if (f) handleProcessEmpresaImportFile(f); }}
                  >
                    <svg className={styles.dragDropIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-6-4h-6zM4 6h6v4h8v8H4V6z" />
                    </svg>
                    <p className={styles.dragDropLabel}>Arrastra y suelta el archivo aquí, o selecciónalo</p>
                    <p className={styles.dragDropText}>{empresaImportBusy ? 'Procesando...' : (empresaImportMessage || 'Listo')}</p>
                  </div>
                  {selectedEmpresaFileName && (
                    <div className={styles.uploadStatus}><span className={styles.fileName}>Archivo: {selectedEmpresaFileName}</span></div>
                  )}
                  {previewEmpresas.length > 0 && (
                    <div className={styles.previewSection}>
                      <h3>Vista previa de empresas</h3>
                      {previewEmpresas.map((pr, idx) => (
                        <div key={idx} className={styles.previewItem}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" checked={empresaSelectedIndices.has(idx)} onChange={(e) => {
                              setEmpresaSelectedIndices((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(idx); else next.delete(idx);
                                return next;
                              });
                            }} />
                            <span className={styles.previewTitle}>{pr.nombre}</span>
                          </label>
                          <div className={styles.previewRow}>Municipio: {pr.municipio || '—'}</div>
                          <div className={styles.previewRow}>Email: {pr.email || '—'}</div>
                          <div className={styles.previewRow}>Teléfono: {pr.telefono || '—'}</div>
                          <div className={styles.previewRow}>Estado: {pr.activa ? 'Activa' : 'Inactiva'}</div>
                        </div>
                      ))}
                      <div style={{ display:'flex', justifyContent:'flex-end' }}>
                        <button className={styles.primaryButton} disabled={empresaImportBusy || empresaSelectedIndices.size === 0} onClick={handleImportEmpresasSelected}>Importar seleccionadas</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.secondaryButton} onClick={() => setShowEmpresaForm(false)}>Cancelar</button>
                <button className={styles.primaryButton} onClick={handleSaveEmpresa}>{editingEmpresa ? 'Guardar Cambios' : 'Crear Empresa'}</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function ProtectedAdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminPage />
    </ProtectedRoute>
  );
}
