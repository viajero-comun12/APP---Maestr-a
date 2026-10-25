/**
 * Molécula: FormField
 * Agrupa etiqueta, control de entrada y mensajes de ayuda/error
 */

export function renderFormField({
  id = '',
  label = '',
  type = 'text',
  placeholder = '',
  value = '',
  required = false,
  helpText = '',
  as = 'input', // 'input' | 'textarea' | 'select'
  options = []  // Para select: [{ value, label }]
}) {
  let controlHtml = '';

  if (as === 'textarea') {
    controlHtml = `
      <textarea id="${id}" name="${id}" class="form-control" placeholder="${placeholder}" ${required ? 'required' : ''}>${value}</textarea>
    `;
  } else if (as === 'select') {
    const opts = options.map(opt => `
      <option value="${opt.value}" ${String(opt.value) === String(value) ? 'selected' : ''}>${opt.label}</option>
    `).join('');
    controlHtml = `
      <select id="${id}" name="${id}" class="form-control" ${required ? 'required' : ''}>
        ${placeholder ? `<option value="">-- ${placeholder} --</option>` : ''}
        ${opts}
      </select>
    `;
  } else {
    controlHtml = `
      <input type="${type}" id="${id}" name="${id}" class="form-control" placeholder="${placeholder}" value="${value}" ${required ? 'required' : ''} />
    `;
  }

  return `
    <div class="form-group">
      ${label ? `<label for="${id}" class="form-label">${label} ${required ? '<span class="required">*</span>' : ''}</label>` : ''}
      ${controlHtml}
      ${helpText ? `<small style="font-size:0.75rem; color:var(--text-muted);">${helpText}</small>` : ''}
    </div>
  `.trim();
}
