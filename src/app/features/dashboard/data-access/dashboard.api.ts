// dashboard.api.ts
import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/tokens/api-url.token';
import {
  DashboardFeedResponse,
  InscribirEventoResponse,
  InscribirProyectoResponse,
  // Id si lo reexportas
} from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class AlumnoDashboardApiService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private base: string,
  ) {}

  /**
   * GET /api/alumno/feed?periodo_id=...
   */
  getFeed(periodoId?: number): Observable<DashboardFeedResponse> {
    let params = new HttpParams();
    if (periodoId) params = params.set('periodo_id', String(periodoId));
    return this.http.get<DashboardFeedResponse>(`${this.base}/alumno/feed`, { params });
  }

  /**
   * POST /api/vm/eventos/{evento}/inscribirse
   */
  inscribirEvento(eventoId: number): Observable<InscribirEventoResponse> {
    return this.http.post<InscribirEventoResponse>(
      `${this.base}/vm/eventos/${eventoId}/inscribirse`,
      {},
    );
  }

  /**
   * POST /api/vm/proyectos/{proyecto}/inscribirse
   */
  inscribirProyecto(proyectoId: number): Observable<InscribirProyectoResponse> {
    return this.http.post<InscribirProyectoResponse>(
      `${this.base}/vm/proyectos/${proyectoId}/inscribirse`,
      {},
    );
  }
}
