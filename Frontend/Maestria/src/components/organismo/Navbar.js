/**
 * Organismo: Navbar
 * Barra superior institucional con logo vino, usuario y notificaciones
 */

import { Icons } from '../atomos/Icons.js';
import { api } from '../../services/api.js';
import { toast } from '../moleculas/Toast.js';

export function renderNavbar(currentUser) {
  const userRole = currentUser ? currentUser.role : '';
  const fullName = currentUser ? currentUser.fullName : 'Usuario';
  const initial = fullName ? fullName.charAt(0).toUpperCase() : 'U';

  return `
    <header class="navbar">
      <div class="navbar-brand">
        <div class="logo-icon">
          ${Icons.book(22)}
        </div>
        <div>
          <div class="brand-title">SISTEMA DE GESTIÓN DE CURSOS PREPARATORIOS</div>
          <div class="brand-subtitle">Programas de Posgrado y Maestría</div>
        </div>
      </div>

      <div class="navbar-actions">
        ${(userRole === 'ADMIN' || userRole === 'COORDINADOR') ? `
          <button id="btn-trigger-alerts" class="btn btn-warning btn-sm" title="Disparar verificación de alertas por vencimiento (15, 10, 5, 3, 1 días)">
            ${Icons.alert(16)}
            <span>Verificar Alertas</span>
          </button>
        ` : ''}

        <div class="user-badge-container">
          <div class="user-avatar-mini">${initial}</div>
          <div style="display:flex; flex-direction:column; line-height:1.2;">
            <span style="font-weight:700; font-size:0.85rem; color:var(--wine-900);">${fullName}</span>
            <span style="font-size:0.7rem; font-weight:600; color:var(--wine-700); text-transform:uppercase;">${userRole}</span>
          </div>
        </div>

        <button id="btn-logout" class="btn btn-ghost btn-sm" title="Cerrar sesión">
          ${Icons.logout(18)}
        </button>
      </div>
    </header>
  `.trim();
}

export function initNavbarEvents() {
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      api.clearAuth();
      window.location.hash = '#/login';
      window.location.reload();
    });
  }

  const triggerAlertsBtn = document.getElementById('btn-trigger-alerts');
  if (triggerAlertsBtn) {
    triggerAlertsBtn.addEventListener('click', async () => {
      try {
        triggerAlertsBtn.disabled = true;
        const res = await api.checkDeadlines();
        toast.success(res.message || 'Verificación de alertas ejecutada exitosamente');
      } catch (err) {
        toast.error(err.message);
      } finally {
        triggerAlertsBtn.disabled = false;
      }
    });
  }
}
