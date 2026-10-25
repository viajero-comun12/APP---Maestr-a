/**
 * Organismo: AssignTutorModal
 * Asignación de Tutor responsable a un postulante inscrito
 */

import { openModal, closeModal } from '../moleculas/Modal.js';
import { renderFormField } from '../moleculas/FormField.js';
import { renderButtonHtml } from '../atomos/Button.js';
import { api } from '../../services/api.js';
import { toast } from '../moleculas/Toast.js';

export async function openAssignTutorModal({ enrollmentId, applicantName, currentTutorName, onAssigned }) {
  let tutors = [];
  try {
    tutors = await api.getTutors();
  } catch (err) {
    toast.error('No se pudo cargar la lista de tutores');
    return;
  }

  const tutorOptions = tutors.map(t => ({
    value: t.id,
    label: `${t.full_name} (${t.email})`
  }));

  const bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <div style="background:var(--bg-subtle); padding:12px; border-radius:var(--radius-md);">
        <div>Postulante: <strong style="color:var(--wine-800);">${applicantName}</strong></div>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-top:2px;">
          Tutor actual: <strong>${currentTutorName || 'Ninguno'}</strong>
        </div>
      </div>

      <form id="assign-tutor-form">
        ${renderFormField({
          id: 'selected-tutor-id',
          label: 'Seleccionar Tutor Responsable',
          as: 'select',
          required: true,
          options: tutorOptions,
          placeholder: 'Seleccione un tutor disponible'
        })}
      </form>
    </div>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-ghost" id="btn-cancel-assign">Cancelar</button>
    ${renderButtonHtml({ text: 'Asignar Tutor', variant: 'primary', id: 'btn-save-assign' })}
  `;

  openModal({
    title: 'Asignar Tutor Académico',
    bodyHtml,
    footerHtml,
    maxWidth: '500px'
  });

  document.getElementById('btn-cancel-assign').addEventListener('click', closeModal);

  document.getElementById('btn-save-assign').addEventListener('click', async () => {
    const tutorId = parseInt(document.getElementById('selected-tutor-id').value);
    if (!tutorId) {
      toast.error('Seleccione un tutor de la lista');
      return;
    }

    try {
      const btn = document.getElementById('btn-save-assign');
      btn.disabled = true;

      await api.assignTutor(enrollmentId, tutorId);
      toast.success('Tutor asignado exitosamente');
      closeModal();
      if (onAssigned) onAssigned();
    } catch (err) {
      toast.error(err.message || 'Error al asignar tutor');
      const btn = document.getElementById('btn-save-assign');
      if (btn) btn.disabled = false;
    }
  });
}
