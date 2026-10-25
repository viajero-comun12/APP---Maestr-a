/**
 * Página: Línea de Tiempo de Trazabilidad Completa
 * Cronología integral de interacciones, inscripciones, entregas, evaluaciones y notificaciones
 */

import { api } from '../services/api.js';
import { Icons } from '../components/atomos/Icons.js';
import { renderSpinner } from '../components/atomos/Spinner.js';
import { renderTimelineItem } from '../components/moleculas/TimelineItem.js';
import { toast } from '../components/moleculas/Toast.js';

export async function renderTraceabilityPage() {
  return `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
        <div>
          <h2 style="font-size:1.6rem; font-weight:800; color:var(--wine-800); letter-spacing:-0.02em;">Línea de Tiempo de Trazabilidad</h2>
          <p style="font-size:0.88rem; color:var(--text-muted);">Auditoría cronológica y trazabilidad completa de todas las actividades e interacciones</p>
        </div>

        <div style="display:flex; align-items:center; gap:10px;">
          <select id="select-traceability-enrollment" class="form-control" style="min-width:240px;">
            <option value="">Cargando postulantes...</option>
          </select>
        </div>
      </div>

      <div id="traceability-timeline-container">
        ${renderSpinner(36, 'Cargando historial de trazabilidad...')}
      </div>
    </div>
  `;
}

export async function initTraceabilityPageEvents() {
  const container = document.getElementById('traceability-timeline-container');
  const selector = document.getElementById('select-traceability-enrollment');
  const currentUser = api.getUser();

  // Comprobar si vino con un ID preseleccionado en la URL (ej: #/trazabilidad?id=1)
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const preselectedId = urlParams.get('id');

  try {
    let enrollments = [];
    if (currentUser.role === 'POSTULANTE') {
      const myProgress = await api.getMyProgress();
      enrollments = myProgress.map(p => ({
        id: p.enrollment_id,
        applicant_name: currentUser.fullName,
        program_name: p.program_name
      }));
    } else {
      enrollments = await api.getEnrollments();
    }

    if (!enrollments || enrollments.length === 0) {
      if (selector) selector.innerHTML = '<option value="">Sin postulantes</option>';
      container.innerHTML = `
        <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:36px; text-align:center;">
          <p style="color:var(--text-muted);">No hay expedientes activos para consultar trazabilidad.</p>
        </div>
      `;
      return;
    }

    if (selector) {
      selector.innerHTML = enrollments.map(e => `
        <option value="${e.id}" ${String(e.id) === String(preselectedId || enrollments[0].id) ? 'selected' : ''}>
          ${e.applicant_name} (${e.program_name})
        </option>
      `).join('');
    }

    const loadTimeline = async (enrollmentId) => {
      try {
        container.innerHTML = renderSpinner(32, 'Recuperando eventos de auditoría...');
        const timelineEvents = await api.getTimeline(enrollmentId);

        if (!timelineEvents || timelineEvents.length === 0) {
          container.innerHTML = `
            <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:36px; text-align:center;">
              <p style="color:var(--text-muted);">Aún no se han registrado eventos para este postulante.</p>
            </div>
          `;
          return;
        }

        container.innerHTML = `
          <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:28px; box-shadow:var(--shadow-sm);">
            <div style="margin-bottom:20px; font-size:0.86rem; color:var(--text-muted);">
              Mostrando <strong>${timelineEvents.length}</strong> eventos registrados en orden cronológico descendente:
            </div>
            <div class="timeline">
              ${timelineEvents.map(renderTimelineItem).join('')}
            </div>
          </div>
        `;
      } catch (err) {
        container.innerHTML = `<div style="color:var(--risk-high); padding:20px;">Error al cargar línea de tiempo: ${err.message}</div>`;
        toast.error('No se pudo cargar la línea de tiempo');
      }
    };

    const initialId = selector.value || enrollments[0].id;
    loadTimeline(initialId);

    if (selector) {
      selector.addEventListener('change', () => {
        loadTimeline(selector.value);
      });
    }

  } catch (err) {
    container.innerHTML = `<div style="color:var(--risk-high); padding:20px;">Error al inicializar módulo: ${err.message}</div>`;
  }
}
