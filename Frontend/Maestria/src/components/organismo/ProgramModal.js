/**
 * Organismo: ProgramModal
 * Modales para crear Programas de Maestría, Cursos Preparatorios y Actividades/Proyectos
 */

import { openModal, closeModal } from '../moleculas/Modal.js';
import { renderFormField } from '../moleculas/FormField.js';
import { renderButtonHtml } from '../atomos/Button.js';
import { api } from '../../services/api.js';
import { toast } from '../moleculas/Toast.js';

export function openCreateProgramModal({ onCreated }) {
  const bodyHtml = `
    <form id="create-program-form" style="display:flex; flex-direction:column; gap:12px;">
      ${renderFormField({
        id: 'prog-name',
        label: 'Nombre del Programa de Maestría',
        placeholder: 'Ej: Maestría en Ciberseguridad y Redes',
        required: true
      })}

      <div class="grid-2" style="gap:12px; margin-bottom:0;">
        ${renderFormField({
          id: 'prog-code',
          label: 'Código Único',
          placeholder: 'Ej: MCR-2026-I',
          required: true
        })}

        ${renderFormField({
          id: 'prog-call',
          label: 'Convocatoria',
          placeholder: 'Ej: Convocatoria 2026-I',
          required: true
        })}
      </div>

      <div class="grid-3" style="gap:12px; margin-bottom:0;">
        ${renderFormField({
          id: 'prog-start-date',
          label: 'Fecha de Inicio',
          type: 'date',
          required: true
        })}

        ${renderFormField({
          id: 'prog-end-date',
          label: 'Fecha de Cierre',
          type: 'date',
          required: true
        })}

        ${renderFormField({
          id: 'prog-min-score',
          label: 'Puntaje Mínimo',
          type: 'number',
          value: '70',
          required: true
        })}
      </div>

      ${renderFormField({
        id: 'prog-desc',
        label: 'Descripción del Programa',
        as: 'textarea',
        placeholder: 'Objetivos y perfil de ingreso...'
      })}
    </form>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-ghost" id="btn-cancel-prog">Cancelar</button>
    ${renderButtonHtml({ text: 'Crear Programa', variant: 'primary', id: 'btn-save-prog' })}
  `;

  openModal({
    title: 'Crear Nuevo Programa de Maestría',
    bodyHtml,
    footerHtml,
    maxWidth: '620px'
  });

  document.getElementById('btn-cancel-prog').addEventListener('click', closeModal);

  document.getElementById('btn-save-prog').addEventListener('click', async () => {
    const name = document.getElementById('prog-name').value.trim();
    const code = document.getElementById('prog-code').value.trim();
    const callFor = document.getElementById('prog-call').value.trim();
    const startDate = document.getElementById('prog-start-date').value;
    const endDate = document.getElementById('prog-end-date').value;
    const minScore = parseFloat(document.getElementById('prog-min-score').value) || 70.0;
    const desc = document.getElementById('prog-desc').value.trim();

    if (!name || !code || !callFor || !startDate || !endDate) {
      toast.error('Complete todos los campos obligatorios del programa');
      return;
    }

    try {
      const btn = document.getElementById('btn-save-prog');
      btn.disabled = true;
      btn.textContent = 'Creando...';

      await api.createProgram({
        name,
        code,
        call_for_applications: callFor,
        start_date: startDate,
        end_date: endDate,
        min_passing_score: minScore,
        description: desc,
        is_active: true
      });

      toast.success('Programa de maestría creado exitosamente');
      closeModal();
      if (onCreated) onCreated();
    } catch (err) {
      toast.error(err.message || 'Error al crear programa');
      const btn = document.getElementById('btn-save-prog');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Crear Programa';
      }
    }
  });
}

export function openAddCourseModal({ programId, programName = '', onCreated }) {
  const bodyHtml = `
    <form id="create-course-form" style="display:flex; flex-direction:column; gap:12px;">
      <div style="background:var(--wine-50); padding:10px 14px; border-radius:var(--radius-md); font-size:0.85rem; color:var(--wine-800);">
        Asociando curso preparatorio a: <strong>${programName}</strong>
      </div>

      ${renderFormField({
        id: 'course-name',
        label: 'Nombre del Curso Preparatorio',
        placeholder: 'Ej: Fundamentos de Arquitectura de Software',
        required: true
      })}

      <div class="grid-2" style="gap:12px; margin-bottom:0;">
        ${renderFormField({
          id: 'course-code',
          label: 'Código de Curso',
          placeholder: 'Ej: FAS-101',
          required: true
        })}

        ${renderFormField({
          id: 'course-deadline-days',
          label: 'Plazo Máximo (en días)',
          type: 'number',
          value: '30',
          required: true
        })}
      </div>

      ${renderFormField({
        id: 'course-desc',
        label: 'Descripción / Temario',
        as: 'textarea',
        placeholder: 'Módulos o contenidos preparatorios requeridos...'
      })}
    </form>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-ghost" id="btn-cancel-course">Cancelar</button>
    ${renderButtonHtml({ text: 'Agregar Curso', variant: 'primary', id: 'btn-save-course' })}
  `;

  openModal({
    title: 'Definir Curso Preparatorio',
    bodyHtml,
    footerHtml,
    maxWidth: '560px'
  });

  document.getElementById('btn-cancel-course').addEventListener('click', closeModal);

  document.getElementById('btn-save-course').addEventListener('click', async () => {
    const name = document.getElementById('course-name').value.trim();
    const code = document.getElementById('course-code').value.trim();
    const maxDays = parseInt(document.getElementById('course-deadline-days').value) || 30;
    const desc = document.getElementById('course-desc').value.trim();

    if (!name || !code) {
      toast.error('Nombre y código del curso son obligatorios');
      return;
    }

    try {
      const btn = document.getElementById('btn-save-course');
      btn.disabled = true;

      await api.addCourse(programId, {
        name,
        code,
        description: desc,
        max_deadline_days: maxDays,
        is_active: true
      });

      toast.success('Curso preparatorio agregado correctamente');
      closeModal();
      if (onCreated) onCreated();
    } catch (err) {
      toast.error(err.message || 'Error al agregar curso');
      const btn = document.getElementById('btn-save-course');
      if (btn) btn.disabled = false;
    }
  });
}

