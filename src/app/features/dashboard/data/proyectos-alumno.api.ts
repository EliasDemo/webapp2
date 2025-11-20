import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/tokens/api-url.token';

@Injectable({ providedIn: 'root' })
export class ProyectosAlumnoApi {
  constructor(private http: HttpClient, @Inject(API_URL) private base: string) {}

  /** GET /api/vm/proyectos/alumno */
  getResumenAlumno(): Observable<any> {
    return this.http.get<any>(`${this.base}/vm/proyectos/alumno`);
  }

  /** GET /api/vm/proyectos/{id} → árbol completo (imagenes, procesos, sesiones) */
  getDetalleProyecto(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/vm/proyectos/${id}`);
  }
}
