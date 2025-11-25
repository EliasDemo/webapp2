// dashboard.models.ts
import type { Id } from '../../matriculas/models/m.models'; // o define tu propio Id = number

// ---------- Respuesta feed ----------
export interface DashboardContexto {
  expediente_id: Id;
  ep_sede_id: Id;
  periodo: {
    id: Id;
    codigo: string | number;
    inicio: string; // YYYY-MM-DD
    fin: string;    // YYYY-MM-DD
    vigente: boolean;
  };
  ahora: string;    // 'YYYY-MM-DD HH:mm:ss'
}

export interface DashboardContadores {
  proyectos_inscritos: number;
  horas_validadas_min: number;
  horas_validadas_h: number;
  faltas_total: number;
  faltas_eventos: number;
  faltas_proyectos: number;
}

// ------- Eventos -------
export interface VmSesionRef {
  id: Id;
  fecha: string;       // YYYY-MM-DD
  hora_inicio: string; // HH:mm:ss
  hora_fin: string;    // HH:mm:ss
  estado: string;
}

export interface VmImagenRef {
  id: Id;
  url: string;
  path: string | null;
  titulo: string | null;
}

export interface EventoDashboard {
  id: Id;
  codigo: string | null;
  titulo: string;
  subtitulo?: string | null;
  estado: string;
  modalidad: string | null;
  periodo_id: Id;
  requiere_inscripcion: boolean;
  cupo_maximo: number | null;
  descripcion_corta?: string | null;
  descripcion_larga?: string | null;
  lugar_detallado?: string | null;
  url_imagen_portada?: string | null;
  url_enlace_virtual?: string | null;
  inscripcion_desde?: string | null;
  inscripcion_hasta?: string | null;
  imagenes: VmImagenRef[];
  sesiones: VmSesionRef[];
  // Solo para inscritos:
  progreso?: {
    asistidas: number;
    totales: number;
    porcentaje: number;
  } | null;
  participacion?: {
    estado: string;
  } | null;
}

// ------- Proyectos -------
export interface ProyectoProcesoSesionRef extends VmSesionRef {}

export interface ProyectoProcesoRef {
  id: Id;
  nombre: string;
  descripcion?: string | null;
  tipo?: string | null;
  nota_minima?: number | null;
  estado: string;
  sesiones: ProyectoProcesoSesionRef[];
}

export interface ProyectoDashboard {
  id: Id;
  codigo: string | null;
  titulo: string;
  estado: string;
  tipo: string;        // LIBRE / VINCULADO / PROYECTO
  modalidad: string | null;
  periodo_id: Id;
  descripcion?: string | null;
  imagenes: VmImagenRef[];
  ciclos: number[];    // niveles/ciclos
  procesos: ProyectoProcesoRef[];
  progreso?: {
    min_validados: number;
    min_requeridos: number;
    porcentaje: number;
  } | null;
  participacion?: {
    estado: string;
  } | null;
}

export interface DashboardData {
  contexto: DashboardContexto;
  contadores: DashboardContadores;
  eventos: {
    inscritos: EventoDashboard[];
    inscribibles: EventoDashboard[];
  };
  proyectos: {
    inscritos: ProyectoDashboard[];
    inscribibles: ProyectoDashboard[];
  };
}

export type DashboardFeedOk = { ok: true; data: DashboardData };
export type DashboardFeedFail = { ok: false; message?: string };
export type DashboardFeedResponse = DashboardFeedOk | DashboardFeedFail;

// ---------- Respuestas de inscripción ----------
export interface InscribirEventoOk {
  ok: true;
  code: 'ENROLLED';
  data: {
    participacion: any;
    evento: {
      id: Id;
      requiere_inscripcion: boolean;
      cupo_maximo: number | null;
    };
  };
}
export type InscribirEventoFail = { ok: false; code: string; message: string; meta?: any };
export type InscribirEventoResponse = InscribirEventoOk | InscribirEventoFail;

export interface InscribirProyectoOk {
  ok: true;
  code: 'ENROLLED';
  data: {
    participacion: any;
    proyecto: {
      id: Id;
      tipo: 'LIBRE' | 'VINCULADO' | string;
      nivel: number | null;
    };
  };
}
export type InscribirProyectoFail = { ok: false; code: string; message: string; meta?: any };
export type InscribirProyectoResponse = InscribirProyectoOk | InscribirProyectoFail;
