/**
 * Página: Portal del Postulante (Mi Estado de Avance y Cursos)
 * Visualización de semáforo, porcentaje ponderado, días restantes y carga de evidencias
 */

import { api } from '../services/api.js';
import { Icons } from '../components/atomos/Icons.js';
import { renderSpinner } from '../components/atomos/Spinner.js';
import { renderRiskTrafficLight } from '../components/atomos/RiskTrafficLight.js';
import { renderStatusBadge } from '../components/atomos/Badge.js';
import { renderProgressBar } from '../components/atomos/ProgressBar.js';
import { openModal, closeModal } from '../components/moleculas/Modal.js';
import { renderFileUploaderHtml, initFileUploader } from '../components/moleculas/FileUploader.js';
import { renderFormField } from '../components/moleculas/FormField.js';
import { renderButtonHtml } from '../components/atomos/Button.js';
import { toast } from '../components/moleculas/Toast.js';

export async function renderApplicantPortalPage() {
  return `
    <div style="display:flex; flex-direction:column; gap:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-size:1.6rem; font-weight:800; color:var(--wine-800); letter-spacing:-0.02em;">Portal de Cursos Preparatorios</h2>
          <p style="font-size:0.88rem; color:var(--text-muted);">Consulte su estado de avance, días restantes y suba las evidencias requeridas</p>
        </div>
      </div>

      <div id="applicant-portal-content">
        ${renderSpinner(36, 'Consultando su estado académico...')}
      </div>
    </div>
  `;
}

