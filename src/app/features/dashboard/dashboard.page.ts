import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { DashboardFacade } from './data/dashboard.facade';
import { InscripcionesApi } from './data/inscripciones.api';
import { Observable } from 'rxjs';
import { DashboardVM, ProyectoLite, EventoLite } from './models/dashboard.models';

@Component({
  selector: 'app-dashboard-alumno',
  templateUrl: './dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnInit {
  vm$!: Observable<DashboardVM>;

  constructor(private facade: DashboardFacade, private insc: InscripcionesApi) {}

  ngOnInit(): void {
    this.vm$ = this.facade.vm$;
    this.facade.load();
  }

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

  pct(v?: number | null) {
    return Math.max(0, Math.min(100, v ?? 0));
  }

  fmtMin(min: number | null | undefined) {
    const m = Math.max(0, +(min ?? 0));
    const h = Math.floor(m / 60);
    const r = m % 60;
    return `${h}h ${r}m`;
  }
}
