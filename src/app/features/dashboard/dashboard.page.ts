import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, NgIf, NgFor } from '@angular/common';
import { DashboardApi } from './data-access/dashboard.api';
import { DashboardData, VmEvento, VmProyecto } from './models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.page.html',
  imports: [
    CommonModule,  // habilita *ngIf, *ngFor, pipes como number/date
    NgIf,
    NgFor,
    DecimalPipe,
  ],
})
export class DashboardPage implements OnInit {
  loading = false;
  error: string | null = null;
  data: DashboardData | null = null;

  constructor(private dashboardApi: DashboardApi) {}

  ngOnInit(): void {
    this.loadFeed();
  }

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
}
