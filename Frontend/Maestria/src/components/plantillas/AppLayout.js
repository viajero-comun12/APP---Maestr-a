/**
 * Plantilla: AppLayout
 * Estructura estándar de la aplicación: Sidebar + Navbar + Content Area
 */

import { renderSidebar } from '../organismo/Sidebar.js';
import { renderNavbar, initNavbarEvents } from '../organismo/Navbar.js';

export function renderAppLayout(currentUser, activeRoute = '') {
  return `
    <div class="app-container">
      ${renderSidebar(currentUser, activeRoute)}
      <div class="main-wrapper">
        ${renderNavbar(currentUser)}
        <main class="content-area" id="page-content">
          <!-- El contenido de la página se inyecta aquí -->
        </main>
      </div>
    </div>
  `.trim();
}

export function initAppLayoutEvents() {
  initNavbarEvents();
}
