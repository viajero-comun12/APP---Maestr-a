/**
 * Molécula: Modal
 * Diálogo modal accesible y reutilizable
 */

import { Icons } from '../atomos/Icons.js';

export function openModal({
  title = '',
  bodyHtml = '',
  footerHtml = '',
  onClose = null,
  maxWidth = '600px'
}) {
  // Remover modales existentes
  closeModal();

  const overlay = document.createElement('div');
  overlay.id = 'active-modal-overlay';
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width: ${maxWidth};">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button type="button" class="btn btn-ghost btn-sm" id="modal-close-btn" aria-label="Cerrar modal">
          ${Icons.close(18)}
        </button>
      </div>
      <div class="modal-body">
        ${bodyHtml}
      </div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  const handleClose = () => {
    closeModal();
    if (onClose) onClose();
  };

  overlay.querySelector('#modal-close-btn').addEventListener('click', handleClose);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) handleClose();
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
      window.removeEventListener('keydown', handleKeyDown);
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  return overlay;
}

export function closeModal() {
  const existing = document.getElementById('active-modal-overlay');
  if (existing) {
    existing.remove();
  }
}
