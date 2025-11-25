// src/app/features/alumnoinspector/pages/alumno/ai-alumno.page.ts
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AlumnoInspectorApiService } from '../../data-access/alumnoinspector.api';
import {
  AIAlumnoOk,
  AIAlumnoResponse,
  AIAlumnoEnvelope,
  AIMatriculaVM,
  AIVcmPeriodo,
  AIEventoVM,
  AIProyectosOk,
  AIProyectosResponse,
  AIProyectoVM,
  AISesionProyectoAlumno,
  AISesionesProyectoResponse,
  Id,
} from '../../models/alumnoinspector.models';

type AlumnoProyectoResumen = {
  proyecto_id: Id;
  proyecto_codigo: string | null;
  proyecto_titulo: string | null;
  tipo: string | null;
  periodo_codigo: string;
  total_horas: number;
};

@Component({
  standalone: true,
  selector: 'ai-alumno-page',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ai-alumno.page.html',
})
export class AIAlumnoPage {
  private api = inject(AlumnoInspectorApiService);

  // Estado global
  loading = signal<boolean>(false);
  error   = signal<string | null>(null);

  // EP-SEDE resuelta / sugerida
  epSedeId = signal<number | null>(null);
  choices  = signal<Id[] | null>(null);

  // Búsqueda
  searchCodigo        = signal<string>('');
  searchExpedienteId  = signal<number | null>(null);

  // Datos principales del alumno
  alumnoData   = signal<AIAlumnoEnvelope | null>(null);
  matriculas   = signal<AIMatriculaVM[]>([]);
  vcmPeriodos  = signal<AIVcmPeriodo[]>([]);
  eventos      = signal<AIEventoVM[]>([]);