export async function initApplicantPortalPageEvents() {
  const container = document.getElementById('applicant-portal-content');

  const loadPortalData = async () => {
    try {
      container.innerHTML = renderSpinner(36, 'Cargando sus cursos y actividades...');
      const progressList = await api.getMyProgress();

      if (!progressList || progressList.length === 0) {
        // Verificar programas disponibles para inscribirse
        const availablePrograms = await api.getPrograms();

        container.innerHTML = `
          <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:36px; text-align:center;">
            <div style="width:52px; height:52px; background:var(--wine-50); color:var(--wine-700); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:12px;">
              ${Icons.book(26)}
            </div>
            <h3 style="font-size:1.2rem; color:var(--wine-900); font-weight:700; margin-bottom:6px;">Aún no está inscrito en un programa de maestría</h3>
            <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:20px;">
              Seleccione uno de los programas de maestría vigentes para habilitar sus cursos preparatorios:
            </p>

            <div style="max-width:500px; margin:0 auto; text-align:left;">
              <div class="form-group">
                <label class="form-label">Seleccione el Programa de Maestría:</label>
                <select id="select-enroll-program" class="form-control">
                  ${availablePrograms.map(p => `<option value="${p.id}">${p.name} (${p.call_for_applications})</option>`).join('')}
                </select>
              </div>
              <button id="btn-confirm-enroll" class="btn btn-primary" style="width:100%;">
                Inscribirme y Comenzar Cursos
              </button>
            </div>
          </div>
        `;

        const enrollBtn = document.getElementById('btn-confirm-enroll');
        if (enrollBtn) {
          enrollBtn.addEventListener('click', async () => {
            const progId = parseInt(document.getElementById('select-enroll-program').value);
            try {
              enrollBtn.disabled = true;
              await api.enroll(progId);
              toast.success('¡Inscripción exitosa! Se han asignado sus cursos preparatorios.');
              loadPortalData();
            } catch (err) {
              toast.error(err.message || 'Error en la inscripción');
              enrollBtn.disabled = false;
            }
          });
        }
        return;
      }

      // El postulante tiene inscripciones activas
      const enrollmentProgress = progressList[0];
      const enrollmentDetail = await api.getEnrollmentById(enrollmentProgress.enrollment_id);
      const program = await api.getProgramById(enrollmentDetail.program_id);

      const submittedEvidences = enrollmentDetail.evidences || [];
      const evidenceMap = {};
      submittedEvidences.forEach(ev => {
        evidenceMap[ev.activity_id] = ev;
      });

      container.innerHTML = `
        <!-- Banner de Estado y Semáforo -->
        <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:24px; box-shadow:var(--shadow-sm); border-top:4px solid var(--wine-700);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:18px;">
            <div>
              <div style="display:flex; align-items:center; gap:10px;">
                <h3 style="font-size:1.35rem; font-weight:800; color:var(--wine-900);">${enrollmentProgress.program_name}</h3>
                ${renderRiskTrafficLight(enrollmentProgress.risk_level)}
                ${renderStatusBadge(enrollmentProgress.status)}
              </div>
              <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">
                Tutor Académico Asignado: <strong>${enrollmentProgress.assigned_tutor}</strong>
              </div>
            </div>

            <button id="btn-download-my-pdf" class="btn btn-outline btn-sm">
              ${Icons.pdf(18)}
              <span>Descargar Mi Reporte en PDF</span>
            </button>
          </div>

          <!-- Métricas Resumen -->
          <div class="grid-4" style="gap:14px; margin-bottom:18px;">
            <div style="background:var(--wine-50); padding:14px; border-radius:var(--radius-md); text-align:center;">
              <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--wine-900);">Avance Ponderado</span>
              <div style="font-size:1.6rem; font-weight:800; color:var(--wine-700);">${enrollmentProgress.completion_percentage}%</div>
            </div>

            <div style="background:var(--blue-50); padding:14px; border-radius:var(--radius-md); text-align:center;">
              <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--blue-900);">Días Restantes</span>
              <div style="font-size:1.6rem; font-weight:800; color:var(--blue-700);">${enrollmentProgress.days_remaining} días</div>
            </div>

            <div style="background:var(--risk-low-bg); padding:14px; border-radius:var(--radius-md); text-align:center;">
              <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:#14532D;">Actividades Aprobadas</span>
              <div style="font-size:1.6rem; font-weight:800; color:var(--risk-low);">${enrollmentProgress.completed_activities}</div>
            </div>

            <div style="background:var(--yellow-50); padding:14px; border-radius:var(--radius-md); text-align:center;">
              <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--yellow-800);">Actividades Pendientes</span>
              <div style="font-size:1.6rem; font-weight:800; color:var(--yellow-700);">${enrollmentProgress.pending_activities}</div>
            </div>
          </div>

          ${renderProgressBar(enrollmentProgress.completion_percentage)}
        </div>

        <!-- Cursos Preparatorios y Subida de Evidencias -->
        <div style="display:flex; flex-direction:column; gap:20px; margin-top:24px;">
          <h3 style="font-size:1.15rem; font-weight:700; color:var(--wine-800);">Cursos Preparatorios y Entrega de Evidencias</h3>

          ${(program.courses || []).map(course => `
            <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:20px; box-shadow:var(--shadow-sm);">
              <div style="margin-bottom:12px; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
                <h4 style="font-size:1.05rem; font-weight:700; color:var(--wine-900);">${course.name}</h4>
                <div style="font-size:0.8rem; color:var(--text-muted);">${course.description || 'Contenido preparatorio'} • Plazo: ${course.max_deadline_days} días</div>
              </div>

              <!-- Actividades -->
              <div style="display:flex; flex-direction:column; gap:10px;">
                ${(course.activities || []).map(act => {
                  const ev = evidenceMap[act.id];
                  const hasSubmitted = !!ev;
                  const isApproved = ev && ev.status === 'APROBADO';

                  return `
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding:12px 16px; background:var(--bg-subtle); border-radius:var(--radius-md); border-left:4px solid ${isApproved ? 'var(--risk-low)' : (hasSubmitted ? 'var(--blue-600)' : 'var(--yellow-500)')};">
                      <div style="flex:1; min-width:260px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                          <strong style="color:var(--text-primary); font-size:0.94rem;">${act.title}</strong>
                          <span style="font-size:0.75rem; font-weight:700; color:var(--wine-700); background:var(--wine-100); padding:2px 8px; border-radius:var(--radius-full);">
                            ${act.weighting}% Ponderación
                          </span>
                        </div>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">
                          Fecha límite: <strong>${act.deadline ? new Date(act.deadline).toLocaleDateString() : 'Sin fecha'}</strong> • Tipo: ${act.evidence_type}
                        </div>
                        ${ev && ev.observations ? `
                          <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:4px; background:white; padding:4px 8px; border-radius:var(--radius-sm); border:1px solid var(--border-light);">
                            📝 <strong>Comentarios del tutor:</strong> ${ev.observations}
                          </div>
                        ` : ''}
                      </div>

                      <div style="display:flex; align-items:center; gap:14px;">
                        ${hasSubmitted ? `
                          <div style="text-align:right;">
                            ${renderStatusBadge(ev.status)}
                            ${ev.score !== null ? `<div style="font-size:0.8rem; font-weight:700; color:var(--wine-700); margin-top:2px;">Nota: ${ev.score}/100</div>` : ''}
                          </div>
                        ` : '<span class="badge badge-warning">Sin Entregar</span>'}

                        <button class="btn btn-${isApproved ? 'outline' : 'primary'} btn-sm btn-upload-evidence-modal" 
                                data-enrollment-id="${enrollmentProgress.enrollment_id}" 
                                data-activity-id="${act.id}" 
                                data-activity-title="${act.title}">
                          ${Icons.upload(14)}
                          <span>${hasSubmitted ? 'Actualizar Archivo' : 'Cargar Evidencia'}</span>
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Evento de descarga de PDF individual
      const downloadMyPdfBtn = document.getElementById('btn-download-my-pdf');
      if (downloadMyPdfBtn) {
        downloadMyPdfBtn.addEventListener('click', async () => {
          try {
            downloadMyPdfBtn.disabled = true;
            toast.info('Generando su reporte individual en PDF...');
            await api.downloadApplicantPdf(enrollmentProgress.enrollment_id, api.getUser().fullName);
            toast.success('Reporte descargado con éxito');
          } catch (err) {
            toast.error(err.message || 'Error al descargar reporte');
          } finally {
            downloadMyPdfBtn.disabled = false;
          }
        });
      }

      // Eventos para abrir modal de carga de evidencias
      document.querySelectorAll('.btn-upload-evidence-modal').forEach(b => {
        b.addEventListener('click', () => {
          openUploadEvidenceModal({
            enrollmentId: parseInt(b.dataset.enrollmentId),
            activityId: parseInt(b.dataset.activityId),
            activityTitle: b.dataset.activityTitle,
            onUploaded: loadPortalData
          });
        });
      });

    } catch (err) {
      container.innerHTML = `<div style="color:var(--risk-high); padding:20px;">Error al cargar portal: ${err.message}</div>`;
      toast.error('Error al conectar con el portal académico');
    }
  };

  loadPortalData();
}

function openUploadEvidenceModal({ enrollmentId, activityId, activityTitle, onUploaded }) {
  let selectedFile = null;

  const bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="background:var(--wine-50); padding:12px; border-radius:var(--radius-md); font-size:0.86rem; color:var(--wine-900);">
        Cargando evidencia para: <strong>${activityTitle}</strong>
      </div>

      ${renderFileUploaderHtml({ id: 'modal-evidence-file', label: 'Seleccione su Certificado PDF o Proyecto' })}

      ${renderFormField({
        id: 'modal-evidence-obs',
        label: 'Observaciones o Notas del Postulante (Opcional)',
        as: 'textarea',
        placeholder: 'Indique detalles relevantes sobre la entrega, enlaces a repositorios si aplica, etc.'
      })}
    </div>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-ghost" id="btn-cancel-modal-upload">Cancelar</button>
    ${renderButtonHtml({ text: 'Subir Evidencia', variant: 'primary', id: 'btn-confirm-modal-upload' })}
  `;

  openModal({
    title: 'Entrega de Evidencia de Aprendizaje',
    bodyHtml,
    footerHtml,
    maxWidth: '560px'
  });

  initFileUploader('modal-evidence-file', (file) => {
    selectedFile = file;
  });

  document.getElementById('btn-cancel-modal-upload').addEventListener('click', closeModal);

  document.getElementById('btn-confirm-modal-upload').addEventListener('click', async () => {
    if (!selectedFile) {
      toast.error('Por favor seleccione o arrastre un archivo antes de continuar');
      return;
    }

    const obs = document.getElementById('modal-evidence-obs').value.trim();
    const btn = document.getElementById('btn-confirm-modal-upload');
    btn.disabled = true;
    btn.textContent = 'Subiendo archivo...';

    try {
      await api.uploadEvidence(enrollmentId, activityId, selectedFile, obs);
      toast.success('¡Evidencia cargada con éxito! Su tutor la revisará en breve.');
      closeModal();
      if (onUploaded) onUploaded();
    } catch (err) {
      toast.error(err.message || 'Error al subir evidencia');
      btn.disabled = false;
      btn.textContent = 'Subir Evidencia';
    }
  });
}
