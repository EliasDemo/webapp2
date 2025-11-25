// src/app/features/alumnoinspector/models/alumnoinspector.models.ts

export type Id = number;

/** Errores por campo (422) */
export type FieldErrors = Record<string, string[]>;

/** Forma genérica de error del backend */
export interface ApiFail {
  ok: false;
  code?: string;
  message?: string;
  errors?: FieldErrors;
  error?: string;
  meta?: any;
  choices?: Id[]; // EP-SEDEs sugeridas
}

/* ====================== RESUMEN EP-SEDE ====================== */

export interface AIResumenPeriodo {
  id: Id;
  codigo: string;
  estado?: string | null;
}

export interface AIResumenStats {
  total_expedientes: number;
  total_matriculados: number;
  total_no_matriculados: number;
  total_con_horas_vcm: number;
  total_sin_horas_vcm: number;
  total_horas_vcm_aprobadas: number;
  total_minutos_vcm_aprobados: number;
  total_eventos: number;
  participaciones_eventos: number;
  alumnos_con_eventos: number;
}

export interface AIResumenOk {
  ok: true;
  ep_sede_id: Id;
  periodo: AIResumenPeriodo;
  stats: AIResumenStats;
}

export type AIResumenResponse = AIResumenOk | ApiFail;

/* ====================== ALUMNO DETALLE ====================== */

export interface AIAlumnoExpediente {
  id: Id;
  codigo_estudiante: string | null;
  ep_sede_id: Id;
  estado: string | null;
  ciclo: string | null;
  grupo: string | null;
  correo_institucional: string | null;
}

export interface AIAlumnoUsuario {
  id: Id | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  celular: string | null;
}

export interface AIAlumnoEnvelope {
  expediente: AIAlumnoExpediente;
  usuario: AIAlumnoUsuario;
}

export interface AIMatriculaVM {
  matricula_id: Id;
  periodo_id: Id;
  periodo_codigo: string;
  anio: number;
  ciclo_periodo: number;
  periodo_estado: string | null;
  ciclo_matricula: string | null;
  grupo: string | null;
  modalidad: string | null;
  modo_contrato: string | null;
  fecha_matricula: string | null;
}

/* ---- VCM por período ---- */

export interface AIVcmProyecto {
  proyecto_id: Id | null;
  codigo: string | null;
  titulo: string | null;
  tipo: string | null;
  horas: number;
}

export interface AIVcmPeriodo {
  periodo_id: Id;
  periodo_codigo: string;
  anio: number;
  ciclo_periodo: number;
  periodo_estado: string | null;
  total_minutos: number;
  total_horas: number;
  proyectos: AIVcmProyecto[];
}

/* ---- Eventos ---- */

export interface AIPeriodoRefForEvent {
  codigo: string;
  anio: number;
  ciclo: number;
  estado: string | null;
}

export interface AIEventoParticipacion {
  id: Id;
  estado: string;
  rol: string;
}

export interface AIEventoVM {
  id: Id;
  codigo: string | null;
  titulo: string | null;
  subtitulo: string | null;
  modalidad: string | null;
  estado: string | null;
  periodo_id: Id;
  periodo: AIPeriodoRefForEvent;
  requiere_inscripcion: boolean;
  cupo_maximo: number | null;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  lugar_detallado: string | null;
  url_imagen_portada: string | null;
  url_enlace_virtual: string | null;
  inscripcion_desde: string | null;
  inscripcion_hasta: string | null;
  participacion: AIEventoParticipacion;
}

export interface AIAlumnoOk {
  ok: true;
  ep_sede_id: Id;
  alumno: AIAlumnoEnvelope;
  matriculas: AIMatriculaVM[];
  vcm: AIVcmPeriodo[];
  eventos: AIEventoVM[];
}

export type AIAlumnoResponse = AIAlumnoOk | ApiFail;

/* ====================== PROYECTOS ====================== */

export interface AIProyectoVM {
  id: Id;
  codigo: string | null;
  titulo: string | null;
  horas_planificadas: number | null;
  tipo: string | null;
  estado: string | null;
}

