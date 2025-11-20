import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/tokens/api-url.token';

@Injectable({ providedIn: 'root' })
export class InscripcionesApi {
  constructor(private http: HttpClient, @Inject(API_URL) private base: string) {}

  /** POST /api/vm/proyectos/{id}/inscribirse */
  inscribirProyecto(id: number): Observable<any> {
    return this.http.post<any>(`${this.base}/vm/proyectos/${id}/inscribirse`, {});
  }

  /** POST /api/vm/eventos/{id}/inscribirse */
  inscribirEvento(id: number): Observable<any> {
    return this.http.post<any>(`${this.base}/vm/eventos/${id}/inscribirse`, {});
  }
}
