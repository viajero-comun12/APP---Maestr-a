/**
 * Organismo: EvidenceReviewModal
 * Modal para revisar y calificar evidencias (Certificados PDF y Proyectos)
 */

import { openModal, closeModal } from '../moleculas/Modal.js';
import { renderFormField } from '../moleculas/FormField.js';
import { renderButtonHtml } from '../atomos/Button.js';
import { api } from '../../services/api.js';
import { toast } from '../moleculas/Toast.js';

export function openEvidenceReviewModal({ evidence, onReviewComplete }) {
  const bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="background:var(--bg-subtle); padding:14px; border-radius:var(--radius-md); border-left:4px solid var(--wine-700);">
        <div style="font-size:0.85rem; color:var(--text-muted);">Actividad Evaluada:</div>
        <strong style="color:var(--wine-900); font-size:1rem;">${evidence.activity_title || 'Actividad sin título'}</strong>
        <div style="font-size:0.8rem; margin-top:4px; color:var(--text-secondary);">
          Archivo: <strong>${evidence.file_name}</strong> | Subido el: ${new Date(evidence.upload_date).toLocaleDateString()}
        </div>
        ${evidence.observations ? `
          <div style="font-size:0.8rem; margin-top:6px; color:var(--text-muted);">
            <em>Comentario del postulante: "${evidence.observations}"</em>
          </div>
        ` : ''}
      </div>

      <div style="display:flex; gap:12px;">
        <a href="${api.getToken() ? `http://127.0.0.1:8000/api/v1/evidences/download/${evidence.file_url}` : '#'}" 
           target="_blank" class="btn btn-outline-blue btn-sm" style="flex:1;">
          Descargar Archivo Adjunto
        </a>
      </div>

      <form id="evidence-review-form">
        ${renderFormField({
          id: 'review-status',
          label: 'Decisión de Evaluación',
          as: 'select',
          required: true,
          options: [
            { value: 'APROBADO', label: 'APROBADO (Cumple requisitos)' },
            { value: 'RECHAZADO', label: 'RECHAZADO (Requiere corrección)' }
          ],
          value: evidence.status === 'APROBADO' ? 'APROBADO' : 'APROBADO'
        })}

        ${renderFormField({
          id: 'review-score',
          label: 'Calificación Cuantitativa (0 - 100)',
          type: 'number',
          placeholder: 'Ej: 95',
          value: evidence.score || '100',
          required: true
        })}

        ${renderFormField({
          id: 'review-observations',
          label: 'Retroalimentación y Observaciones para el Postulante',
          as: 'textarea',
          placeholder: 'Escriba las observaciones o justificación de la calificación...',
          value: evidence.observations || '',
          required: true
        })}
      </form>
    </div>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-ghost" id="btn-cancel-review">Cancelar</button>
    ${renderButtonHtml({ text: 'Guardar Calificación', variant: 'primary', id: 'btn-save-review' })}
  `;

  openModal({
    title: 'Evaluación y Calificación de Evidencia',
    bodyHtml,
    footerHtml,
    maxWidth: '560px'
  });

  document.getElementById('btn-cancel-review').addEventListener('click', closeModal);

  document.getElementById('btn-save-review').addEventListener('click', async () => {
    const statusVal = document.getElementById('review-status').value;
    const scoreVal = parseFloat(document.getElementById('review-score').value);
    const obsVal = document.getElementById('review-observations').value.trim();

    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      toast.error('La calificación debe estar entre 0 y 100');
      return;
    }

    try {
      const btn = document.getElementById('btn-save-review');
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      await api.reviewEvidence(evidence.id, {
        status: statusVal,
        score: scoreVal,
        observations: obsVal
      });

      toast.success('Calificación registrada y semáforo recalculado');
      closeModal();
      if (onReviewComplete) onReviewComplete();
    } catch (err) {
      toast.error(err.message || 'Error al guardar la revisión');
      const btn = document.getElementById('btn-save-review');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Guardar Calificación';
      }
    }
  });
}
