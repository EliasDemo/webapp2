import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';
import { environment } from './environments/environment';

console.log('[BOOT] environment.apiUrl =', environment.apiUrl);

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
