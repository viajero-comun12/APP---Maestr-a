/**
 * Página: Dashboard Ejecutivo
 * Indicadores en tiempo real, distribución de semáforo de riesgo y métricas por programa
 */

import { api } from '../services/api.js';
import { Icons } from '../components/atomos/Icons.js';
import { renderMetricCard } from '../components/moleculas/MetricCard.js';
import { renderSpinner } from '../components/atomos/Spinner.js';
import { renderProgressBar } from '../components/atomos/ProgressBar.js';
import { toast } from '../components/moleculas/Toast.js';

export async function renderDashboardPage() {
  return `
    <div style="display:flex; flex-direction:column; gap:24px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-size:1.6rem; font-weight:800; color:var(--wine-800); letter-spacing:-0.02em;">Dashboard Ejecutivo</h2>
          <p style="font-size:0.88rem; color:var(--text-muted);">Monitoreo, indicadores y semáforo de alerta temprana en tiempo real</p>
        </div>
        <button id="btn-refresh-dashboard" class="btn btn-outline btn-sm">
          ${Icons.refresh(16)}
          <span>Actualizar Indicadores</span>
        </button>
      </div>

      <div id="dashboard-content">
        ${renderSpinner(36, 'Calculando indicadores en tiempo real...')}
      </div>
    </div>
  `;
}

