import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, map, of, switchMap, catchError } from 'rxjs';
import { ProyectosAlumnoApi } from './proyectos-alumno.api';
import { EventosApi } from './eventos.api';
import { HorasApiService } from '../../hours/data-access/h.api';
import { DashboardVM, EventoLite, ProyectoLite, SesionLite } from '../models/dashboard.models';

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

  constructor(
    private proyectosApi: ProyectosAlumnoApi,
    private eventosApi: EventosApi,
    private horasApi: HorasApiService
  ) {}

  load() {
    this._state.next({ ...this._state.value, loading: true, error: null });

    const proyectos$ = this.proyectosApi.getResumenAlumno()
      .pipe(catchError(e => of({ ok:false, error: e?.error?.message })));

    const eventosActivos$ = this.eventosApi.getMisEventos('ACTIVOS')
      .pipe(catchError(e => of({ ok:false, error: e?.error?.message })));

    const eventosFuente$ = this.eventosApi.getEventosVigentesMiEpSede()
      .pipe(catchError(e => of({ ok:false, error: e?.error?.message })));

    const horas$ = this.horasApi.obtenerMiReporteHoras()
      .pipe(catchError(e => of({ ok:false, message: e?.message })));

    forkJoin([proyectos$, eventosActivos$, eventosFuente$, horas$]).pipe(
      switchMap(([proy, evMis, evSrc, horas]) => {
        const now = new Date();

        const proyectoActual: ProyectoLite | null =
          proy?.data?.actual ? { ...proy.data.actual } : null;

        const proyectosPend = (proy?.data?.pendientes ?? []).map((p: any) => ({
          proyecto: p.proyecto,
          requerido_min: p.requerido_min,
          acumulado_min: p.acumulado_min,
          faltan_min: p.faltan_min,
          cerrado: !!p.cerrado
        }));

        const proyectosInscribibles: ProyectoLite[] = proy?.data?.inscribibles ?? [];
        const proyectosLibres: ProyectoLite[] = proy?.data?.libres ?? [];

        const proyectoActual$ = proyectoActual?.id
          ? this.proyectosApi.getDetalleProyecto(proyectoActual.id).pipe(
              map(det => det?.data?.proyecto ? ({
                ...det.data.proyecto,
                procesos: det.data.procesos ?? []
              }) : proyectoActual),
              catchError(() => of(proyectoActual))
            )
          : of(null);

        const eventosInscritos: EventoLite[] = (evMis?.data?.eventos ?? []).map((e: any) => ({
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
          participacion: e.participacion ?? null,
        }));

        const fuenteEventos = (evSrc?.data?.data?.data ?? evSrc?.data?.data ?? evSrc?.data) || [];

        const eventosInscribibles = fuenteEventos
          .map((raw: any) => raw?.evento || raw)
          .filter((ev: any) => {
            const req = !!ev.requiere_inscripcion;
            const desde = ev.inscripcion_desde ? new Date(ev.inscripcion_desde) : null;
            const hasta = ev.inscripcion_hasta ? new Date(ev.inscripcion_hasta) : null;
            const abierta = (!desde || now >= desde) && (!hasta || now <= hasta);
            const inscrito = eventosInscritos.some(x => x.id === ev.id);
            return req && abierta && !inscrito && ['PLANIFICADO','EN_CURSO'].includes(ev.estado);
          });

        const totalMin = horas?.ok ? (horas as any)?.data?.resumen?.acumulado_min ?? 0 : 0;

        const contadores = {
          proyectos_inscritos: (proy?.data?.vinculados_historicos ?? [])
            .filter((p: any) => ['INSCRITO','CONFIRMADO','EN_CURSO','FINALIZADO'].includes(p?.participacion?.estado))
            .length || 0,
          faltas_proyectos: 0,
          faltas_eventos: 0,
          horas_acumuladas_min: totalMin,
          horas_requeridas_min: null
        };

        return proyectoActual$.pipe(
          map(proyDet => {
            const proximasSesiones: SesionLite[] = [];

            if (proyDet?.procesos?.length) {
              proyDet.procesos.forEach((pr: any) => {
                (pr.sesiones || []).forEach((s: any) => {
                  const sDate = new Date(`${s.fecha}T${s.hora_inicio}`);
                  if (sDate >= now) {
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
              contexto: proy?.data?.contexto ?? null,
              contadores,
              proyectoActual: proyDet,
              proyectosPendientes: proyectosPend,
              proyectosInscribibles,
              proyectosLibres,
              eventosInscritos,
              eventosInscribibles,
              proximasSesiones
            } as DashboardVM;
          })
        );
      })
    ).subscribe({
      next: (vm) => this._state.next(vm),
      error: (e) =>
        this._state.next({
          ...this._state.value,
          loading: false,
          error: e?.message || 'Error general'
        })
    });
  }
}
