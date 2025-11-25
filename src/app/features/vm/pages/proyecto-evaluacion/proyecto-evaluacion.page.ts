// ✅ FILE: src/app/vm/pages/proyecto-evaluacion/proyecto-evaluacion.page.ts

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { VmApiService } from '../../data-access/vm.api';
import {
  isApiOk,
  ParticipanteSesionRow,
} from '../../models/proyecto.models';

interface ParticipanteEvalRow extends ParticipanteSesionRow {
  nota?: number | null;
  loading?: boolean;
  error?: string | null;
}

@Component({
  standalone: true,
  selector: 'app-proyecto-evaluacion-page',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './proyecto-evaluacion.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProyectoEvaluacionPage implements OnDestroy {
  private api = inject(VmApiService);
  private route = inject(ActivatedRoute);

  sesionId = signal<number>(0);
  procesoId = signal<number>(0);

  loading = signal(true);
  error   = signal<string | null>(null);
  now     = signal(new Date());

  participantes = signal<ReadonlyArray<ParticipanteEvalRow>>([]);

  private clock: any;

  constructor() {
    const sid = Number(this.route.snapshot.paramMap.get('sesionId'));
    this.sesionId.set(sid);

    this.bootstrap();

    // reloj UI
    this.clock = setInterval(() => this.now.set(new Date()), 30_000);
  }

  ngOnDestroy(): void {
    if (this.clock) clearInterval(this.clock);
  }

  /** ============================================================
   * BOOTSTRAP
   * ============================================================ */
  private async bootstrap() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // 1) Obtener sesión para saber el proceso
      const sesRes = await firstValueFrom(
        this.api.obtenerSesionParaEdicion(this.sesionId())
      );

      if (!sesRes || !isApiOk(sesRes)) {
        throw new Error((sesRes as any)?.message || 'No se pudo cargar la sesión.');
      }

      const ses = sesRes.data;

      if (ses.sessionable_type !== 'App\\Models\\VmProceso') {
        throw new Error('La sesión no pertenece a un proceso evaluable.');
      }

      this.procesoId.set(ses.sessionable_id);

      // 2) Cargar participantes
      await this.loadParticipantes();

    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Error inicializando la evaluación.');
    } finally {
      this.loading.set(false);
    }
  }

  /** ============================================================
   * PARTICIPANTES
   * ============================================================ */
  async loadParticipantes() {
    try {
      const res = await firstValueFrom(
        this.api.listarParticipantesSesion(this.sesionId())
      );

      if (res && isApiOk(res)) {
        const base = res.data ?? [];
        this.participantes.set(
          base.map(p => ({
            ...p,
            nota: null,      // aún no calificado
            loading: false,
            error: null,
          }))
        );
      } else {
        this.participantes.set([]);
      }

    } catch (e: any) {
      this.error.set(e?.error?.message || 'No se pudo listar participantes.');
      this.participantes.set([]);
    }
  }

  /** ============================================================
   * CALIFICAR A UN PARTICIPANTE
   * ============================================================ */
  async calificarUno(row: ParticipanteEvalRow) {
    if (!row.codigo && !row.expediente_id) {
      alert('El participante no tiene identificador válido.');
      return;
    }

    if (row.nota == null || isNaN(row.nota as any)) {
      alert('Ingresa una nota válida.');
      return;
    }

    /** ⚠️ Escala de nota
     * Si usas 0–20 → sin cambios.
     * Si usas 0–100 en UI, multiplica por 5.
     */
    const nota = Number(row.nota);
    if (nota < 0 || nota > 20) {
      alert('Nota fuera de rango (0–20).');
      return;
    }

    // Marcar loading en el participante
    this.participantes.update(list =>
      list.map(p =>
        p.participacion_id === row.participacion_id
          ? { ...p, loading: true, error: null }
          : p
      )
    );

    try {
      const payload = {
        sesion_id: this.sesionId(),
        nota,
        codigo: row.codigo ?? undefined,
        expediente_id: row.expediente_id ?? undefined,
        otorgar_horas: true,
        ajustar_a_minutos_sesion: true,
      };

      const res = await firstValueFrom(
        this.api.calificarEvaluacion(this.procesoId(), payload)
      );

      if (!res || !isApiOk(res)) {
        throw new Error((res as any)?.message || 'No se pudo calificar.');
      }

      const aprobado = res.data.aprobado;

      // Actualizar participante
      this.participantes.update(list =>
        list.map(p =>
          p.participacion_id === row.participacion_id
            ? {
                ...p,
                loading: false,
                error: null,
                estado_calculado: aprobado
                  ? 'PRESENTE'
                  : (p.estado_calculado || ''),
              }
            : p
        )
      );

    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'Error al calificar.';
      alert(msg);

      this.participantes.update(list =>
        list.map(p =>
          p.participacion_id === row.participacion_id
            ? { ...p, loading: false, error: msg }
            : p
        )
      );
    }
  }

  trackByParticipante = (_: number, r: ParticipanteEvalRow) => r.participacion_id;
}
