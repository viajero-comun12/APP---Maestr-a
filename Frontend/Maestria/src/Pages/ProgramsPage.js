/**
 * Página: Gestión de Programas y Cursos Preparatorios
 * Creación de programas, cursos preparatorios, proyectos y ponderaciones
 */

import { api } from '../services/api.js';
import { Icons } from '../components/atomos/Icons.js';
import { renderButtonHtml } from '../components/atomos/Button.js';
import { renderSpinner } from '../components/atomos/Spinner.js';
import { renderBadge } from '../components/atomos/Badge.js';
import { openCreateProgramModal, openAddCourseModal, openAddActivityModal } from '../components/organismo/ProgramModal.js';
import { toast } from '../components/moleculas/Toast.js';

export async function renderProgramsPage() {
  const currentUser = api.getUser();
  const canManage = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'COORDINADOR');

  return `
    <div style="display:flex; flex-direction:column; gap:24px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-size:1.6rem; font-weight:800; color:var(--wine-800); letter-spacing:-0.02em;">Programas y Cursos Preparatorios</h2>
          <p style="font-size:0.88rem; color:var(--text-muted);">Estandarización de convocatorias, cursos preparatorios, actividades y ponderaciones</p>
        </div>
        ${canManage ? `
          <div style="display:flex; gap:10px;">
            ${renderButtonHtml({
              text: 'Nuevo Programa de Maestría',
              variant: 'primary',
              id: 'btn-open-create-program',
              icon: Icons.plus(18)
            })}
          </div>
        ` : ''}
      </div>

      <div id="programs-list-container">
        ${renderSpinner(36, 'Cargando programas y cursos preparatorios...')}
      </div>
    </div>
  `;
}

