// src/app/features/alumnoinspector/alumnoinspector.routes.ts
import { Routes } from '@angular/router';

export const AI_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'resumen' },

  {
    path: 'resumen',
    title: 'Inspector de alumnos · Resumen',
    loadComponent: () =>
      import('./pages/resumen/ai-resumen.page')
        .then(m => m.AIResumenPage),
    data: { feature: 'alumnoinspector', level: 'resumen' },
  },

  {
    path: 'alumno',
    title: 'Inspector de alumnos · Alumno',
    loadComponent: () =>
      import('./pages/alumno/ai-alumno.page')
        .then(m => m.AIAlumnoPage),
    data: { feature: 'alumnoinspector', level: 'alumno' },
  },

  { path: '**', redirectTo: 'resumen' },
];

export default AI_ROUTES;
