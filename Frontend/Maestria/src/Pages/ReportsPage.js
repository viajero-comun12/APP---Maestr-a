/**
 * Página: Centro de Reportes Oficiales
 * Descarga de Reportes Individuales en PDF, Matriz Consolidada en Excel/PDF e Informe de Trazabilidad en Excel/PDF
 */

import { api } from '../services/api.js';
import { Icons } from '../components/atomos/Icons.js';
import { renderSpinner } from '../components/atomos/Spinner.js';
import { renderButtonHtml } from '../components/atomos/Button.js';
import { toast } from '../components/moleculas/Toast.js';

export async function renderReportsPage() {
  const currentUser = api.getUser();
  const isPostulante = currentUser && currentUser.role === 'POSTULANTE';

  return `
    <div style="display:flex; flex-direction:column; gap:24px;">
      <div>
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--wine-800); letter-spacing:-0.02em;">Centro de Reportes Oficiales</h2>
        <p style="font-size:0.88rem; color:var(--text-muted);">Generación y exportación de reportes académicos con trazabilidad para auditorías de calidad</p>
      </div>

      <!-- Grid de Reportes Disponibles -->
      <div class="grid-3" style="gap:20px;">
        <!-- Reporte 1: Reporte Individual del Postulante -->
        <div class="report-card" style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:24px; box-shadow:var(--shadow-sm); display:flex; flex-direction:column; border-top:4px solid var(--wine-700);">
          <div style="width:48px; height:48px; background:var(--wine-50); color:var(--wine-700); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; margin-bottom:14px;">
            ${Icons.pdf(26)}
          </div>
          <h3 style="font-size:1.15rem; font-weight:700; color:var(--wine-900); margin-bottom:8px;">Reporte Individual del Postulante</h3>
          <p style="font-size:0.84rem; color:var(--text-secondary); line-height:1.45; margin-bottom:18px; flex:1;">
            Expediente oficial en formato <strong>PDF</strong> con datos del postulante, programa, cursos preparatorios, evidencias entregadas, calificaciones, historial de llamadas del tutor y nivel de cumplimiento.
          </p>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${!isPostulante ? `
              <select id="select-report-applicant" class="form-control" style="font-size:0.85rem;">
                <option value="">Cargando postulantes...</option>
              </select>
            ` : ''}
            <button id="btn-download-applicant-pdf" class="btn btn-primary btn-sm" style="width:100%;">
              ${Icons.download(16)}
              <span>Descargar PDF Oficial</span>
            </button>
          </div>
        </div>

        ${!isPostulante ? `
          <!-- Reporte 2: Matriz Consolidada de Seguimiento -->
          <div class="report-card" style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:24px; box-shadow:var(--shadow-sm); display:flex; flex-direction:column; border-top:4px solid var(--blue-700);">
            <div style="width:48px; height:48px; background:var(--blue-50); color:var(--blue-700); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; margin-bottom:14px;">
              ${Icons.excel(26)}
            </div>
            <h3 style="font-size:1.15rem; font-weight:700; color:var(--blue-900); margin-bottom:8px;">Matriz Consolidada de Seguimiento</h3>
            <p style="font-size:0.84rem; color:var(--text-secondary); line-height:1.45; margin-bottom:18px; flex:1;">
              Sábana integral con todos los postulantes, programa, porcentaje de avance, días pendientes, tutor asignado, número de seguimientos, estado y color del semáforo de riesgo.
            </p>
            <div style="display:flex; gap:10px;">
              <button id="btn-download-matrix-excel" class="btn btn-secondary btn-sm" style="flex:1;">
                ${Icons.excel(16)}
                <span>Excel (.xlsx)</span>
              </button>
              <button id="btn-download-matrix-pdf" class="btn btn-outline-blue btn-sm" style="flex:1;">
                ${Icons.pdf(16)}
                <span>PDF Horizontal</span>
              </button>
            </div>
          </div>

          <!-- Reporte 3: Informe Completo de Trazabilidad -->
          <div class="report-card" style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:24px; box-shadow:var(--shadow-sm); display:flex; flex-direction:column; border-top:4px solid var(--yellow-600);">
            <div style="width:48px; height:48px; background:var(--yellow-50); color:var(--yellow-700); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; margin-bottom:14px;">
              ${Icons.clipboard(26)}
            </div>
            <h3 style="font-size:1.15rem; font-weight:700; color:var(--yellow-800); margin-bottom:8px;">Informe de Trazabilidad de Acciones</h3>
            <p style="font-size:0.84rem; color:var(--text-secondary); line-height:1.45; margin-bottom:18px; flex:1;">
              Bitácora cronológica con correlativo único (TRK), responsable, canal (llamada, WhatsApp, correo, presencial), resultado, compromisos, respuesta del postulante y próxima acción.
            </p>
            <div style="display:flex; gap:10px;">
              <button id="btn-download-traceability-excel" class="btn btn-warning btn-sm" style="flex:1;">
                ${Icons.excel(16)}
                <span>Excel (.xlsx)</span>
              </button>
              <button id="btn-download-traceability-pdf" class="btn btn-outline btn-sm" style="flex:1;">
                ${Icons.pdf(16)}
                <span>PDF Horizontal</span>
              </button>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Cuadro Informativo de Aseguramiento de Calidad -->
      <div style="background:var(--bg-white); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:20px; display:flex; align-items:center; gap:16px;">
        <div style="width:40px; height:40px; background:var(--wine-50); color:var(--wine-700); border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          ${Icons.check(20)}
        </div>
        <div>
          <strong style="color:var(--wine-900); font-size:0.95rem;">Cumplimiento de Criterios de Acreditación y Auditoría</strong>
          <p style="font-size:0.82rem; color:var(--text-secondary); margin-top:2px;">
            Todos los reportes generados contienen sellos de tiempo UTC, correlativo institucional e identificación del responsable según la normativa de aseguramiento de la calidad académica.
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function initReportsPageEvents() {
  const currentUser = api.getUser();
  const isPostulante = currentUser && currentUser.role === 'POSTULANTE';
  const applicantSelector = document.getElementById('select-report-applicant');
  let enrollments = [];

  try {
    if (isPostulante) {
      const myProgress = await api.getMyProgress();
      if (myProgress && myProgress.length > 0) {
        enrollments = [{
          id: myProgress[0].enrollment_id,
          applicant_name: currentUser.fullName
        }];
      }
    } else {
      enrollments = await api.getEnrollments();
      if (applicantSelector) {
        applicantSelector.innerHTML = enrollments.map(e => `
          <option value="${e.id}">${e.applicant_name} (${e.program_name})</option>
        `).join('') || '<option value="">Sin postulantes</option>';
      }
    }
  } catch (err) {
    console.error('Error cargando postulantes para reportes:', err);
  }

  // Descargar Reporte Individual en PDF
  const downloadApplicantPdfBtn = document.getElementById('btn-download-applicant-pdf');
  if (downloadApplicantPdfBtn) {
    downloadApplicantPdfBtn.addEventListener('click', async () => {
      let targetId = null;
      let targetName = 'Postulante';

      if (isPostulante && enrollments.length > 0) {
        targetId = enrollments[0].id;
        targetName = currentUser.fullName;
      } else if (applicantSelector && applicantSelector.value) {
        targetId = parseInt(applicantSelector.value);
        targetName = applicantSelector.options[applicantSelector.selectedIndex].text.split('(')[0].trim();
      }

      if (!targetId) {
        toast.error('Seleccione un postulante para generar el reporte');
        return;
      }

      try {
        downloadApplicantPdfBtn.disabled = true;
        toast.info('Generando reporte individual en PDF...');
        await api.downloadApplicantPdf(targetId, targetName);
        toast.success('Reporte descargado exitosamente');
      } catch (err) {
        toast.error(err.message || 'Error al generar reporte PDF');
      } finally {
        downloadApplicantPdfBtn.disabled = false;
      }
    });
  }

  // Descargar Matriz en Excel
  const matrixExcelBtn = document.getElementById('btn-download-matrix-excel');
  if (matrixExcelBtn) {
    matrixExcelBtn.addEventListener('click', async () => {
      try {
        matrixExcelBtn.disabled = true;
        toast.info('Exportando Matriz Consolidada en Excel...');
        await api.downloadConsolidatedMatrixExcel();
        toast.success('Archivo Excel descargado correctamente');
      } catch (err) {
        toast.error(err.message || 'Error al exportar matriz en Excel');
      } finally {
        matrixExcelBtn.disabled = false;
      }
    });
  }

  // Descargar Matriz en PDF
  const matrixPdfBtn = document.getElementById('btn-download-matrix-pdf');
  if (matrixPdfBtn) {
    matrixPdfBtn.addEventListener('click', async () => {
      try {
        matrixPdfBtn.disabled = true;
        toast.info('Generando Matriz Consolidada en PDF...');
        await api.downloadConsolidatedMatrixPdf();
        toast.success('Archivo PDF descargado correctamente');
      } catch (err) {
        toast.error(err.message || 'Error al exportar matriz en PDF');
      } finally {
        matrixPdfBtn.disabled = false;
      }
    });
  }

  // Descargar Trazabilidad en Excel
  const traceExcelBtn = document.getElementById('btn-download-traceability-excel');
  if (traceExcelBtn) {
    traceExcelBtn.addEventListener('click', async () => {
      try {
        traceExcelBtn.disabled = true;
        toast.info('Exportando Informe de Trazabilidad en Excel...');
        await api.downloadTraceabilityExcel();
        toast.success('Informe Excel descargado correctamente');
      } catch (err) {
        toast.error(err.message || 'Error al exportar trazabilidad');
      } finally {
        traceExcelBtn.disabled = false;
      }
    });
  }

  // Descargar Trazabilidad en PDF
  const tracePdfBtn = document.getElementById('btn-download-traceability-pdf');
  if (tracePdfBtn) {
    tracePdfBtn.addEventListener('click', async () => {
      try {
        tracePdfBtn.disabled = true;
        toast.info('Generando Informe de Trazabilidad en PDF...');
        await api.downloadTraceabilityPdf();
        toast.success('Informe PDF descargado correctamente');
      } catch (err) {
        toast.error(err.message || 'Error al exportar trazabilidad en PDF');
      } finally {
        tracePdfBtn.disabled = false;
      }
    });
  }
}
