import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardFeedResponse,
  VmEventosFullResponse,
  VmProyectosFullResponse,
} from '../models/dashboard.models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  // environment.apiUrl = 'https://apiproyecto-production-39fa.up.railway.app/api'
  private readonly baseUrl = `${environment.apiUrl}/alumno`;
  private readonly vmBaseUrl = `${environment.apiUrl}/vm`;

  constructor(private http: HttpClient) {}

  // Feed principal (contexto + contadores + listas resumidas)
  getFeed(periodoId?: number): Observable<DashboardFeedResponse> {
    let params = new HttpParams();

    if (periodoId != null) {
      params = params.set('periodo_id', periodoId.toString());
    }

    return this.http.get<DashboardFeedResponse>(`${this.baseUrl}/feed`, {
      params,
    });
  }

  // Eventos FULL (muro/blog)
  getEventosFull(): Observable<VmEventosFullResponse> {
    return this.http.get<VmEventosFullResponse>(`${environment.apiUrl}/eventos/full`);
  }

  // Proyectos FULL (muro/blog)
  getProyectosFull(): Observable<VmProyectosFullResponse> {
    return this.http.get<VmProyectosFullResponse>(`${environment.apiUrl}/proyectos/full`);
  }

  // Inscripción a EVENTO (ya manejada por tu backend)
  inscribirEnEvento(eventoId: number): Observable<any> {
    return this.http.post(`${this.vmBaseUrl}/eventos/${eventoId}/inscribirse`, {});
  }

  // Inscripción a PROYECTO (ya manejada por tu backend)
  inscribirEnProyecto(proyectoId: number): Observable<any> {
    return this.http.post(`${this.vmBaseUrl}/proyectos/${proyectoId}/inscribirse`, {});
  }
}
