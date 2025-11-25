import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, NgIf, NgFor } from '@angular/common';
import { DashboardApi } from './data-access/dashboard.api';
import {
  DashboardData,
  VmEvento,
  VmProyecto,
  VmEventoFull,
  VmProyectoFull,
} from './models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.page.html',
  imports: [
    CommonModule,  // habilita *ngIf, *ngFor, ngClass, pipes
    NgIf,
    NgFor,
    DecimalPipe,
  ],
})
export class DashboardPage implements OnInit {
  loading = false;
  error: string | null = null;
  data: DashboardData | null = null;

  // pestañas tipo "sección del periódico"
  eventoTab: 'inscritos' | 'inscribibles' = 'inscritos';
  proyectoTab: 'inscritos' | 'inscribibles' = 'inscritos';

  // detalle tipo "artículo"
  selectedEventoBase: VmEvento | null = null;
  selectedEventoFull: VmEventoFull | null = null;
  loadingEventoFull = false;
  eventoSlideIndex = 0;

  selectedProyectoBase: VmProyecto | null = null;
  selectedProyectoFull: VmProyectoFull | null = null;
  loadingProyectoFull = false;
  proyectoSlideIndex = 0;

  // para deshabilitar botón mientras se inscribe
  inscribiendoId: { tipo: 'evento' | 'proyecto'; id: number } | null = null;

  constructor(private dashboardApi: DashboardApi) {}

  ngOnInit(): void {
    this.loadFeed();
  }

  // ───────── feed principal (contexto + contadores + listas resumidas) ─────────

