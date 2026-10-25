/**
 * Página: Gestión de Postulantes
 * Matriz de postulantes, semáforo de riesgo, asignación de tutores y descarga de expediente
 */

import { api } from '../services/api.js';
import { Icons } from '../components/atomos/Icons.js';
import { renderSpinner } from '../components/atomos/Spinner.js';
import { renderDataTable } from '../components/organismo/DataTable.js';
import { renderRiskTrafficLight } from '../components/atomos/RiskTrafficLight.js';
import { renderStatusBadge } from '../components/atomos/Badge.js';
import { renderFilterBar } from '../components/moleculas/FilterBar.js';
import { openAssignTutorModal } from '../components/organismo/AssignTutorModal.js';
import { openTrackingModal } from '../components/organismo/TrackingModal.js';
import { toast } from '../components/moleculas/Toast.js';

export async function renderPostulantesPage() {
  return `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
        <div>
          <h2 style="font-size:1.6rem; font-weight:800; color:var(--wine-800); letter-spacing:-0.02em;">Gestión y Seguimiento de Postulantes</h2>
          <p style="font-size:0.88rem; color:var(--text-muted);">Supervisión de avance académico, detección de riesgo por semáforo y asignación de tutorías</p>
        </div>
      </div>

      <div id="postulantes-filter-area">
        ${renderFilterBar({
          searchId: 'search-postulantes',
          placeholder: 'Buscar por nombre, correo o programa...',
          selectFilters: [
            {
              id: 'filter-risk',
              label: 'Todos los Niveles de Riesgo',
              options: [
                { value: 'ALTO', label: '🔴 Riesgo Alto' },
                { value: 'MEDIO', label: '🟡 Riesgo Medio' },
                { value: 'BAJO', label: '🟢 Riesgo Bajo' }
              ]
            },
            {
              id: 'filter-status',
              label: 'Todos los Estados',
              options: [
                { value: 'EN_PROCESO', label: 'En Proceso' },
                { value: 'APROBADO', label: 'Aprobado' },
                { value: 'EN_RIESGO', label: 'En Riesgo' }
              ]
            }
          ]
        })}
      </div>

      <div id="postulantes-table-area">
        ${renderSpinner(36, 'Cargando listado de postulantes...')}
      </div>
    </div>
  `;
}

