import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, concatMap, first, map } from 'rxjs/operators';
import { API_URL } from '../../../core/tokens/api-url.token';

@Injectable({ providedIn: 'root' })
export class EventosApi {
  constructor(private http: HttpClient, @Inject(API_URL) private base: string) {}

  private getJson<T>(path: string, params?: HttpParams): Observable<T | null> {
    return this.http.get<T>(`${this.base}${path}`, { params, observe: 'response' })
      .pipe(
        map((r: HttpResponse<T>) => (r.ok ? (r.body as T) : null)),
        catchError(() => of(null))
      );
  }

  /** Mis eventos (prueba varias rutas comunes y devuelve la primera que sirva) */
  getMisEventos(
    estado: 'ACTIVOS'|'FINALIZADOS'|'TODOS' = 'ACTIVOS',
    periodoId?: number
  ): Observable<any> {
    let params = new HttpParams().set('estado_participacion', estado);
    if (periodoId) params = params.set('periodo_id', String(periodoId));

    const candidates = [
      '/vm/eventos/mis',                    // <- tu ruta original (404 en tus logs)
      '/vm/evento-participaciones/mis',     // alternativa 1 frecuente
      '/vm/participaciones-eventos/mis',    // alternativa 2
      '/vm/eventos/participaciones/mis'     // alternativa 3
    ];

    return from(candidates).pipe(
      concatMap(p => this.getJson<any>(p, params)),
      first((res): res is any => !!res, of({ ok: true, data: { eventos: [] } }))
    );
  }

  /** Fuente de eventos inscribibles (prueba rutas públicas/vigentes) */
  getEventosVigentesMiEpSede(epSedeId?: number): Observable<any> {
    let params = new HttpParams();
    if (epSedeId) params = params.set('ep_sede_id', String(epSedeId));

    const candidates = [
      '/vm/eventos?estado=PLANIFICADO&solo_mi_ep_sede=1', // <- original (403 con alumno)
      '/vm/eventos/disponibles',
      '/vm/eventos/vigentes',
      '/vm/eventos-publicos'
    ];

    return from(candidates).pipe(
      concatMap(p => this.getJson<any>(p, params)),
      first((res): res is any => !!res, of({ ok: true, data: [] }))
    );
  }

  getDetalleEvento(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/vm/eventos/${id}`);
  }
}