  loadFeed(periodoId?: number): void {
    this.loading = true;
    this.error = null;

    this.dashboardApi.getFeed(periodoId).subscribe({
      next: (resp) => {
        if (!resp.ok) {
          this.error = 'No se pudo cargar el feed del dashboard.';
          this.data = null;
        } else {
          this.data = resp.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar el dashboard', err);
        this.error = 'Ocurrió un error al cargar el dashboard.';
        this.data = null;
        this.loading = false;
      },
    });
  }

  // ───────── getters del feed ─────────

  get eventosInscritos(): VmEvento[] {
    return this.data?.eventos.inscritos ?? [];
  }

  get eventosInscribibles(): VmEvento[] {
    return this.data?.eventos.inscribibles ?? [];
  }

  get proyectosInscritos(): VmProyecto[] {
    return this.data?.proyectos.inscritos ?? [];
  }

  get proyectosInscribibles(): VmProyecto[] {
    return this.data?.proyectos.inscribibles ?? [];
  }

  get contexto() {
    return this.data?.contexto;
  }

  get contadores() {
    return this.data?.contadores;
  }

  // listas filtradas para el "muro"
  get eventosLista(): VmEvento[] {
    return this.eventoTab === 'inscritos'
      ? this.eventosInscritos
      : this.eventosInscribibles;
  }

  get proyectosLista(): VmProyecto[] {
    return this.proyectoTab === 'inscritos'
      ? this.proyectosInscritos
      : this.proyectosInscribibles;
  }

  // ───────── detalle de EVENTO (usa /eventos/{id}/full) ─────────

  verDetalleEvento(ev: VmEvento): void {
    this.selectedEventoBase = ev;
    this.selectedEventoFull = null;
    this.loadingEventoFull = true;
    this.eventoSlideIndex = 0;

    this.dashboardApi.getEventoFull(ev.id).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.selectedEventoFull = resp.data;
        }
        this.loadingEventoFull = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle de evento', err);
        this.loadingEventoFull = false;
      },
    });
  }

  get puedeInscribirseEventoDetalle(): boolean {
    return !!this.selectedEventoBase &&
           !this.selectedEventoBase.progreso &&
           this.selectedEventoBase.requiere_inscripcion;
  }

  inscribirDesdeDetalleEvento(): void {
    if (!this.selectedEventoBase) return;
    this.inscribirEvento(this.selectedEventoBase);
  }

  // carrusel de imágenes del evento seleccionado
  nextEventoImage(): void {
    if (!this.selectedEventoFull || !this.selectedEventoFull.imagenes?.length) return;
    const total = this.selectedEventoFull.imagenes.length;
    this.eventoSlideIndex = (this.eventoSlideIndex + 1) % total;
  }

  prevEventoImage(): void {
    if (!this.selectedEventoFull || !this.selectedEventoFull.imagenes?.length) return;
    const total = this.selectedEventoFull.imagenes.length;
    this.eventoSlideIndex = (this.eventoSlideIndex - 1 + total) % total;
  }

  // ───────── detalle de PROYECTO (usa /proyectos/{id}/full) ─────────

  verDetalleProyecto(p: VmProyecto): void {
    this.selectedProyectoBase = p;
    this.selectedProyectoFull = null;
    this.loadingProyectoFull = true;
    this.proyectoSlideIndex = 0;

    this.dashboardApi.getProyectoFull(p.id).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.selectedProyectoFull = resp.data;
        }
        this.loadingProyectoFull = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle de proyecto', err);
        this.loadingProyectoFull = false;
      },
    });
  }

  get puedeInscribirseProyectoDetalle(): boolean {
    // según tu modelo: en inscribibles progreso === null
    return !!this.selectedProyectoBase &&
           this.selectedProyectoBase.progreso === null;
  }

  inscribirDesdeDetalleProyecto(): void {
    if (!this.selectedProyectoBase) return;
    this.inscribirProyecto(this.selectedProyectoBase);
  }

  // carrusel de imágenes del proyecto seleccionado
  nextProyectoImage(): void {
    if (!this.selectedProyectoFull || !this.selectedProyectoFull.imagenes?.length) return;
    const total = this.selectedProyectoFull.imagenes.length;
    this.proyectoSlideIndex = (this.proyectoSlideIndex + 1) % total;
  }

  prevProyectoImage(): void {
    if (!this.selectedProyectoFull || !this.selectedProyectoFull.imagenes?.length) return;
    const total = this.selectedProyectoFull.imagenes.length;
    this.proyectoSlideIndex = (this.proyectoSlideIndex - 1 + total) % total;
  }

  // ───────── helpers de info de proyecto (niveles, sesiones) ─────────

  getProyectoNiveles(p: VmProyectoFull): string {
    if (!p.ciclos || !p.ciclos.length) return 'N/D';
    const niveles = Array.from(new Set(p.ciclos.map(c => c.nivel)));
    return niveles.join(', ');
  }

  getProyectoTotalSesiones(p: VmProyectoFull): number {
    if (!p.procesos || !p.procesos.length) return 0;
    return p.procesos.reduce((acc, pr) => acc + (pr.sesiones?.length || 0), 0);
  }

  // ───────── acciones de inscripción (reutilizadas) ─────────

  inscribirEvento(ev: VmEvento): void {
    this.inscribiendoId = { tipo: 'evento', id: ev.id };
    this.error = null;

    this.dashboardApi.inscribirEnEvento(ev.id).subscribe({
      next: () => {
        this.loadFeed();        // refresca listas y contadores
        this.inscribiendoId = null;
      },
      error: (err) => {
        console.error('Error al inscribirse en evento', err);
        this.error = err?.error?.message || 'No se pudo completar la inscripción al evento.';
        this.inscribiendoId = null;
      },
    });
  }

  inscribirProyecto(p: VmProyecto): void {
    this.inscribiendoId = { tipo: 'proyecto', id: p.id };
    this.error = null;

    this.dashboardApi.inscribirEnProyecto(p.id).subscribe({
      next: () => {
        this.loadFeed();
        this.inscribiendoId = null;
      },
      error: (err) => {
        console.error('Error al inscribirse en proyecto', err);
        this.error = err?.error?.message || 'No se pudo completar la inscripción al proyecto.';
        this.inscribiendoId = null;
      },
    });
  }
}
