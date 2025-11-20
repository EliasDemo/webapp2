// --- Proyecto resumido ---
export interface ProyectoLite {
  id: number;
  codigo?: string | null;
  titulo: string | null;
  subtitulo?: string | null;

  tipo: string;              // vm_proyecto
  tipo_label: string;        // PROYECTO, VINCULADO, LIBRE
  modalidad?: string | null;
  estado?: string | null;

  // metas
  horas_planificadas?: number | null;
  horas_minimas_participante?: number | null;

  // árbol opcional
  procesos?: ProcesoLite[];
  imagenes?: ImagenLite[];
}

// --- Evento resumido ---
export interface EventoLite {
  id: number;
  codigo?: string | null;
  titulo: string | null;
  subtitulo?: string | null;

  modalidad?: string | null;
  estado?: string | null;

  requiere_inscripcion: boolean;
  cupo_maximo?: number | null;

  url_imagen_portada?: string | null;
  url_enlace_virtual?: string | null;

  inscripcion_desde?: string | null;
  inscripcion_hasta?: string | null;

  participacion?: {
    id: number;
    estado: string;
  } | null;
}

// --- Procesos dentro de un proyecto ---
export interface ProcesoLite {
  id: number;
  nombre: string;
  descripcion?: string | null;
  tipo_registro: string;
  horas_asignadas?: number | null;

  sesiones?: SesionLite[];
}

// --- Sesiones ---
export interface SesionLite {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;

  // para barra de próximos eventos/sesiones
  ownerId?: number;
  fuente?: "PROYECTO" | "EVENTO";
  titulo?: string;
}

// --- Imagen de proyecto ---
export interface ImagenLite {
  id: number;
  url: string;
  titulo?: string | null;
}

// --- Contadores del dashboard ---
export interface ContadoresDashboard {
  proyectos_inscritos: number;
  faltas_eventos: number;
  faltas_proyectos: number;
  horas_acumuladas_min: number;
  horas_requeridas_min: number | null;
}

// --- VIEW MODEL PRINCIPAL DEL DASHBOARD ---
export interface DashboardVM {
  loading: boolean;
  error: string | null;

  contexto: any | null;

  contadores: ContadoresDashboard;

  // proyectos
  proyectoActual: ProyectoLite | null;
  proyectosPendientes: any[];
  proyectosInscribibles: ProyectoLite[];
  proyectosLibres: ProyectoLite[];

  // eventos
  eventosInscritos: EventoLite[];
  eventosInscribibles: EventoLite[];

  // sesiones futuras (mezcla de eventos + proyectos)
  proximasSesiones: SesionLite[];
}
