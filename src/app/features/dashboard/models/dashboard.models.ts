// dashboard.models.ts

// Respuesta completa del backend para /alumno/feed
export interface DashboardFeedResponse {
  ok: boolean;
  data: DashboardData;
}

// Nodo principal "data"
export interface DashboardData {
  contexto: DashboardContexto;
  contadores: DashboardContadores;
  eventos: {
    inscritos: VmEvento[];
    inscribibles: VmEvento[];
  };
  proyectos: {
    inscritos: VmProyecto[];
    inscribibles: VmProyecto[];
  };
}

// ───────────────── contexto ─────────────────

export interface DashboardContexto {
  expediente_id: number;
  ep_sede_id: number;
  periodo: DashboardPeriodo;
  ahora: string; // "YYYY-MM-DD HH:mm:ss"
}

export interface DashboardPeriodo {
  id: number;
  codigo: string | number;
  inicio: string;
  fin: string;
  vigente: boolean;
}

// ───────────────── contadores ─────────────────

export interface DashboardContadores {
  proyectos_inscritos: number;
  horas_validadas_min: number;
  horas_validadas_h: number;
  faltas_total: number;
  faltas_eventos: number;
  faltas_proyectos: number;
}

// ───────────────── eventos ─────────────────

export interface VmEventoImagen {
  id: number;
  url: string;
  path: string | null;
  titulo: string | null;
}

export interface VmSesion {
  id: number;
  fecha: string;       // "YYYY-MM-DD"
  hora_inicio: string; // "HH:MM:SS"
  hora_fin: string;    // "HH:MM:SS"
  estado: string;
}

export interface VmEventoProgreso {
  asistidas: number;
  totales: number;
  porcentaje: number;
}

export interface VmEventoVentana {
  desde: string | null;
  hasta: string | null;
}

export interface VmEventoParticipacion {
  estado: string;
}

export interface VmEvento {
  id: number;
  codigo: string;
  titulo: string;
  subtitulo: string | null;
  estado: string;
  modalidad: string | null;
  periodo_id: number;
  requiere_inscripcion: boolean;
  cupo_maximo: number | null;

  descripcion_corta: string | null;
  descripcion_larga: string | null;
  lugar_detallado: string | null;
  url_imagen_portada: string | null;
  url_enlace_virtual: string | null;
  inscripcion_desde: string | null;
  inscripcion_hasta: string | null;

  imagenes: VmEventoImagen[];
  sesiones: VmSesion[];

  // En inscritos viene; en inscribibles no
  progreso?: VmEventoProgreso;
  participacion?: VmEventoParticipacion | null;

  // En inscribibles viene esta ventana
  ventana?: VmEventoVentana;
}

// ───────────────── proyectos ─────────────────

export interface VmProyectoImagen {
  id: number;
  url: string;
  path: string | null;
  titulo: string | null;
}

export interface VmSesionProceso {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
}

export interface VmProceso {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: string | null; // tipo_registro
  nota_minima: number | null;
  estado: string;
  sesiones: VmSesionProceso[];
}

export interface VmProyectoProgreso {
  min_validados: number;
  min_requeridos: number;
  porcentaje: number;
}

export interface VmProyectoParticipacion {
  estado: string;
}

export interface VmProyecto {
  id: number;
  codigo: string;
  titulo: string;
  estado: string;
  tipo: string;
  modalidad: string | null;
  periodo_id: number;
  descripcion: string | null;

  imagenes: VmProyectoImagen[];
  ciclos: number[];

  // En inscritos vienen procesos; en inscribibles es []
  procesos: VmProceso[];

  // En inscritos objeto; en inscribibles null
  progreso: VmProyectoProgreso | null;
  participacion: VmProyectoParticipacion | null;
}
