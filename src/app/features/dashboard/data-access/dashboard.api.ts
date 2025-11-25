// dashboard.api.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardFeedResponse } from '../models/dashboard.models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  // environment.apiUrl = 'https://apiproyecto-production-39fa.up.railway.app/api'
  private readonly baseUrl = `${environment.apiUrl}/alumno`;

  constructor(private http: HttpClient) {}

  getFeed(periodoId?: number): Observable<DashboardFeedResponse> {
    let params = new HttpParams();

    if (periodoId != null) {
      params = params.set('periodo_id', periodoId.toString());
    }

    return this.http.get<DashboardFeedResponse>(`${this.baseUrl}/feed`, {
      params,
    });
  }
}
