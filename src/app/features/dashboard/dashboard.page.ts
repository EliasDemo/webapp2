import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  DashboardData,
  DashboardContexto,
  DashboardContadores,
  EventoDashboard,
  ProyectoDashboard,
  VmSesionRef,
} from './models/dashboard.models';
import { AlumnoDashboardApiService } from './data-access/dashboard.api';

@Component({
  standalone: true,
  selector: 'alumno-dashboard-page',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.page.html',
})
export class AlumnoDashboardPage {
  private api = inject(AlumnoDashboardApiService);

  loading = signal<boolean>(false);
  error   = signal<string | null>(null);

  data    = signal<DashboardData | null>(null);

  // Para mostrar “Inscribiendo...” en botones específicos
  inscribiendoEventoId   = signal<number | null>(null);
  inscribiendoProyectoId = signal<number | null>(null);

  // ===============================
  // DERIVADOS (SIEMPRE NO-NULL)
  // ===============================

  contexto = computed<DashboardContexto>(() => {
    return this.data()?.contexto ?? {
      expediente_id: 0,
      ep_sede_id: 0,
      periodo: {
        id: 0,
        codigo: '',
        inicio: '',
        fin: '',
        vigente: false,
      },
      ahora: '',
    };
  });

  contadores = computed<DashboardContadores>(() => {
    return this.data()?.contadores ?? {
      proyectos_inscritos: 0,
      horas_validadas_min: 0,
      horas_validadas_h: 0,
      faltas_total: 0,
      faltas_eventos: 0,
      faltas_proyectos: 0,
    };
  });

  eventosInscritos = computed<EventoDashboard[]>(() =>
    this.data()?.eventos.inscritos ?? []
  );

  eventosInscribibles = computed<EventoDashboard[]>(() =>
    this.data()?.eventos.inscribibles ?? []
  );

  proyectosInscritos = computed<ProyectoDashboard[]>(() =>
    this.data()?.proyectos.inscritos ?? []
  );

  proyectosInscribibles = computed<ProyectoDashboard[]>(() =>
    this.data()?.proyectos.inscribibles ?? []
  );

  totalEventosInscritos = computed<number>(() =>
    this.eventosInscritos().length
  );

  totalProyectosInscritos = computed<number>(() =>
    this.proyectosInscritos().length
  );

  constructor() {
    this.loadFeed();
  }

  // ===============================
  // CARGA DE DASHBOARD
  // ===============================

  loadFeed(periodoId?: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getFeed(periodoId).subscribe({
      next: (res) => {
        if (res.ok) {
          this.data.set(res.data);
        } else {
          this.error.set(res.message || 'No se pudo cargar el dashboard.');
        }
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Error de red al cargar dashboard.',
        );
      },
      complete: () => {
        this.loading.set(false);
        this.inscribiendoEventoId.set(null);
        this.inscribiendoProyectoId.set(null);
      },
    });
  }

  // ===============================
  // INSCRIPCIONES
  // ===============================

  inscribirseEvento(e: EventoDashboard): void {
    if (!e.requiere_inscripcion) return;
    this.inscribiendoEventoId.set(e.id);
    this.error.set(null);

    this.api.inscribirEvento(e.id).subscribe({
      next: (res) => {
        if (res.ok) {
          this.loadFeed(this.contexto().periodo.id);
        } else {
          this.error.set(res.message || 'No se pudo inscribir en el evento.');
        }
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Error de red al inscribir en evento.',
        );
        this.inscribiendoEventoId.set(null);
      },
    });
  }

  inscribirseProyecto(p: ProyectoDashboard): void {
    this.inscribiendoProyectoId.set(p.id);
    this.error.set(null);

    this.api.inscribirProyecto(p.id).subscribe({
      next: (res) => {
        if (res.ok) {
          this.loadFeed(this.contexto().periodo.id);
        } else {
          this.error.set(
            res.message || 'No se pudo inscribir en el proyecto.',
          );
        }
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Error de red al inscribir en proyecto.',
        );
        this.inscribiendoProyectoId.set(null);
      },
    });
  }

  // ===============================
  // HELPERS
  // ===============================

  formatoHoras(totalMin: number | undefined | null): string {
    const m = totalMin ?? 0;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (!h && !mm) return '0 h';
    if (!mm) return `${h} h`;
    return `${h} h ${mm} min`;
  }

  // Por ejemplo, siguiente sesión de un evento:
  siguienteSesion(e: EventoDashboard): VmSesionRef | null {
    const hoy = new Date().toISOString().slice(0, 10);
    const futuras = (e.sesiones || []).filter((s) => s.fecha >= hoy);
    return (
      futuras.sort((a, b) =>
        (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio),
      )[0] ?? null
    );
  }

  isInscribiendoEvento(id: number): boolean {
    return this.inscribiendoEventoId() === id;
  }

  isInscribiendoProyecto(id: number): boolean {
    return this.inscribiendoProyectoId() === id;
  }
}