export function openAddActivityModal({ courseId, courseName = '', onCreated }) {
  const bodyHtml = `
    <form id="create-activity-form" style="display:flex; flex-direction:column; gap:12px;">
      <div style="background:var(--blue-50); padding:10px 14px; border-radius:var(--radius-md); font-size:0.85rem; color:var(--blue-800);">
        Asociando actividad al curso: <strong>${courseName}</strong>
      </div>

      ${renderFormField({
        id: 'act-title',
        label: 'Título de la Actividad o Proyecto',
        placeholder: 'Ej: Certificado de Acreditación o Proyecto Final en Python',
        required: true
      })}

      <div class="grid-2" style="gap:12px; margin-bottom:0;">
        ${renderFormField({
          id: 'act-type',
          label: 'Tipo de Evidencia Solicitada',
          as: 'select',
          required: true,
          options: [
            { value: 'CERTIFICADO_PDF', label: 'Certificado PDF' },
            { value: 'PROYECTO', label: 'Proyecto / Código Fuente' },
            { value: 'DOCUMENTO', label: 'Documento / Ensayo' }
          ]
        })}

        ${renderFormField({
          id: 'act-weighting',
          label: 'Ponderación Porcentual (%)',
          type: 'number',
          value: '25',
          helpText: 'Porcentaje en la calificación global',
          required: true
        })}
      </div>

      <div class="grid-2" style="gap:12px; margin-bottom:0;">
        ${renderFormField({
          id: 'act-deadline',
          label: 'Fecha Límite de Cumplimiento',
          type: 'datetime-local',
          required: true
        })}

        ${renderFormField({
          id: 'act-mandatory',
          label: 'Requisito Obligatorio',
          as: 'select',
          options: [
            { value: 'true', label: 'Sí (Obligatorio para aprobar)' },
            { value: 'false', label: 'No (Opcional)' }
          ]
        })}
      </div>

      ${renderFormField({
        id: 'act-desc',
        label: 'Instrucciones y Rúbrica de la Actividad',
        as: 'textarea',
        placeholder: 'Criterios de evaluación y formatos admitidos...'
      })}
    </form>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-ghost" id="btn-cancel-act">Cancelar</button>
    ${renderButtonHtml({ text: 'Agregar Actividad', variant: 'primary', id: 'btn-save-act' })}
  `;

  openModal({
    title: 'Definir Actividad / Proyecto Preparatorio',
    bodyHtml,
    footerHtml,
    maxWidth: '600px'
  });

  document.getElementById('btn-cancel-act').addEventListener('click', closeModal);

  document.getElementById('btn-save-act').addEventListener('click', async () => {
    const title = document.getElementById('act-title').value.trim();
    const evidenceType = document.getElementById('act-type').value;
    const weighting = parseFloat(document.getElementById('act-weighting').value) || 0.0;
    const deadlineVal = document.getElementById('act-deadline').value;
    const isMandatory = document.getElementById('act-mandatory').value === 'true';
    const desc = document.getElementById('act-desc').value.trim();

    if (!title || !deadlineVal) {
      toast.error('Título y fecha límite son obligatorios');
      return;
    }

    try {
      const btn = document.getElementById('btn-save-act');
      btn.disabled = true;

      await api.addActivity(courseId, {
        title,
        evidence_type: evidenceType,
        weighting,
        deadline: new Date(deadlineVal).toISOString(),
        is_mandatory: isMandatory,
        description: desc
      });

      toast.success('Actividad configurada exitosamente');
      closeModal();
      if (onCreated) onCreated();
    } catch (err) {
      toast.error(err.message || 'Error al configurar actividad');
      const btn = document.getElementById('btn-save-act');
      if (btn) btn.disabled = false;
    }
  });
}