export interface AIProyectosOk {
  ok: true;
  ep_sede_id: Id;
  periodo: { id: Id; codigo: string };
  nivel: number | null;
  vinculados: AIProyectoVM[];
  libres: AIProyectoVM[];
}

export type AIProyectosResponse = AIProyectosOk | ApiFail;

/* ====================== PROYECTOS · INSCRIPCIÓN ====================== */

export interface AIInscribirProyectoOk {
  ok: true;
  data: {
    expediente_id: Id;
    codigo_estudiante: string | null;
    proyecto_id: Id;
    participacion: {
      id: Id;
      participable_type: string;
      participable_id: Id;
      expediente_id: Id;
      rol: string;
      estado: string;
      [key: string]: any;
    };
  };
}

export type AIInscribirProyectoResponse = AIInscribirProyectoOk | ApiFail;

/* ====================== PROYECTOS · ASISTENCIAS ====================== */

export interface AIMarcarAsistenciaRegistro {
  sesion_id: Id;
  proyecto_id: Id;
  proyecto_cod: string | null;
  minutos: number;
  asistencia_id: Id;
}

export interface AIMarcarAsistenciasOk {
  ok: true;
  expediente_id: Id;
  codigo_estudiante: string | null;
  registros: AIMarcarAsistenciaRegistro[];
}

export type AIMarcarAsistenciasResponse = AIMarcarAsistenciasOk | ApiFail;

/* ====================== EVENTOS · INSCRIPCIÓN MANUAL ====================== */

export interface AIInscribirEventoOk {
  ok: true;
  code: string;
  data: {
    participacion: {
      id: Id;
      participable_type: string;
      participable_id: Id;
      expediente_id: Id;
      rol: string;
      estado: string;
      [key: string]: any;
    };
    evento: {
      id: Id;
      requiere_inscripcion: boolean;
      cupo_maximo: number | null;
    };
    alumno: {
      expediente_id: Id;
      codigo_estudiante: string | null;
    };
  };
}

export type AIInscribirEventoResponse = AIInscribirEventoOk | ApiFail;

/* ====================== EVENTOS · UPDATE ESTADO ====================== */

export interface AIUpdateEventoParticipacionOk {
  ok: true;
  code: string;
  data: {
    participacion_id: Id;
    estado: string;
    evento_id: Id;
  };
}

export type AIUpdateEventoParticipacionResponse = AIUpdateEventoParticipacionOk | ApiFail;

/* ====================== PAYLOADS / PARAMS ====================== */

export interface AIResumenParams {
  ep_sede_id?: Id | null;
  periodo_id?: Id | null;
  periodo_codigo?: string | null;
}

export interface AIAlumnoSearchParams {
  ep_sede_id?: Id | null;
  expediente_id?: Id | null;
  codigo?: string | null;
}

export interface AIProyectosPeriodoParams {
  ep_sede_id: Id;
  periodo_codigo: string;
  nivel?: number | null;
}

export interface AIInscribirProyectoPayload {
  ep_sede_id?: Id | null;
  expediente_id?: Id | null;
  codigo?: string | null;
  proyecto_id: Id;
}

export interface AIMarcarAsistenciasPayload {
  ep_sede_id?: Id | null;
  expediente_id?: Id | null;
  codigo?: string | null;
  sesion_ids: Id[];
}

export interface AIInscribirEventoPayload {
  ep_sede_id?: Id | null;
  expediente_id?: Id | null;
  codigo?: string | null;
}
/* ====================== PROYECTO · SESIONES ALUMNO ====================== */

export interface AISesionProyectoAlumno {
  id: Id;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado_sesion: string | null;
  proceso_id: Id;
  proyecto_id: Id;
  asistencia: {
    id: Id | null;
    estado: string | null;
    check_in_at: string | null;
    check_out_at: string | null;
    minutos_validados: number | null;
  } | null;
}

export interface AISesionesProyectoOk {
  ok: true;
  ep_sede_id: Id;
  proyecto_id: Id;
  expediente_id: Id;
  sesiones: AISesionProyectoAlumno[];
}

export type AISesionesProyectoResponse = AISesionesProyectoOk | ApiFail;