export async function initDashboardPageEvents() {
  const container = document.getElementById('dashboard-content');
  const refreshBtn = document.getElementById('btn-refresh-dashboard');

  const loadMetrics = async () => {
    try {
      if (container) container.innerHTML = renderSpinner(36, 'Cargando indicadores...');
      const metrics = await api.getDashboardMetrics();

      const riskDist = metrics.distribucion_riesgo || { alto: 0, medio: 0, bajo: 0 };
      const avgComp = metrics.porcentaje_cumplimiento_promedio || 0;

      container.innerHTML = `
        <!-- Métricas Principales (Grid de 4) -->
        <div class="grid-4">
          ${renderMetricCard({
            label: 'Total Postulantes',
            value: metrics.total_postulantes,
            subtext: 'Inscritos en programas activos',
            icon: Icons.users(26),
            colorScheme: 'wine'
          })}

          ${renderMetricCard({
            label: 'Cursos Activos',
            value: metrics.cursos_activos,
            subtext: 'Cursos preparatorios vigentes',
            icon: Icons.book(26),
            colorScheme: 'blue'
          })}

          ${renderMetricCard({
            label: 'Aprobados',
            value: metrics.postulantes_aprobados,
            subtext: 'Completaron 100% de ponderación',
            icon: Icons.check(26),
            colorScheme: 'green'
          })}

          ${renderMetricCard({
            label: 'Postulantes en Riesgo',
            value: metrics.postulantes_en_riesgo,
            subtext: `${riskDist.alto} Riesgo Alto • ${riskDist.medio} Medio`,
            icon: Icons.alert(26),
            colorScheme: 'red'
          })}
        </div>

        <!-- Métricas Secundarias (Grid de 4) -->
        <div class="grid-4" style="margin-top:20px;">
          ${renderMetricCard({
            label: 'Cumplimiento Promedio',
            value: `${avgComp}%`,
            subtext: 'Avance global ponderado',
            icon: Icons.dashboard(26),
            colorScheme: 'wine'
          })}

          ${renderMetricCard({
            label: 'Evidencias Pendientes',
            value: metrics.actividades_pendientes,
            subtext: 'Por revisar y calificar',
            icon: Icons.clipboard(26),
            colorScheme: 'yellow'
          })}

          ${renderMetricCard({
            label: 'Seguimientos de Tutoría',
            value: metrics.seguimientos_realizados,
            subtext: 'Llamadas, WhatsApp y reuniones',
            icon: Icons.phone(26),
            colorScheme: 'blue'
          })}

          ${renderMetricCard({
            label: 'Seguimientos Sin Respuesta',
            value: metrics.seguimientos_sin_respuesta,
            subtext: 'Casos en riesgo de deserción',
            icon: Icons.alert(26),
            colorScheme: 'red'
          })}
        </div>

        <!-- Panel de Semáforo de Riesgo & Desglose de Programas -->
        <div class="grid-2" style="margin-top:24px;">
          <!-- Semáforo de Riesgo -->
          <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:24px; box-shadow:var(--shadow-sm);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
              <h3 style="font-size:1.05rem; font-weight:700; color:var(--wine-800);">Distribución del Semáforo de Riesgo</h3>
              <span class="badge badge-wine">${metrics.total_postulantes} Postulantes</span>
            </div>

            <div style="display:flex; flex-direction:column; gap:16px;">
              <!-- Rojo / Alto -->
              <div style="background:var(--risk-high-bg); padding:14px; border-radius:var(--radius-md); border-left:4px solid var(--risk-high);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-weight:700; color:var(--risk-high); font-size:0.9rem;">🔴 RIESGO ALTO (Deserción inminente)</span>
                  <span style="font-weight:800; font-size:1.1rem; color:var(--risk-high);">${riskDist.alto}</span>
                </div>
                <p style="font-size:0.78rem; color:#7F1D1D; margin:0;">
                  Inactividad &gt; 7 días, seguimientos sin respuesta o actividades vencidas.
                </p>
              </div>

              <!-- Amarillo / Medio -->
              <div style="background:var(--risk-med-bg); padding:14px; border-radius:var(--radius-md); border-left:4px solid var(--risk-med);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-weight:700; color:var(--risk-med); font-size:0.9rem;">🟡 RIESGO MEDIO (Alerta preventiva)</span>
                  <span style="font-weight:800; font-size:1.1rem; color:var(--risk-med);">${riskDist.medio}</span>
                </div>
                <p style="font-size:0.78rem; color:#78350F; margin:0;">
                  Entregas próximas en menos de 5 días o bajo avance de ponderación.
                </p>
              </div>

              <!-- Verde / Bajo -->
              <div style="background:var(--risk-low-bg); padding:14px; border-radius:var(--radius-md); border-left:4px solid var(--risk-low);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-weight:700; color:var(--risk-low); font-size:0.9rem;">🟢 RIESGO BAJO (Avance regular)</span>
                  <span style="font-weight:800; font-size:1.1rem; color:var(--risk-low);">${riskDist.bajo}</span>
                </div>
                <p style="font-size:0.78rem; color:#14532D; margin:0;">
                  Cumplimiento regular y dentro de los plazos establecidos.
                </p>
              </div>
            </div>
          </div>

          <!-- Métricas por Programa de Maestría -->
          <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:24px; box-shadow:var(--shadow-sm);">
            <h3 style="font-size:1.05rem; font-weight:700; color:var(--wine-800); margin-bottom:18px;">Rendimiento por Programa de Maestría</h3>
            
            <div style="display:flex; flex-direction:column; gap:16px;">
              ${(metrics.metricas_por_programa || []).map(p => `
                <div style="padding:14px; border:1px solid var(--border-light); border-radius:var(--radius-md); background:var(--bg-subtle);">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div>
                      <strong style="font-size:0.95rem; color:var(--wine-900);">${p.program_name}</strong>
                      <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
                        ${p.total_enrolled} postulantes inscritos • ${p.approved_count} aprobados • ${p.in_risk_count} en riesgo
                      </div>
                    </div>
                    <span class="badge ${p.in_risk_count > 0 ? 'badge-danger' : 'badge-success'}">
                      ${p.in_risk_count > 0 ? `${p.in_risk_count} En Riesgo` : 'Al Día'}
                    </span>
                  </div>
                  ${renderProgressBar(p.average_completion)}
                </div>
              `).join('') || '<p style="color:var(--text-muted); font-size:0.88rem;">No hay programas registrados aún.</p>'}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="padding:24px; background:var(--risk-high-bg); color:var(--risk-high); border-radius:var(--radius-md);">
          Error al cargar métricas: ${err.message}
        </div>
      `;
      toast.error('No se pudo conectar con el servidor para cargar métricas');
    }
  };

  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadMetrics);
  }

  loadMetrics();
}
