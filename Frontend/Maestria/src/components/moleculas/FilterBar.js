/**
 * Molécula: FilterBar
 * Barra interactiva con caja de búsqueda y filtros combinables
 */

import { Icons } from '../atomos/Icons.js';

export function renderFilterBar({
  searchId = 'filter-search',
  placeholder = 'Buscar por nombre, correo, programa...',
  selectFilters = [], // [{ id, label, options: [{value, label}] }]
  extraActionsHtml = ''
}) {
  const selectsHtml = selectFilters.map(filter => `
    <select id="${filter.id}" class="form-control" style="width: auto; min-width: 170px;">
      <option value="">${filter.label}</option>
      ${filter.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
    </select>
  `).join('');

  return `
    <div class="action-bar">
      <div style="display:flex; flex-wrap:wrap; align-items:center; gap:12px; flex:1;">
        <div class="search-box">
          <span class="search-icon">${Icons.search(16)}</span>
          <input type="text" id="${searchId}" class="form-control" placeholder="${placeholder}" />
        </div>
        ${selectsHtml}
      </div>
      ${extraActionsHtml ? `<div style="display:flex; align-items:center; gap:10px;">${extraActionsHtml}</div>` : ''}
    </div>
  `.trim();
}
