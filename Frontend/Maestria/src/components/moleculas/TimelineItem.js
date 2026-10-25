/**
 * Molécula: TimelineItem
 * Renderiza un evento cronológico de trazabilidad (Llamadas, WhatsApp, Subidas, Revisiones, Correos)
 */

import { Icons } from '../atomos/Icons.js';
import { renderBadge } from '../atomos/Badge.js';

export function renderTimelineItem({
  timestamp = '',
  type = '',
  title = '',
  description = '',
  actor = ''
}) {
  let iconSvg = Icons.timeline(16);
  let badgeVariant = 'neutral';

  const typeLower = (type || '').toLowerCase();
  if (typeLower.includes('llamada') || typeLower.includes('phone')) {
    iconSvg = Icons.phone(16);
    badgeVariant = 'wine';
  } else if (typeLower.includes('correo') || typeLower.includes('notificacion') || typeLower.includes('email')) {
    iconSvg = Icons.mail(16);
    badgeVariant = 'blue';
  } else if (typeLower.includes('whatsapp')) {
    iconSvg = Icons.whatsapp(16);
    badgeVariant = 'success';
  } else if (typeLower.includes('videoconferencia')) {
    iconSvg = Icons.video(16);
    badgeVariant = 'yellow';
  } else if (typeLower.includes('carga_evidencia') || typeLower.includes('upload')) {
    iconSvg = Icons.upload(16);
    badgeVariant = 'blue';
  } else if (typeLower.includes('revision') || typeLower.includes('aprobado')) {
    iconSvg = Icons.check(16);
    badgeVariant = 'success';
  } else if (typeLower.includes('inscripcion')) {
    iconSvg = Icons.book(16);
    badgeVariant = 'wine';
  }

  const formattedDate = timestamp ? new Date(timestamp).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }) : 'Fecha no registrada';

  return `
    <div class="timeline-item">
      <div class="timeline-dot">
        ${iconSvg}
      </div>
      <div class="timeline-card">
        <div class="timeline-meta">
          <div style="display:flex; align-items:center; gap:8px;">
            ${renderBadge({ text: type.replace(/_/g, ' '), variant: badgeVariant })}
            <span style="font-weight:600; color:var(--text-secondary);">${actor}</span>
          </div>
          <time datetime="${timestamp}">${formattedDate}</time>
        </div>
        <h4 class="timeline-title">${title}</h4>
        <div class="timeline-desc">${description}</div>
      </div>
    </div>
  `.trim();
}
