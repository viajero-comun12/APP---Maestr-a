/**
 * Organismo: DataTable
 * Tabla estructurada reutilizable con soporte para cabeceras y estados vacíos
 */

export function renderDataTable({
  columns = [], // [{ key, title, width, render: (row) => string }]
  data = [],
  emptyMessage = 'No se encontraron registros disponibles.',
  id = 'data-table'
}) {
  const headerHtml = columns.map(col => `
    <th ${col.width ? `style="width:${col.width};"` : ''}>${col.title}</th>
  `).join('');

  let rowsHtml = '';
  if (!data || data.length === 0) {
    rowsHtml = `
      <tr>
        <td colspan="${columns.length}" style="text-align:center; padding:36px; color:var(--text-muted);">
          <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <span>${emptyMessage}</span>
          </div>
        </td>
      </tr>
    `;
  } else {
    rowsHtml = data.map((row, index) => {
      const cells = columns.map(col => {
        const cellValue = col.render ? col.render(row, index) : (row[col.key] ?? '-');
        return `<td>${cellValue}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
  }

  return `
    <div class="table-container">
      <table class="data-table" id="${id}">
        <thead>
          <tr>${headerHtml}</tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `.trim();
}
