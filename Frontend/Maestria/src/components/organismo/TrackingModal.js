/**
 * Organismo: TrackingModal
 * Registro exhaustivo de gestión de seguimiento y contacto por parte del Tutor
 */

import { openModal, closeModal } from '../moleculas/Modal.js';
import { renderFormField } from '../moleculas/FormField.js';
import { renderButtonHtml } from '../atomos/Button.js';
import { api } from '../../services/api.js';
import { toast } from '../moleculas/Toast.js';

export function openTrackingModal({ enrollmentId, applicantName = '', onTrackingComplete }) {
  const nowIso = new Date().toISOString().slice(0, 16);

  const bodyHtml = `
    <form id="tracking-record-form" style="display:flex; flex-direction:column; gap:14px;">
      <div style="background:var(--wine-50); padding:12px 16px; border-radius:var(--radius-md); border-left:4px solid var(--wine-700);">
        <span style="font-size:0.8rem; color:var(--wine-900); font-weight:600;">Postulante a contactar:</span>
        <div style="font-size:1rem; font-weight:700; color:var(--wine-800);">${applicantName}</div>
      </div>

      <div class="grid-2" style="gap:12px; margin-bottom:0;">
        ${renderFormField({
          id: 'contact-date',
          label: 'Fecha y Hora del Contacto',
          type: 'datetime-local',
          value: nowIso,
          required: true
        })}

        ${renderFormField({
          id: 'contact-type',
          label: 'Medio / Tipo de Contacto',
          as: 'select',
          required: true,
          options: [
            { value: 'LLAMADA', label: 'Llamada telefónica' },
            { value: 'CORREO', label: 'Correo electrónico' },
            { value: 'WHATSAPP', label: 'WhatsApp' },
            { value: 'VIDEOCONFERENCIA', label: 'Videoconferencia' },
            { value: 'PRESENCIAL', label: 'Reunión presencial' }
          ]
        })}
      </div>

      ${renderFormField({
        id: 'contact-result',
        label: 'Resultado del Contacto',
        as: 'textarea',
        placeholder: 'Describa el resultado de la comunicación establecida...',
        required: true
      })}

      ${renderFormField({
        id: 'applicant-response',
        label: 'Respuesta y Postura del Postulante',
        as: 'textarea',
        placeholder: '¿Qué manifestó el postulante ante el avance o dudas?'
      })}

      <div class="grid-2" style="gap:12px; margin-bottom:0;">
        ${renderFormField({
          id: 'contact-commitments',
          label: 'Compromisos Adquiridos',
          as: 'textarea',
          placeholder: 'Fechas prometidas o acuerdos pactados...'
        })}

        ${renderFormField({
          id: 'contact-recommendations',
          label: 'Recomendaciones del Tutor',
          as: 'textarea',
          placeholder: 'Sugerencias metodológicas o académicas...'
        })}
      </div>

      <div class="grid-2" style="gap:12px; margin-bottom:0;">
        ${renderFormField({
          id: 'next-action',
          label: 'Próxima Acción Programada',
          placeholder: 'Ej: Verificar entrega el viernes'
        })}

        ${renderFormField({
          id: 'case-status',
          label: 'Estado del Caso',
          as: 'select',
          required: true,
          options: [
            { value: 'EN_SEGUIMIENTO', label: 'En Seguimiento Activo' },
            { value: 'COMPROMISO_PENDIENTE', label: 'Compromiso Pendiente' },
            { value: 'RESUELTO', label: 'Resuelto Satisfactoriamente' },
            { value: 'SIN_RESPUESTA', label: 'Sin Respuesta (Activa Semáforo Rojo)' },
            { value: 'CERRADO', label: 'Caso Cerrado' }
          ]
        })}
      </div>
    </form>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-ghost" id="btn-cancel-tracking">Cancelar</button>
    ${renderButtonHtml({ text: 'Registrar Seguimiento', variant: 'primary', id: 'btn-save-tracking' })}
  `;

  openModal({
    title: 'Nuevo Registro de Seguimiento Académico',
    bodyHtml,
    footerHtml,
    maxWidth: '680px'
  });

  document.getElementById('btn-cancel-tracking').addEventListener('click', closeModal);

  document.getElementById('btn-save-tracking').addEventListener('click', async () => {
    const contactDate = document.getElementById('contact-date').value;
    const contactType = document.getElementById('contact-type').value;
    const result = document.getElementById('contact-result').value.trim();
    const applicantResponse = document.getElementById('applicant-response').value.trim();
    const commitments = document.getElementById('contact-commitments').value.trim();
    const recommendations = document.getElementById('contact-recommendations').value.trim();
    const nextAction = document.getElementById('next-action').value.trim();
    const caseStatus = document.getElementById('case-status').value;

    if (!result) {
      toast.error('El campo Resultado del Contacto es obligatorio');
      return;
    }

    try {
      const btn = document.getElementById('btn-save-tracking');
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      await api.createTrackingRecord({
        enrollment_id: enrollmentId,
        contact_date: contactDate ? new Date(contactDate).toISOString() : new Date().toISOString(),
        contact_type: contactType,
        result: result,
        applicant_response: applicantResponse,
        commitments: commitments,
        recommendations: recommendations,
        next_action: nextAction,
        case_status: caseStatus
      });

      toast.success('Seguimiento guardado y registrado en la bitácora de auditoría');
      closeModal();
      if (onTrackingComplete) onTrackingComplete();
    } catch (err) {
      toast.error(err.message || 'Error al guardar el seguimiento');
      const btn = document.getElementById('btn-save-tracking');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Registrar Seguimiento';
      }
    }
  });
}