export async function initProgramsPageEvents() {
  const container = document.getElementById('programs-list-container');
  const createProgramBtn = document.getElementById('btn-open-create-program');
  const currentUser = api.getUser();
  const canManage = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'COORDINADOR');

  const loadPrograms = async () => {
    try {
      if (container) container.innerHTML = renderSpinner(36, 'Cargando programas...');
      const programs = await api.getPrograms();

      if (!programs || programs.length === 0) {
        container.innerHTML = `
          <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:40px; text-align:center;">
            <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:14px;">No hay programas de maestría registrados actualmente.</p>
            ${canManage ? renderButtonHtml({ text: 'Crear Primer Programa', variant: 'primary', id: 'btn-create-first-prog' }) : ''}
          </div>
        `;
        const firstBtn = document.getElementById('btn-create-first-prog');
        if (firstBtn) firstBtn.addEventListener('click', () => openCreateProgramModal({ onCreated: loadPrograms }));
        return;
      }

      container.innerHTML = programs.map(prog => `
        <div class="program-card" style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:24px; margin-bottom:20px; box-shadow:var(--shadow-sm); border-top:4px solid var(--wine-700);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
                <h3 style="font-size:1.25rem; font-weight:800; color:var(--wine-900);">${prog.name}</h3>
                ${renderBadge({ text: prog.code, variant: 'wine' })}
                ${renderBadge({ text: prog.call_for_applications, variant: 'blue' })}
              </div>
              <p style="font-size:0.86rem; color:var(--text-secondary); max-width:800px;">${prog.description || 'Sin descripción'}</p>
            </div>

            <div style="display:flex; gap:8px;">
              ${canManage ? `
                <button class="btn btn-outline btn-sm btn-add-course" data-prog-id="${prog.id}" data-prog-name="${prog.name}">
                  ${Icons.plus(14)}
                  <span>Definir Curso</span>
                </button>
              ` : ''}
            </div>
          </div>

          <div style="display:flex; gap:20px; font-size:0.8rem; color:var(--text-muted); padding:10px 14px; background:var(--bg-subtle); border-radius:var(--radius-md); margin-bottom:18px;">
            <span>🗓️ <strong>Inicio:</strong> ${prog.start_date}</span>
            <span>🏁 <strong>Cierre:</strong> ${prog.end_date}</span>
            <span>🎯 <strong>Mínimo Aprobatorio:</strong> ${prog.min_passing_score} pts</span>
            <span>📚 <strong>Cursos Preparatorios:</strong> ${(prog.courses || []).length}</span>
          </div>

          <!-- Cursos Preparatorios -->
          <div style="display:flex; flex-direction:column; gap:14px;">
            <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.04em;">
              Cursos Preparatorios y Ponderaciones Asociadas
            </h4>

            ${(prog.courses && prog.courses.length > 0) ? prog.courses.map(course => `
              <div style="border:1px solid var(--border-light); border-radius:var(--radius-md); padding:16px; background:white;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <div>
                    <strong style="color:var(--wine-800); font-size:0.98rem;">${course.name}</strong>
                    <span style="font-size:0.78rem; color:var(--text-muted); margin-left:8px;">(${course.code}) • Plazo máx: ${course.max_deadline_days} días</span>
                  </div>
                  ${canManage ? `
                    <button class="btn btn-ghost btn-sm btn-add-activity" data-course-id="${course.id}" data-course-name="${course.name}" style="color:var(--blue-700);">
                      ${Icons.plus(14)}
                      <span>Agregar Actividad/Proyecto</span>
                    </button>
                  ` : ''}
                </div>

                <!-- Actividades del curso -->
                <div style="padding-left:14px; border-left:2px solid var(--border-light); display:flex; flex-direction:column; gap:8px;">
                  ${(course.activities && course.activities.length > 0) ? course.activities.map(act => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-subtle); border-radius:var(--radius-sm); font-size:0.85rem;">
                      <div style="display:flex; align-items:center; gap:10px;">
                        <span style="color:var(--wine-700); font-weight:700;">•</span>
                        <strong>${act.title}</strong>
                        ${renderBadge({ text: act.evidence_type, variant: 'blue' })}
                        ${act.is_mandatory ? renderBadge({ text: 'Obligatorio', variant: 'wine' }) : ''}
                      </div>
                      <div style="display:flex; align-items:center; gap:14px; font-size:0.8rem; color:var(--text-muted);">
                        <span>Vence: <strong>${act.deadline ? new Date(act.deadline).toLocaleDateString() : 'Sin fecha'}</strong></span>
                        <span style="font-weight:700; color:var(--wine-700); background:var(--wine-100); padding:3px 8px; border-radius:var(--radius-full);">
                          Ponderación: ${act.weighting}%
                        </span>
                      </div>
                    </div>
                  `).join('') : '<span style="font-size:0.8rem; color:var(--text-muted);">No se han configurado actividades para este curso.</span>'}
                </div>
              </div>
            `).join('') : '<p style="font-size:0.85rem; color:var(--text-muted);">Aún no se han definido cursos preparatorios para este programa.</p>'}
          </div>
        </div>
      `).join('');

      // Asignar eventos de botones internos
      document.querySelectorAll('.btn-add-course').forEach(b => {
        b.addEventListener('click', () => {
          openAddCourseModal({
            programId: parseInt(b.dataset.progId),
            programName: b.dataset.progName,
            onCreated: loadPrograms
          });
        });
      });

      document.querySelectorAll('.btn-add-activity').forEach(b => {
        b.addEventListener('click', () => {
          openAddActivityModal({
            courseId: parseInt(b.dataset.courseId),
            courseName: b.dataset.courseName,
            onCreated: loadPrograms
          });
        });
      });

    } catch (err) {
      container.innerHTML = `<div style="color:var(--risk-high);">Error cargando programas: ${err.message}</div>`;
      toast.error('Error al conectar con la API de programas');
    }
  };

  if (createProgramBtn) {
    createProgramBtn.addEventListener('click', () => {
      openCreateProgramModal({ onCreated: loadPrograms });
    });
  }

  loadPrograms();
}