export async function initPostulantesPageEvents() {
  const tableContainer = document.getElementById('postulantes-table-area');
  const searchInput = document.getElementById('search-postulantes');
  const riskFilter = document.getElementById('filter-risk');
  const statusFilter = document.getElementById('filter-status');
  const currentUser = api.getUser();
  const canAssign = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'COORDINADOR');

  let allEnrollments = [];

  const loadEnrollments = async () => {
    try {
      tableContainer.innerHTML = renderSpinner(36, 'Cargando datos...');
      allEnrollments = await api.getEnrollments();
      renderFilteredTable();
    } catch (err) {
      tableContainer.innerHTML = `<div style="color:var(--risk-high); padding:20px;">Error al cargar postulantes: ${err.message}</div>`;
      toast.error('Error al conectar con la base de datos de postulantes');
    }
  };

  const renderFilteredTable = () => {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const riskVal = riskFilter ? riskFilter.value : '';
    const statusVal = statusFilter ? statusFilter.value : '';

    const filtered = allEnrollments.filter(e => {
      const matchQuery = !query || 
        (e.applicant_name && e.applicant_name.toLowerCase().includes(query)) ||
        (e.applicant_email && e.applicant_email.toLowerCase().includes(query)) ||
        (e.program_name && e.program_name.toLowerCase().includes(query));

      const matchRisk = !riskVal || e.risk_level === riskVal;
      const matchStatus = !statusVal || e.status === statusVal;

      return matchQuery && matchRisk && matchStatus;
    });

    const columns = [
      {
        key: 'applicant_name',
        title: 'Postulante',
        render: (row) => `
          <div>
            <strong style="color:var(--wine-900); font-size:0.92rem;">${row.applicant_name}</strong>
            <div style="font-size:0.78rem; color:var(--text-muted);">${row.applicant_email}</div>
          </div>
        `
      },
      {
        key: 'program_name',
        title: 'Programa & Convocatoria',
        render: (row) => `
          <div>
            <div style="font-weight:600; color:var(--text-primary);">${row.program_name}</div>
            <div style="font-size:0.75rem; color:var(--wine-700);">${row.program_call || ''}</div>
          </div>
        `
      },
      {
        key: 'completion_percentage',
        title: 'Avance Ponderado',
        render: (row) => `
          <div style="width:130px;">
            <div style="font-size:0.78rem; font-weight:700; color:var(--wine-800); margin-bottom:3px;">${row.completion_percentage}%</div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill ${row.completion_percentage >= 100 ? 'success' : ''}" style="width:${row.completion_percentage}%;"></div>
            </div>
          </div>
        `
      },
      {
        key: 'risk_level',
        title: 'Semáforo de Riesgo',
        render: (row) => renderRiskTrafficLight(row.risk_level)
      },
      {
        key: 'status',
        title: 'Estado',
        render: (row) => renderStatusBadge(row.status)
      },
      {
        key: 'tutor_name',
        title: 'Tutor Responsable',
        render: (row) => `
          <div style="font-size:0.85rem;">
            ${row.tutor_name ? `<strong>${row.tutor_name}</strong>` : '<span style="color:var(--text-muted); font-style:italic;">No asignado</span>'}
          </div>
        `
      },
      {
        key: 'actions',
        title: 'Acciones de Gestión',
        render: (row) => `
          <div style="display:flex; gap:6px;">
            ${canAssign ? `
              <button class="btn btn-ghost btn-sm btn-assign-tutor" data-id="${row.id}" data-name="${row.applicant_name}" data-tutor="${row.tutor_name || ''}" title="Asignar o reasignar tutor">
                👤 Asignar
              </button>
            ` : ''}

            <button class="btn btn-outline btn-sm btn-quick-tracking" data-id="${row.id}" data-name="${row.applicant_name}" title="Registrar contacto del tutor">
              ${Icons.phone(14)} Contactar
            </button>

            <button class="btn btn-ghost btn-sm btn-download-pdf" data-id="${row.id}" data-name="${row.applicant_name}" title="Descargar Reporte Individual en PDF">
              ${Icons.pdf(16)}
            </button>
          </div>
        `
      }
    ];

    tableContainer.innerHTML = renderDataTable({
      columns,
      data: filtered,
      emptyMessage: 'No se encontraron postulantes que coincidan con los filtros aplicados.'
    });

    // Eventos de botones en la tabla
    document.querySelectorAll('.btn-assign-tutor').forEach(b => {
      b.addEventListener('click', () => {
        openAssignTutorModal({
          enrollmentId: parseInt(b.dataset.id),
          applicantName: b.dataset.name,
          currentTutorName: b.dataset.tutor,
          onAssigned: loadEnrollments
        });
      });
    });

    document.querySelectorAll('.btn-quick-tracking').forEach(b => {
      b.addEventListener('click', () => {
        openTrackingModal({
          enrollmentId: parseInt(b.dataset.id),
          applicantName: b.dataset.name,
          onTrackingComplete: loadEnrollments
        });
      });
    });

    document.querySelectorAll('.btn-download-pdf').forEach(b => {
      b.addEventListener('click', async () => {
        try {
          b.disabled = true;
          toast.info('Generando reporte individual en PDF...');
          await api.downloadApplicantPdf(parseInt(b.dataset.id), b.dataset.name);
          toast.success('Reporte descargado correctamente');
        } catch (err) {
          toast.error(err.message || 'Error al descargar reporte');
        } finally {
          b.disabled = false;
        }
      });
    });
  };

  if (searchInput) searchInput.addEventListener('input', renderFilteredTable);
  if (riskFilter) riskFilter.addEventListener('change', renderFilteredTable);
  if (statusFilter) statusFilter.addEventListener('change', renderFilteredTable);

  loadEnrollments();
}
