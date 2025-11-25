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
  Id,
} from '../../models/alumnoinspector.models';

@Component({
  standalone: true,
  selector: 'ai-alumno-page',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ai-alumno.page.html',
})
export class AIAlumnoPage {
  private api = inject(AlumnoInspectorApiService);

  loading = signal<boolean>(false);
  error   = signal<string | null>(null);

  epSedeId = signal<number | null>(null);
  choices  = signal<Id[] | null>(null);

  searchCodigo        = signal<string>('');
  searchExpedienteId  = signal<number | null>(null);

  alumnoData   = signal<AIAlumnoEnvelope | null>(null);
  matriculas   = signal<AIMatriculaVM[]>([]);
  vcmPeriodos  = signal<AIVcmPeriodo[]>([]);
  eventos      = signal<AIEventoVM[]>([]);

  tieneDatos = computed<boolean>(() => !!this.alumnoData());

  constructor() {}

  buscarAlumno(): void {
    this.error.set(null);
    this.alumnoData.set(null);
    this.matriculas.set([]);
    this.vcmPeriodos.set([]);
    this.eventos.set([]);
    this.choices.set(null);

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
  }

  actualizarEstadoEvento(ev: AIEventoVM, estado: string): void {
    if (!estado || estado === ev.participacion.estado) return;

    this.loading.set(true);
    this.error.set(null);

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

  // Helpers
  eventoEstadoBadge(ev: AIEventoVM): string {
    const st = (ev.participacion.estado || '').toUpperCase();
    if (st === 'FINALIZADO') return 'bg-emerald-100 text-emerald-700';
    if (st === 'CONFIRMADO') return 'bg-blue-100 text-blue-700';
    if (st === 'CANCELADO')  return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  }

  trackMatricula = (_: number, m: AIMatriculaVM) => m.matricula_id;
  trackVcm = (_: number, p: AIVcmPeriodo) => p.periodo_id;
  trackEvento = (_: number, e: AIEventoVM) => e.id;
}
