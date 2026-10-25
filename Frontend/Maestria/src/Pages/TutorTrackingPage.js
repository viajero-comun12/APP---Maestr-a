/**
 * Página: Gestión y Seguimiento de Tutores
 * Panel operativo para contactar postulantes, registrar llamadas/WhatsApp y calificar evidencias
 */

import { api } from '../services/api.js';
import { Icons } from '../components/atomos/Icons.js';
import { renderSpinner } from '../components/atomos/Spinner.js';
import { renderRiskTrafficLight } from '../components/atomos/RiskTrafficLight.js';
import { renderStatusBadge } from '../components/atomos/Badge.js';
import { renderButtonHtml } from '../components/atomos/Button.js';
import { openTrackingModal } from '../components/organismo/TrackingModal.js';
import { openEvidenceReviewModal } from '../components/organismo/EvidenceReviewModal.js';
import { toast } from '../components/moleculas/Toast.js';

export async function renderTutorTrackingPage() {
  return `
    <div style="display:flex; flex-direction:column; gap:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
        <div>
          <h2 style="font-size:1.6rem; font-weight:800; color:var(--wine-800); letter-spacing:-0.02em;">Módulo de Seguimiento y Tutoría</h2>
          <p style="font-size:0.88rem; color:var(--text-muted);">Registro de llamadas, WhatsApp, videoconferencias, acuerdos y revisión de evidencias</p>
        </div>
      </div>

      <div id="tutor-workspace-area">
        ${renderSpinner(36, 'Cargando asignaciones de tutoría...')}
      </div>
    </div>
  `;
}

export async function initTutorTrackingPageEvents() {
  const container = document.getElementById('tutor-workspace-area');

  const loadTutorData = async () => {
    try {
      container.innerHTML = renderSpinner(36, 'Cargando postulantes asignados...');
      const enrollments = await api.getEnrollments();

      if (!enrollments || enrollments.length === 0) {
        container.innerHTML = `
          <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:40px; text-align:center;">
            <p style="color:var(--text-muted);">No tiene postulantes asignados en este momento.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:20px;">
          ${enrollments.map(enr => {
            const evidences = enr.evidences || [];
            const pendingReviews = evidences.filter(e => e.status === 'PENDIENTE');

            return `
              <div class="tutor-card" style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:24px; box-shadow:var(--shadow-sm); border-left:5px solid ${enr.risk_level === 'ALTO' ? 'var(--risk-high)' : (enr.risk_level === 'MEDIO' ? 'var(--risk-med)' : 'var(--wine-700)')};">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:14px;">
                  <div>
                    <div style="display:flex; align-items:center; gap:10px;">
                      <h3 style="font-size:1.2rem; font-weight:800; color:var(--wine-900);">${enr.applicant_name}</h3>
                      ${renderRiskTrafficLight(enr.risk_level)}
                      ${renderStatusBadge(enr.status)}
                    </div>
                    <div style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">
                      📧 ${enr.applicant_email} • Programa: <strong>${enr.program_name}</strong>
                    </div>
                  </div>

                  <div style="display:flex; gap:8px;">
                    <button class="btn btn-primary btn-sm btn-register-contact" data-id="${enr.id}" data-name="${enr.applicant_name}">
                      ${Icons.phone(16)}
                      <span>Registrar Gestión</span>
                    </button>
                    <a href="#/trazabilidad?id=${enr.id}" class="btn btn-outline btn-sm">
                      ${Icons.timeline(16)}
                      <span>Ver Historial</span>
                    </a>
                  </div>
                </div>

                <!-- Resumen de Avance -->
                <div style="background:var(--bg-subtle); padding:12px 16px; border-radius:var(--radius-md); margin-bottom:18px;">
                  <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:600; margin-bottom:6px;">
                    <span>Avance Ponderado del Postulante</span>
                    <span style="color:var(--wine-700);">${enr.completion_percentage}% Aprobado</span>
                  </div>
                  <div class="progress-bar-container">
                    <div class="progress-bar-fill ${enr.completion_percentage >= 100 ? 'success' : ''}" style="width:${enr.completion_percentage}%;"></div>
                  </div>
                </div>

                <!-- Evidencias Pendientes de Calificar -->
                <div>
                  <h4 style="font-size:0.9rem; font-weight:700; color:var(--text-primary); text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
                    <span>Evidencias y Proyectos para Revisión</span>
                    ${pendingReviews.length > 0 ? `<span class="badge badge-danger">${pendingReviews.length} Pendiente(s)</span>` : '<span class="badge badge-success">Todo Calificado</span>'}
                  </h4>

                  <div style="display:flex; flex-direction:column; gap:8px;">
                    ${evidences.length > 0 ? evidences.map(ev => `
                      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:white; border:1px solid var(--border-light); border-radius:var(--radius-md); font-size:0.86rem;">
                        <div>
                          <strong>${ev.activity_title || 'Actividad'}</strong>
                          <span style="font-size:0.78rem; color:var(--text-muted); margin-left:8px;">
                            (${ev.file_name}) • ${new Date(ev.upload_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px;">
                          ${renderStatusBadge(ev.status)}
                          ${ev.score !== null ? `<span style="font-weight:700; color:var(--wine-800);">${ev.score}/100</span>` : ''}
                          <button class="btn btn-outline btn-sm btn-review-evidence" data-evidence='${JSON.stringify(ev).replace(/'/g, "&apos;")}'>
                            ${Icons.clipboard(14)}
                            <span>${ev.status === 'PENDIENTE' ? 'Calificar' : 'Editar Calificación'}</span>
                          </button>
                        </div>
                      </div>
                    `).join('') : '<p style="font-size:0.82rem; color:var(--text-muted);">El postulante no ha cargado evidencias aún.</p>'}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      // Asignar eventos
      document.querySelectorAll('.btn-register-contact').forEach(b => {
        b.addEventListener('click', () => {
          openTrackingModal({
            enrollmentId: parseInt(b.dataset.id),
            applicantName: b.dataset.name,
            onTrackingComplete: loadTutorData
          });
        });
      });

      document.querySelectorAll('.btn-review-evidence').forEach(b => {
        b.addEventListener('click', () => {
          const evidenceData = JSON.parse(b.dataset.evidence);
          openEvidenceReviewModal({
            evidence: evidenceData,
            onReviewComplete: loadTutorData
          });
        });
      });

    } catch (err) {
      container.innerHTML = `<div style="color:var(--risk-high); padding:20px;">Error al cargar tutorías: ${err.message}</div>`;
      toast.error('Error al conectar con el módulo de tutoría');
    }
  };

  loadTutorData();
}
