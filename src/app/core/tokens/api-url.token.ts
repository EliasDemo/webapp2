import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment.prod';
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl
});

