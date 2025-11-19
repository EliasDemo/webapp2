import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, tap } from 'rxjs';

import {
  LookupRequest,
  LookupResponse,
  LoginRequest,
  LoginResponse,
  UserSummary,
  AcademicoSummary,
} from './auth.models';
import { API_URL } from '../../../core/tokens/api-url.token';

type Session = {
  token: string | null;
  user: UserSummary | null;
  academico: AcademicoSummary | null;
};

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL); // p.ej. https://api.../api

  private readonly _session = signal<Session>({
    token: localStorage.getItem('token'),
    user: null,
    academico: null,
  });

  readonly session = this._session.asReadonly();
  readonly isLoggedIn = computed(() => !!this._session().token);

  constructor() {
    // Solo para depurar; bórralo cuando quieras
    console.log('[AuthApi] API base:', this.base);
  }

  lookup(payload: LookupRequest): Observable<LookupResponse> {
    return this.http.post<LookupResponse>(`${this.base}/auth/lookup`, payload);
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, payload).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
        this._session.set({
          token: res.token,
          user: res.user,
          academico: res.academico,
        });
      }),
    );
  }

  logout(): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${this.base}/auth/logout`, {}).pipe(
      // si falla el logout del servidor, igual limpiamos sesión
      catchError(() =>
        this.http.post<{ ok: boolean; message: string }>(`${this.base}/auth/logout`, {}),
      ),
      finalize(() => this.clearSession()),
    );
  }

  clearSession(): void {
    localStorage.removeItem('token');
    this._session.set({ token: null, user: null, academico: null });
  }
}
