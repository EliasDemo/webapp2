import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/tokens/api-url.token';

@Injectable({ providedIn: 'root' })
export class EventosApi {
  constructor(private http: HttpClient, @Inject(API_URL) private base: string) {}

  /** GET /api/vm/eventos/mis?estado_participacion=ACTIVOS|FINALIZADOS|TODOS */
  getMisEventos(estado: 'ACTIVOS'|'FINALIZADOS'|'TODOS' = 'ACTIVOS', periodoId?: number): Observable<any> {
    let params = new HttpParams().set('estado_participacion', estado);
    if (periodoId) params = params.set('periodo_id', String(periodoId));
    return this.http.get<any>(`${this.base}/vm/eventos/mis`, { params });
  }

  /** Lista “fuente” de posibles inscribibles de mi EP_SEDE (luego el front filtra ventana abierta y no inscritos) */
  getEventosVigentesMiEpSede(): Observable<any> {
    const p = new HttpParams().set('estado', 'PLANIFICADO').set('solo_mi_ep_sede', '1');
    return this.http.get<any>(`${this.base}/vm/eventos`, { params: p });
  }

  /** GET /api/vm/eventos/{id} (para obtener sesiones/imágenes si lo necesitas) */
  getDetalleEvento(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/vm/eventos/${id}`);
  }
}
