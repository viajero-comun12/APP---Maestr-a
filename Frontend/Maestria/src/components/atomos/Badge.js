/**
 * Átomo: Badge
 * Etiquetas para estados, tipos de evidencia, roles y categorías
 */

export function renderBadge({
  text = '',
  variant = 'wine', // 'wine' | 'blue' | 'yellow' | 'success' | 'danger' | 'neutral'
  icon = '',
  className = ''
}) {
  return `
    <span class="badge badge-${variant} ${className}">
      ${icon ? `<span class="badge-icon">${icon}</span>` : ''}
      <span>${text}</span>
    </span>
  `.trim();
}

export function renderStatusBadge(status) {
  switch (status) {
    case 'APROBADO':
      return renderBadge({ text: 'Aprobado', variant: 'success' });
    case 'EN_PROCESO':
    case 'PENDIENTE':
      return renderBadge({ text: 'En Proceso', variant: 'blue' });
    case 'EN_RIESGO':
      return renderBadge({ text: 'En Riesgo', variant: 'danger' });
    case 'RECHAZADO':
    case 'REPROBADO':
      return renderBadge({ text: 'Rechazado', variant: 'danger' });
    case 'COMPROMISO_PENDIENTE':
      return renderBadge({ text: 'Compromiso Pendiente', variant: 'yellow' });
    case 'RESUELTO':
    case 'CERRADO':
      return renderBadge({ text: 'Resuelto', variant: 'success' });
    case 'SIN_RESPUESTA':
      return renderBadge({ text: 'Sin Respuesta', variant: 'danger' });
    default:
      return renderBadge({ text: status || 'Desconocido', variant: 'neutral' });
  }
}
