/**
 * Molécula: Toast Notifications
 * Alertas flotantes reactivas para retroalimentación instantánea
 */

import { Icons } from '../atomos/Icons.js';

class ToastManager {
  constructor() {
    this.container = null;
  }

  ensureContainer() {
    if (!this.container || !document.body.contains(this.container)) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 4000) {
    this.ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = Icons.alert(20);
    if (type === 'success') iconSvg = Icons.check(20);
    if (type === 'info') iconSvg = Icons.timeline(20);
    if (type === 'warning') iconSvg = Icons.alert(20);

    toast.innerHTML = `
      <div style="flex-shrink:0;">${iconSvg}</div>
      <div style="flex:1;">${message}</div>
      <button class="btn btn-ghost btn-sm" style="padding:2px; margin-left:6px;" aria-label="Cerrar">
        ${Icons.close(14)}
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    this.container.appendChild(toast);

    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }

  success(msg) { this.show(msg, 'success'); }
  error(msg) { this.show(msg, 'error', 5000); }
  warning(msg) { this.show(msg, 'warning'); }
  info(msg) { this.show(msg, 'info'); }
}

export const toast = new ToastManager();