  // ==== Catálogo de proyectos del alumno (derivado de vcm) ====
  proyectosAlumno = computed<AlumnoProyectoResumen[]>(() => {
    const out: AlumnoProyectoResumen[] = [];
    const seen = new Set<string>();

    for (const per of this.vcmPeriodos()) {
      for (const pr of per.proyectos) {
        if (!pr.proyecto_id) continue;
        const key = `${per.periodo_codigo}|${pr.proyecto_id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          proyecto_id: pr.proyecto_id,
          proyecto_codigo: pr.codigo,
          proyecto_titulo: pr.titulo,
          tipo: pr.tipo,
          periodo_codigo: per.periodo_codigo,
          total_horas: pr.horas,
        });
      }
    }

    return out.sort((a, b) => {
      const ak = a.periodo_codigo;
      const bk = b.periodo_codigo;
      if (ak === bk) {
        return (a.proyecto_codigo || '').localeCompare(b.proyecto_codigo || '');
      }
      return ak.localeCompare(bk);
    });
  });

  // Proyecto seleccionado + sus sesiones (con asistencia del alumno)
  selectedProyecto = signal<AlumnoProyectoResumen | null>(null);
  sesionesProyecto = signal<AISesionProyectoAlumno[]>([]);

  // ==== Acciones manuales extra ====
  proyectosPeriodo           = signal<AIProyectosOk | null>(null);
  selectedMatriculaPeriodoId = signal<number | null>(null);
  sesionIdsTexto             = signal<string>('');   // textarea de respaldo
  eventoIdManual             = signal<number | null>(null);
  accionesError              = signal<string | null>(null);

  // Derivados
  tieneDatos = computed<boolean>(() => !!this.alumnoData());

  constructor() {}

  // ========= Búsqueda de alumno =========
  buscarAlumno(): void {
    this.error.set(null);
    this.accionesError.set(null);
    this.alumnoData.set(null);
    this.matriculas.set([]);
    this.vcmPeriodos.set([]);
    this.eventos.set([]);
    this.choices.set(null);
    this.proyectosPeriodo.set(null);
    this.selectedMatriculaPeriodoId.set(null);
    this.selectedProyecto.set(null);
    this.sesionesProyecto.set([]);
    this.sesionIdsTexto.set('');
    this.eventoIdManual.set(null);

    const epSede = this.epSedeId();
    const codigo = this.searchCodigo().trim();
    const expId  = this.searchExpedienteId();

    if (!codigo && !expId) {
      this.error.set('Ingresa un código de estudiante o un ID de expediente.');
      return;
    }

    this.loading.set(true);

    this.api.getAlumno({
      ep_sede_id: epSede ?? undefined,
      expediente_id: expId ?? undefined,
      codigo: codigo || undefined,
    }).subscribe({
      next: (res: AIAlumnoResponse) => {
        if (res.ok) {
          const ok = res as AIAlumnoOk;
          this.alumnoData.set(ok.alumno);
          this.matriculas.set(ok.matriculas || []);
          this.vcmPeriodos.set(ok.vcm || []);
          this.eventos.set(ok.eventos || []);

          // seleccionar por defecto el último período de matrícula
          const mats = ok.matriculas || [];
          if (mats.length) {
            const last = mats[mats.length - 1];
            this.selectedMatriculaPeriodoId.set(last.periodo_id);
          }
        } else {
          const fail = res as any;
          this.error.set(fail?.message || 'No se pudo cargar la información del alumno.');
          if (Array.isArray(fail?.choices) && fail.choices.length) {
            this.choices.set(fail.choices);
          }
        }
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Error de red al cargar el alumno.');
      },
      complete: () => this.loading.set(false),
    });
  }

  usarEpSede(id: Id): void {
    this.epSedeId.set(id);
    this.error.set(null);
    this.accionesError.set(null);
  }

  // ========= Eventos · actualizar estado =========
  actualizarEstadoEvento(ev: AIEventoVM, estado: string): void {
    if (!estado || estado === ev.participacion.estado) return;

    this.loading.set(true);
    this.error.set(null);
    this.accionesError.set(null);

    this.api.actualizarEstadoParticipacionEvento(ev.participacion.id, estado).subscribe({
      next: (res) => {
        if (res.ok) {
          const nuevos = this.eventos().map(e =>
            e.participacion.id === ev.participacion.id
              ? { ...e, participacion: { ...e.participacion, estado } }
              : e
          );
          this.eventos.set(nuevos);
        } else {
          const fail = res as any;
          this.error.set(fail?.message || 'No se pudo actualizar el estado de participación.');
        }
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Error al actualizar el estado de participación.');
      },
      complete: () => this.loading.set(false),
    });
  }

  // ========= Catálogo de proyectos → sesiones del proyecto =========
  seleccionarProyecto(p: AlumnoProyectoResumen): void {
    this.selectedProyecto.set(p);
    this.sesionesProyecto.set([]);
    this.accionesError.set(null);

    const a = this.alumnoData();
    if (!a) {
      this.accionesError.set('Primero busca un alumno.');
      return;
    }

    const epSede = this.epSedeId() ?? a.expediente.ep_sede_id;

    this.loading.set(true);

    this.api.getSesionesProyectoAlumno(p.proyecto_id, {
      ep_sede_id: epSede,
      expediente_id: a.expediente.id,
    }).subscribe({
      next: (res: AISesionesProyectoResponse) => {
        if (res.ok) {
          this.sesionesProyecto.set(res.sesiones || []);
        } else {
          const fail = res as any;
          this.accionesError.set(fail?.message || 'No se pudieron cargar las sesiones del proyecto.');
        }
      },
      error: (err: any) => {
        this.accionesError.set(err?.error?.message || 'Error de red al cargar sesiones.');
      },
      complete: () => this.loading.set(false),
    });
  }

  marcarAsistenciaSesion(s: AISesionProyectoAlumno): void {
    const a = this.alumnoData();
    if (!a) {
      this.accionesError.set('Primero busca un alumno.');
      return;
    }

    const epSede = this.epSedeId() ?? a.expediente.ep_sede_id;

    this.loading.set(true);
    this.accionesError.set(null);

    this.api.marcarAsistenciasProyecto({
      ep_sede_id: epSede,
      expediente_id: a.expediente.id,
      sesion_ids: [s.id],
    }).subscribe({
      next: (res) => {
        if (res.ok) {
          // recargar sesiones del proyecto seleccionado
          const sel = this.selectedProyecto();
          if (sel) this.seleccionarProyecto(sel);
        } else {
          const fail = res as any;
          this.accionesError.set(fail?.message || 'No se pudo marcar la asistencia.');
        }
      },
      error: (err: any) => {
        this.accionesError.set(err?.error?.message || 'Error de red al marcar asistencia.');
      },
      complete: () => this.loading.set(false),
    });
  }

  // ========= Proyectos por período/nivel (catálogo general) =========
  cargarProyectosPeriodoDesdeMatricula(): void {
    this.accionesError.set(null);
    const a = this.alumnoData();
    const mats = this.matriculas();

    if (!a) {
      this.accionesError.set('Primero busca un alumno.');
      return;
    }
    if (!mats.length) {
      this.accionesError.set('El alumno no tiene matrículas registradas.');
      return;
    }

    const periodoId = this.selectedMatriculaPeriodoId() ?? mats[0].periodo_id;
    const m = mats.find(x => x.periodo_id === periodoId);
    if (!m) {
      this.accionesError.set('Período seleccionado inválido.');
      return;
    }

    const nivel = m.ciclo_matricula
      ? parseInt(m.ciclo_matricula, 10) || null
      : (a.expediente.ciclo ? parseInt(a.expediente.ciclo, 10) || null : null);

    const epSede = this.epSedeId() ?? a.expediente.ep_sede_id;

    this.loading.set(true);

    this.api.getProyectosPeriodo({
      ep_sede_id: epSede,
      periodo_codigo: m.periodo_codigo,
      nivel: nivel ?? undefined,
    }).subscribe({
      next: (res: AIProyectosResponse) => {
        if (res.ok) {
          this.proyectosPeriodo.set(res as AIProyectosOk);
        } else {
          const fail = res as any;
          this.accionesError.set(fail?.message || 'No se pudieron cargar los proyectos del período.');
        }
      },
      error: (err: any) => {
        this.accionesError.set(err?.error?.message || 'Error de red al cargar proyectos.');
      },
      complete: () => this.loading.set(false),
    });
  }

  inscribirEnProyectoDesdeLista(p: AIProyectoVM): void {
    const a = this.alumnoData();
    if (!a) {
      this.accionesError.set('Primero busca un alumno.');
      return;
    }

    const epSede = this.epSedeId() ?? a.expediente.ep_sede_id;

    this.loading.set(true);
    this.accionesError.set(null);

    this.api.inscribirEnProyecto({
      ep_sede_id: epSede,
      expediente_id: a.expediente.id,
      proyecto_id: p.id,
    }).subscribe({
      next: (res) => {
        if (res.ok) {
          this.buscarAlumno();
        } else {
          const fail = res as any;
          this.accionesError.set(fail?.message || 'No se pudo inscribir al alumno en el proyecto.');
        }
      },
      error: (err: any) => {
        this.accionesError.set(err?.error?.message || 'Error de red al inscribir en proyecto.');
      },
      complete: () => this.loading.set(false),
    });
  }

  // ========= Asistencias manuales (IDs de sesión) =========
  marcarAsistenciasDesdeTexto(): void {
    const a = this.alumnoData();
    if (!a) {
      this.accionesError.set('Primero busca un alumno.');
      return;
    }

    const texto = this.sesionIdsTexto().trim();
    if (!texto) {
      this.accionesError.set('Ingresa uno o más IDs de sesión separados por coma.');
      return;
    }

    const partes = texto.split(',').map(v => v.trim()).filter(v => v.length > 0);
    const ids: number[] = [];
    for (const p of partes) {
      const n = Number(p);
      if (!Number.isFinite(n) || n <= 0) {
        this.accionesError.set(`ID de sesión inválido: "${p}".`);
        return;
      }
      ids.push(n);
    }
    if (!ids.length) {
      this.accionesError.set('No se encontraron IDs de sesión válidos.');
      return;
    }

    const epSede = this.epSedeId() ?? a.expediente.ep_sede_id;

    this.loading.set(true);
    this.accionesError.set(null);

    this.api.marcarAsistenciasProyecto({
      ep_sede_id: epSede,
      expediente_id: a.expediente.id,
      sesion_ids: ids,
    }).subscribe({
      next: (res) => {
        if (res.ok) {
          this.buscarAlumno();
          this.sesionIdsTexto.set('');
        } else {
          const fail = res as any;
          this.accionesError.set(fail?.message || 'No se pudieron marcar las asistencias.');
        }
      },
      error: (err: any) => {
        this.accionesError.set(err?.error?.message || 'Error de red al marcar asistencias.');
      },
      complete: () => this.loading.set(false),
    });
  }

  // ========= Inscribir en evento manualmente =========
  inscribirEventoManual(): void {
    const a = this.alumnoData();
    const eventoId = this.eventoIdManual();

    if (!a) {
      this.accionesError.set('Primero busca un alumno.');
      return;
    }
    if (!eventoId || eventoId <= 0) {
      this.accionesError.set('Ingresa un ID de evento válido.');
      return;
    }

    const epSede = this.epSedeId() ?? a.expediente.ep_sede_id;

    this.loading.set(true);
    this.accionesError.set(null);

    this.api.inscribirEnEventoManual(eventoId, {
      ep_sede_id: epSede,
      expediente_id: a.expediente.id,
    }).subscribe({
      next: (res) => {
        if (res.ok) {
          this.buscarAlumno();
          this.eventoIdManual.set(null);
        } else {
          const fail = res as any;
          this.accionesError.set(fail?.message || 'No se pudo inscribir al alumno en el evento.');
        }
      },
      error: (err: any) => {
        this.accionesError.set(err?.error?.message || 'Error de red al inscribir en evento.');
      },
      complete: () => this.loading.set(false),
    });
  }

  // ========= Helpers UI =========
  eventoEstadoBadge(ev: AIEventoVM): string {
    const st = (ev.participacion.estado || '').toUpperCase();
    if (st === 'FINALIZADO') return 'bg-emerald-100 text-emerald-700';
    if (st === 'CONFIRMADO') return 'bg-blue-100 text-blue-700';
    if (st === 'CANCELADO')  return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  }

  trackMatricula = (_: number, m: AIMatriculaVM) => m.matricula_id;
  trackVcm       = (_: number, p: AIVcmPeriodo)   => p.periodo_id;
  trackEvento    = (_: number, e: AIEventoVM)    => e.id;
  trackSesion    = (_: number, s: AISesionProyectoAlumno) => s.id;
}
