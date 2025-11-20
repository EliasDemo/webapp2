import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError, finalize } from 'rxjs/operators';
import { ProyectosAlumnoApi } from './proyectos-alumno.api';
import { EventosApi } from './eventos.api';
import { HorasApiService } from '../../hours/data-access/h.api';
import { DashboardVM, ProyectoLite, EventoLite, SesionLite } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private _state = new BehaviorSubject<DashboardVM>({
    loading: true,
    error: null,
    contexto: null,
    contadores: {
      proyectos_inscritos: 0,
      faltas_eventos: 0,
      faltas_proyectos: 0,
      horas_acumuladas_min: 0,
      horas_requeridas_min: null
    },
    proyectoActual: null,
    proyectosPendientes: [],
    proyectosInscribibles: [],
    proyectosLibres: [],
    eventosInscritos: [],
    eventosInscribibles: [],
    proximasSesiones: []
  });
  readonly vm$ = this._state.asObservable();

  private loadingInFlight = false;
  private lastLoadedAt = 0;
  private eventsAvailable = true;

  constructor(
    private proyectosApi: ProyectosAlumnoApi,
    private eventosApi: EventosApi,
    private horasApi: HorasApiService
  ) {}

  load(force = false) {
    if (this.loadingInFlight) return;
    const now = Date.now();
    if (!force && now - this.lastLoadedAt < 1000) return; // debouncing

    this.loadingInFlight = true;
    this._state.next({ ...this._state.value, loading: true, error: null });

    const proyectos$ = this.proyectosApi.getResumenAlumno()
      .pipe(catchError(e => of({ ok: false, error: e?.error?.message })));

    const evMis$   = this.eventsAvailable
      ? this.eventosApi.getMisEventos('ACTIVOS')
      : of({ ok: true, data: { eventos: [] } } as any);

    const evSrc$   = this.eventsAvailable
      ? this.eventosApi.getEventosVigentesMiEpSede()
      : of({ ok: true, data: [] } as any);

    const horas$   = this.horasApi.obtenerMiReporteHoras()
      .pipe(catchError(e => of({ ok: false, message: e?.message })));

    forkJoin([proyectos$, evMis$, evSrc$, horas$]).pipe(
      switchMap(([proy, evMisRaw, evSrcRaw, horas]) => {
        const ahora = new Date();

        // Si alguna llamada de eventos fue 404/403 → apagamos el módulo de eventos
        const markUnavailable = (r: any) =>
          r?.__error && (r.status === 404 || r.status === 403) && (this.eventsAvailable = false);
        markUnavailable(evMisRaw);
        markUnavailable(evSrcRaw);

        // ---- proyectos ----
        const proyectoActual: ProyectoLite | null =
          (proy as any)?.data?.actual ? { ...(proy as any).data.actual } : null;

        const proyectosPendientes: ProyectoLite[] =
          ((proy as any)?.data?.pendientes ?? []).map((p: any) => ({
            proyecto: p.proyecto,
            requerido_min: p.requerido_min,
            acumulado_min: p.acumulado_min,
            faltan_min: p.faltan_min,
            cerrado: !!p.cerrado
          }));

        const proyectosInscribibles: ProyectoLite[] = (proy as any)?.data?.inscribibles ?? [];
        const proyectosLibres: ProyectoLite[]       = (proy as any)?.data?.libres ?? [];

        const proyectoActual$ = proyectoActual?.id
          ? this.proyectosApi.getDetalleProyecto(proyectoActual.id).pipe(
              map((det: any) => det?.data?.proyecto ? ({
                ...det.data.proyecto,
                procesos: det.data.procesos ?? []
              }) : proyectoActual),
              catchError(() => of(proyectoActual))
            )
          : of(null);

        // ---- eventos inscritos ----
        let eventosInscritos: EventoLite[] = [];
        if (!evMisRaw?.__error) {
          const evMis = (evMisRaw as any);
          eventosInscritos = (evMis?.data?.eventos ?? []).map((e: any) => ({
            id: e.id,
            codigo: e.codigo,
            titulo: e.titulo,
            subtitulo: e.subtitulo,
            modalidad: e.modalidad,
            estado: e.estado,
            requiere_inscripcion: !!e.requiere_inscripcion,
            cupo_maximo: e.cupo_maximo ?? null,
            url_imagen_portada: e.url_imagen_portada ?? null,
            inscripcion_desde: e.inscripcion_desde ?? null,
            inscripcion_hasta: e.inscripcion_hasta ?? null,
            participacion: e.participacion ?? null
          }));
        }

        // ---- eventos inscribibles ----
        let eventosInscribibles: EventoLite[] = [];
        if (!evSrcRaw?.__error) {
          const evSrc = (evSrcRaw as any);
          const fuente = (evSrc?.data?.data?.data ?? evSrc?.data?.data ?? evSrc?.data) || [];
          const yaInscrito = (id: number) => eventosInscritos.some(x => x.id === id);

          eventosInscribibles = fuente
            .map((raw: any) => raw?.evento || raw)
            .filter((ev: any) => {
              const req = !!ev.requiere_inscripcion;
              const desde = ev.inscripcion_desde ? new Date(ev.inscripcion_desde) : null;
              const hasta = ev.inscripcion_hasta ? new Date(ev.inscripcion_hasta) : null;
              const abierta = (!desde || ahora >= desde) && (!hasta || ahora <= hasta);
              return req && abierta && !yaInscrito(ev.id) && ['PLANIFICADO','EN_CURSO'].includes(ev.estado);
            })
            .map((ev: any) => ({
              id: ev.id,
              codigo: ev.codigo,
              titulo: ev.titulo,
              subtitulo: ev.subtitulo,
              modalidad: ev.modalidad,
              estado: ev.estado,
              requiere_inscripcion: !!ev.requiere_inscripcion,
              cupo_maximo: ev.cupo_maximo ?? null,
              url_imagen_portada: ev.url_imagen_portada ?? null,
              inscripcion_desde: ev.inscripcion_desde ?? null,
              inscripcion_hasta: ev.inscripcion_hasta ?? null,
              participacion: null
            }));
        }

        // ---- horas / contadores ----
        const totalMin = (horas as any)?.ok ? (horas as any)?.data?.resumen?.acumulado_min ?? 0 : 0;
        const contadores = {
          proyectos_inscritos: ((proy as any)?.data?.vinculados_historicos ?? [])
            .filter((p: any) => ['INSCRITO','CONFIRMADO','EN_CURSO','FINALIZADO'].includes(p?.participacion?.estado))
            .length || 0,
          faltas_proyectos: 0,
          faltas_eventos: 0,
          horas_acumuladas_min: totalMin,
          horas_requeridas_min: null
        };

        // ---- próximas sesiones (desde proyecto actual) ----
        return proyectoActual$.pipe(
          map((proyDet: any) => {
            const proximasSesiones: SesionLite[] = [];
            const now2 = new Date();

            if (proyDet?.procesos?.length) {
              proyDet.procesos.forEach((pr: any) => {
                (pr.sesiones || []).forEach((s: any) => {
                  const sDate = new Date(`${s.fecha}T${s.hora_inicio}`);
                  if (sDate >= now2) {
                    proximasSesiones.push({
                      id: s.id,
                      fecha: s.fecha,
                      hora_inicio: s.hora_inicio,
                      hora_fin: s.hora_fin,
                      estado: s.estado ?? 'PLANIFICADO',
                      fuente: 'PROYECTO',
                      ownerId: proyDet.id,
                      titulo: `${pr.nombre} · ${proyDet.titulo}`
                    });
                  }
                });
              });
            }

            proximasSesiones.sort((a, b) =>
              (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio)
            );

            return {
              loading: false,
              error: null,
              contexto: (proy as any)?.data?.contexto ?? null,
              contadores,
              proyectoActual: proyDet,
              proyectosPendientes,
              proyectosInscribibles,
              proyectosLibres,
              eventosInscritos,
              eventosInscribibles,
              proximasSesiones
            } as DashboardVM;
          })
        );
      }),
      finalize(() => {
        this.loadingInFlight = false;
        this.lastLoadedAt = Date.now();
      })
    ).subscribe({
      next: (vm) => this._state.next(vm),
      error: (e) =>
        this._state.next({ ...this._state.value, loading: false, error: e?.message || 'Error general' })
    });
  }
}
