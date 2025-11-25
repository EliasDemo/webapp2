// src/app/features/alumnoinspector/data-access/alumnoinspector.api.ts
import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/tokens/api-url.token';

import {
  Id,
  AIResumenParams,
  AIResumenResponse,
  AIAlumnoSearchParams,
  AIAlumnoResponse,
  AIProyectosPeriodoParams,
  AIProyectosResponse,
  AIInscribirProyectoPayload,
  AIInscribirProyectoResponse,
  AIMarcarAsistenciasPayload,
  AIMarcarAsistenciasResponse,
  AIInscribirEventoPayload,
  AIInscribirEventoResponse,
  AIUpdateEventoParticipacionResponse,
} from '../models/alumnoinspector.models';

@Injectable({ providedIn: 'root' })
export class AlumnoInspectorApiService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private base: string
  ) {}

  /**
   * GET /api/vm/inspeccion/resumen
   */
  getResumen(params: AIResumenParams): Observable<AIResumenResponse> {
    let httpParams = new HttpParams();
    if (params.ep_sede_id != null) {
      httpParams = httpParams.set('ep_sede_id', String(params.ep_sede_id));
    }
    if (params.periodo_id != null) {
      httpParams = httpParams.set('periodo_id', String(params.periodo_id));
    } else if (params.periodo_codigo) {
      httpParams = httpParams.set('periodo_codigo', params.periodo_codigo);
    }

    return this.http.get<AIResumenResponse>(
      `${this.base}/vm/inspeccion/resumen`,
      { params: httpParams }
    );
  }

  /**
   * GET /api/vm/inspeccion/alumno
   */
  getAlumno(params: AIAlumnoSearchParams): Observable<AIAlumnoResponse> {
    let httpParams = new HttpParams();
    if (params.ep_sede_id != null) {
      httpParams = httpParams.set('ep_sede_id', String(params.ep_sede_id));
    }
    if (params.expediente_id != null) {
      httpParams = httpParams.set('expediente_id', String(params.expediente_id));
    }
    if (params.codigo) {
      httpParams = httpParams.set('codigo', params.codigo);
    }

    return this.http.get<AIAlumnoResponse>(
      `${this.base}/vm/inspeccion/alumno`,
      { params: httpParams }
    );
  }

  /**
   * GET /api/vm/inspeccion/proyectos
   */
  getProyectosPeriodo(payload: AIProyectosPeriodoParams): Observable<AIProyectosResponse> {
    let params = new HttpParams()
      .set('ep_sede_id', String(payload.ep_sede_id))
      .set('periodo_codigo', payload.periodo_codigo);

    if (payload.nivel != null) {
      params = params.set('nivel', String(payload.nivel));
    }

    return this.http.get<AIProyectosResponse>(
      `${this.base}/vm/inspeccion/proyectos`,
      { params }
    );
  }

  /**
   * POST /api/vm/inspeccion/proyectos/inscribir
   */
  inscribirEnProyecto(payload: AIInscribirProyectoPayload): Observable<AIInscribirProyectoResponse> {
    return this.http.post<AIInscribirProyectoResponse>(
      `${this.base}/vm/inspeccion/proyectos/inscribir`,
      payload
    );
  }

  /**
   * POST /api/vm/inspeccion/proyectos/asistencias/marcar
   */
  marcarAsistenciasProyecto(payload: AIMarcarAsistenciasPayload): Observable<AIMarcarAsistenciasResponse> {
    return this.http.post<AIMarcarAsistenciasResponse>(
      `${this.base}/vm/inspeccion/proyectos/asistencias/marcar`,
      payload
    );
  }

  /**
   * POST /api/vm/inspeccion/eventos/{evento}/inscribir
   */
  inscribirEnEventoManual(eventoId: Id, payload: AIInscribirEventoPayload): Observable<AIInscribirEventoResponse> {
    return this.http.post<AIInscribirEventoResponse>(
      `${this.base}/vm/inspeccion/eventos/${eventoId}/inscribir`,
      payload
    );
  }

  /**
   * PATCH /api/vm/inspeccion/eventos/participaciones/{participacion}
   */
  actualizarEstadoParticipacionEvento(participacionId: Id, estado: string): Observable<AIUpdateEventoParticipacionResponse> {
    return this.http.patch<AIUpdateEventoParticipacionResponse>(
      `${this.base}/vm/inspeccion/eventos/participaciones/${participacionId}`,
      { estado }
    );
  }
}
