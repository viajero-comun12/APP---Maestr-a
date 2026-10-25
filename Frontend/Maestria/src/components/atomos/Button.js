/**
 * Átomo: Button
 * Variantes: primary (vino), secondary (azul), warning (amarillo), outline, ghost, danger
 */

export function createButton({
  text = '',
  variant = 'primary', // 'primary' | 'secondary' | 'warning' | 'outline' | 'outline-blue' | 'ghost' | 'danger'
  size = 'md',         // 'sm' | 'md' | 'lg'
  icon = null,
  type = 'button',
  id = '',
  disabled = false,
  className = '',
  onClick = null
}) {
  const btn = document.createElement('button');
  btn.type = type;
  if (id) btn.id = id;
  btn.disabled = disabled;
  btn.className = `btn btn-${variant} btn-${size} ${className}`.trim();

  let htmlContent = '';
  if (icon) {
    htmlContent += `<span class="btn-icon">${icon}</span>`;
  }
  if (text) {
    htmlContent += `<span class="btn-text">${text}</span>`;
  }
  btn.innerHTML = htmlContent;

  if (onClick) {
    btn.addEventListener('click', onClick);
  }

  return btn;
}

export function renderButtonHtml({
  text = '',
  variant = 'primary',
  size = 'md',
  icon = '',
  type = 'button',
  id = '',
  disabled = false,
  className = ''
}) {
  return `
    <button type="${type}" ${id ? `id="${id}"` : ''} class="btn btn-${variant} btn-${size} ${className}" ${disabled ? 'disabled' : ''}>
      ${icon ? `<span class="btn-icon">${icon}</span>` : ''}
      ${text ? `<span class="btn-text">${text}</span>` : ''}
    </button>
  `.trim();
}
