import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, NgIf, NgFor } from '@angular/common';
import { forkJoin } from 'rxjs';

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
    CommonModule,
    NgIf,
    NgFor,
    DecimalPipe,
  ],
})
export class DashboardPage implements OnInit {
  loading = false;
  error: string | null = null;
  data: DashboardData | null = null;

  // muro / blog
  eventosFull: VmEventoFull[] = [];
  proyectosFull: VmProyectoFull[] = [];
  loadingFull = false;

  // para deshabilitar botón mientras se inscribe
  inscribiendoId: { tipo: 'evento' | 'proyecto'; id: number } | null = null;

  // carrusel por card
  private eventoSlideIndex: { [id: number]: number } = {};
  private proyectoSlideIndex: { [id: number]: number } = {};

  constructor(private dashboardApi: DashboardApi) {}

  ngOnInit(): void {
    this.loadFeed();
    this.loadFull(); // carga las listas FULL para el muro/blog
  }

  // ───────── feed principal (contexto + contadores + inscritos/inscribibles) ─────────

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

  // ───────── muro de noticias: FULL ─────────

  loadFull(): void {
    this.loadingFull = true;

    forkJoin({
      eventos: this.dashboardApi.getEventosFull(),
      proyectos: this.dashboardApi.getProyectosFull(),
    }).subscribe({
      next: (res) => {
        this.eventosFull = res.eventos.data;
        this.proyectosFull = res.proyectos.data;
        this.loadingFull = false;
      },
      error: (err) => {
        console.error('Error al cargar listas full', err);
        // no pisamos el error general del feed
        this.loadingFull = false;
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

  // ───────── acciones de inscripción ─────────

  inscribirEvento(ev: VmEvento): void {
    this.inscribiendoId = { tipo: 'evento', id: ev.id };
    this.error = null;

    this.dashboardApi.inscribirEnEvento(ev.id).subscribe({
      next: () => {
        this.loadFeed();
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

  // ───────── helpers de carrusel (eventos) ─────────

  getEventoSlideIndex(ev: VmEventoFull): number {
    const idx = this.eventoSlideIndex[ev.id];
    if (idx == null || idx < 0 || idx >= (ev.imagenes?.length || 0)) {
      return 0;
    }
    return idx;
  }

  nextEventoImage(ev: VmEventoFull): void {
    if (!ev.imagenes || ev.imagenes.length < 2) return;
    const current = this.getEventoSlideIndex(ev);
    const next = (current + 1) % ev.imagenes.length;
    this.eventoSlideIndex[ev.id] = next;
  }

  prevEventoImage(ev: VmEventoFull): void {
    if (!ev.imagenes || ev.imagenes.length < 2) return;
    const current = this.getEventoSlideIndex(ev);
    const next = (current - 1 + ev.imagenes.length) % ev.imagenes.length;
    this.eventoSlideIndex[ev.id] = next;
  }

  // ───────── helpers de carrusel (proyectos) ─────────

  getProyectoSlideIndex(p: VmProyectoFull): number {
    const idx = this.proyectoSlideIndex[p.id];
    if (idx == null || idx < 0 || idx >= (p.imagenes?.length || 0)) {
      return 0;
    }
    return idx;
  }

  nextProyectoImage(p: VmProyectoFull): void {
    if (!p.imagenes || p.imagenes.length < 2) return;
    const current = this.getProyectoSlideIndex(p);
    const next = (current + 1) % p.imagenes.length;
    this.proyectoSlideIndex[p.id] = next;
  }

  prevProyectoImage(p: VmProyectoFull): void {
    if (!p.imagenes || p.imagenes.length < 2) return;
    const current = this.getProyectoSlideIndex(p);
    const next = (current - 1 + p.imagenes.length) % p.imagenes.length;
    this.proyectoSlideIndex[p.id] = next;
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
}
