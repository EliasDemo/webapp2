// src/app/features/alumnoinspector/pages/resumen/ai-resumen.page.ts
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AlumnoInspectorApiService } from '../../data-access/alumnoinspector.api';
import {
  AIResumenOk,
  AIResumenResponse,
  Id,
} from '../../models/alumnoinspector.models';

import { LookupsApiService } from '../../../vm/lookups/lookups.api';

type PeriodoVM = { id: number; anio: number; ciclo: string; estado?: string };

@Component({
  standalone: true,
  selector: 'ai-resumen-page',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ai-resumen.page.html',
})
export class AIResumenPage {
  private api = inject(AlumnoInspectorApiService);
  private lookups = inject(LookupsApiService);

  loading = signal<boolean>(false);
  error   = signal<string | null>(null);

  periodos = signal<PeriodoVM[]>([]);
  selectedPeriodoId = signal<number | null>(null);

  epSedeId = signal<number | null>(null);
  choices  = signal<Id[] | null>(null);

  resumen  = signal<AIResumenOk | null>(null);

  selectedPeriodo = computed<PeriodoVM | null>(() => {
    const id = this.selectedPeriodoId();
    return this.periodos().find(p => p.id === id) ?? null;
  });

  porcentajeConHoras = computed<number>(() => {
    const r = this.resumen();
    if (!r) return 0;
    const total = r.stats.total_matriculados || 0;
    if (!total) return 0;
    return +(100 * (r.stats.total_con_horas_vcm / total)).toFixed(1);
  });

  porcentajeAlumnosEventos = computed<number>(() => {
    const r = this.resumen();
    if (!r) return 0;
    const total = r.stats.total_matriculados || 0;
    if (!total) return 0;
    return +(100 * (r.stats.alumnos_con_eventos / total)).toFixed(1);
  });

  constructor() {
    this.loadPeriodos();
  }

  private loadPeriodos(): void {
    this.lookups.fetchPeriodos('', false, 50).subscribe({
      next: (arr: PeriodoVM[]) => {
        const ordered = [...arr].sort((a, b) => {
          const ak = `${String(a.anio).padStart(4, '0')}-${String(a.ciclo).padStart(2, '0')}`;
          const bk = `${String(b.anio).padStart(4, '0')}-${String(b.ciclo).padStart(2, '0')}`;
          return bk.localeCompare(ak);
        });
        this.periodos.set(ordered);
        const actual = ordered.find(p => (p.estado || '').toUpperCase() === 'EN_CURSO');
        if (actual) this.selectedPeriodoId.set(actual.id);
      },
      error: () => this.periodos.set([]),
    });
  }

  cargarResumen(): void {
    this.error.set(null);
    this.resumen.set(null);
    this.choices.set(null);

    const periodoId = this.selectedPeriodoId();

    if (!periodoId) {
      this.error.set('Selecciona un período académico.');
      return;
    }

    this.loading.set(true);

    this.api.getResumen({
      ep_sede_id: this.epSedeId() ?? undefined,
      periodo_id: periodoId,
    }).subscribe({
      next: (res: AIResumenResponse) => {
        if (res.ok) {
          this.resumen.set(res as AIResumenOk);
        } else {
          const fail = res as any;
          this.error.set(fail?.message || 'No se pudo obtener el resumen.');
          if (Array.isArray(fail?.choices) && fail.choices.length) {
            this.choices.set(fail.choices);
          }
        }
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Error de red al cargar el resumen.');
      },
      complete: () => this.loading.set(false),
    });
  }

  // Helpers UI
  usarEpSede(id: Id): void {
    this.epSedeId.set(id);
    this.error.set(null);
  }

  chipBadgeClass(): string {
    return 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold';
  }
}
