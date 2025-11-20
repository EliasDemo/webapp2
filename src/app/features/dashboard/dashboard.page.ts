import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { DashboardFacade } from './data/dashboard.facade';
import { InscripcionesApi } from './data/inscripciones.api';
import { DashboardVM, ProyectoLite, EventoLite } from './models/dashboard.models';

@Component({
  selector: 'app-dashboard-alumno',
  templateUrl: './dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnInit, OnDestroy {
  /**
   * Importante: evitamos async pipe para no tocar DestroyRef.
   * Mantenemos una sola suscripción manual y marcamos OnPush.
   */
  vm: DashboardVM | null = null;

  private sub?: Subscription;

  constructor(
    private facade: DashboardFacade,
    private insc: InscripcionesApi,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Suscripción manual al estado (BehaviorSubject emite de inmediato el snapshot inicial)
    this.sub = this.facade.vm$.subscribe((next) => {
      this.vm = next;
      // Forzamos render con estrategia OnPush
      this.cdr.markForCheck();
    });

    // Disparar la carga inicial
    this.facade.load();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ==== Acciones ====
  inscribirProyecto(p: ProyectoLite) {
    if (!p?.id) return;
    this.insc.inscribirProyecto(p.id).subscribe({
      next: () => this.facade.load(),
      error: () => alert('No se pudo inscribir en el proyecto')
    });
  }

  inscribirEvento(e: EventoLite) {
    if (!e?.id) return;
    this.insc.inscribirEvento(e.id).subscribe({
      next: () => this.facade.load(),
      error: () => alert('No se pudo inscribir en el evento')
    });
  }

  // ==== Helpers de UI ====
  pct(v?: number | null) {
    return Math.max(0, Math.min(100, v ?? 0));
  }

  fmtMin(min: number | null | undefined) {
    const m = Math.max(0, +(min ?? 0));
    const h = Math.floor(m / 60);
    const r = Math.floor(m % 60);
    return `${h}h ${r}m`;
  }
}
