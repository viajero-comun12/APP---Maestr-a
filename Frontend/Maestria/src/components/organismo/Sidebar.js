/**
 * Organismo: Sidebar
 * Navegación lateral adaptativa según el Rol del usuario (RBAC)
 */

import { Icons } from '../atomos/Icons.js';

export function renderSidebar(currentUser, activeRoute = '') {
  const role = currentUser ? currentUser.role : 'POSTULANTE';

  let navItems = [];

  if (role === 'ADMIN' || role === 'COORDINADOR') {
    navItems = [
      { route: '#/dashboard', label: 'Dashboard Ejecutivo', icon: Icons.dashboard(18) },
      { route: '#/programas', label: 'Programas y Cursos', icon: Icons.book(18) },
      { route: '#/postulantes', label: 'Gestión Postulantes', icon: Icons.users(18) },
      { route: '#/tutorias', label: 'Seguimiento Tutores', icon: Icons.clipboard(18) },
      { route: '#/trazabilidad', label: 'Línea de Trazabilidad', icon: Icons.timeline(18) },
      { route: '#/reportes', label: 'Centro de Reportes', icon: Icons.reports(18) }
    ];
  } else if (role === 'TUTOR') {
    navItems = [
      { route: '#/dashboard', label: 'Dashboard Resumen', icon: Icons.dashboard(18) },
      { route: '#/tutorias', label: 'Mis Postulantes', icon: Icons.users(18) },
      { route: '#/trazabilidad', label: 'Historial Trazabilidad', icon: Icons.timeline(18) },
      { route: '#/reportes', label: 'Reportes y Matrices', icon: Icons.reports(18) }
    ];
  } else if (role === 'POSTULANTE') {
    navItems = [
      { route: '#/portal', label: 'Mi Estado de Avance', icon: Icons.dashboard(18) },
      { route: '#/trazabilidad', label: 'Mi Línea de Tiempo', icon: Icons.timeline(18) },
      { route: '#/reportes', label: 'Descargar Mi Reporte', icon: Icons.reports(18) }
    ];
  }

  // Común para todos
  const bottomItems = [
    { route: '#/perfil', label: 'Mi Perfil Personal', icon: Icons.user(18) }
  ];

  const renderNavLinks = (items) => items.map(item => {
    const isActive = activeRoute.startsWith(item.route);
    return `
      <a href="${item.route}" class="nav-item ${isActive ? 'active' : ''}">
        ${item.icon}
        <span>${item.label}</span>
      </a>
    `;
  }).join('');

  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div style="width:32px; height:32px; background:var(--wine-700); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; color:white;">
          ${Icons.book(18)}
        </div>
        <span style="font-weight:800; font-size:1rem; color:var(--wine-900);">U. MAESTRÍAS</span>
      </div>

      <div class="sidebar-nav">
        <span class="nav-section-title">Módulos del Sistema</span>
        ${renderNavLinks(navItems)}

        <div style="margin-top:auto; padding-top:16px;">
          <span class="nav-section-title">Cuenta</span>
          ${renderNavLinks(bottomItems)}
        </div>
      </div>

      <div class="sidebar-footer">
        <div style="font-size:0.75rem; color:var(--text-muted); line-height:1.4;">
          <strong>Cursos Preparatorios</strong><br/>
          Versión 1.0 (Producción)
        </div>
      </div>
    </aside>
  `.trim();
}
