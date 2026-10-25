/**
 * SPA Router - Sistema de Gestión de Cursos Preparatorios para Maestría
 * Enrutamiento basado en Hash (#/ruta) con control de autenticación y roles
 */

import { api } from './services/api.js';
import { renderAppLayout, initAppLayoutEvents } from './components/plantillas/AppLayout.js';
import { renderLoginPage, initLoginPageEvents } from './Pages/LoginPage.js';
import { renderRegisterPage, initRegisterPageEvents } from './Pages/RegisterPage.js';
import { renderDashboardPage, initDashboardPageEvents } from './Pages/DashboardPage.js';
import { renderProgramsPage, initProgramsPageEvents } from './Pages/ProgramsPage.js';
import { renderPostulantesPage, initPostulantesPageEvents } from './Pages/PostulantesPage.js';
import { renderTutorTrackingPage, initTutorTrackingPageEvents } from './Pages/TutorTrackingPage.js';
import { renderApplicantPortalPage, initApplicantPortalPageEvents } from './Pages/ApplicantPortalPage.js';
import { renderTraceabilityPage, initTraceabilityPageEvents } from './Pages/TraceabilityPage.js';
import { renderReportsPage, initReportsPageEvents } from './Pages/ReportsPage.js';
import { renderProfilePage, initProfilePageEvents } from './Pages/ProfilePage.js';

const routes = {
  '#/login': { render: renderLoginPage, init: initLoginPageEvents, public: true },
  '#/registro': { render: renderRegisterPage, init: initRegisterPageEvents, public: true },
  '#/dashboard': { render: renderDashboardPage, init: initDashboardPageEvents, roles: ['ADMIN', 'COORDINADOR', 'TUTOR'] },
  '#/programas': { render: renderProgramsPage, init: initProgramsPageEvents, roles: ['ADMIN', 'COORDINADOR'] },
  '#/postulantes': { render: renderPostulantesPage, init: initPostulantesPageEvents, roles: ['ADMIN', 'COORDINADOR', 'TUTOR'] },
  '#/tutorias': { render: renderTutorTrackingPage, init: initTutorTrackingPageEvents, roles: ['ADMIN', 'COORDINADOR', 'TUTOR'] },
  '#/portal': { render: renderApplicantPortalPage, init: initApplicantPortalPageEvents, roles: ['POSTULANTE'] },
  '#/trazabilidad': { render: renderTraceabilityPage, init: initTraceabilityPageEvents },
  '#/reportes': { render: renderReportsPage, init: initReportsPageEvents },
  '#/perfil': { render: renderProfilePage, init: initProfilePageEvents }
};

export class Router {
  constructor(appElementId = 'app') {
    this.appElement = document.getElementById(appElementId);
    this.currentRoute = '';
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('auth:unauthorized', () => {
      window.location.hash = '#/login';
    });
  }

  init() {
    if (!window.location.hash) {
      window.location.hash = api.getToken() ? '#/dashboard' : '#/login';
    } else {
      this.handleRoute();
    }
  }

  async handleRoute() {
    let hash = window.location.hash || '#/login';
    // Ignorar querystrings para matching (ej: #/trazabilidad?id=1)
    const [path] = hash.split('?');
    const token = api.getToken();
    const user = api.getUser();

    // Redirección si no está autenticado
    if (!token && path !== '#/login' && path !== '#/registro') {
      window.location.hash = '#/login';
      return;
    }

    // Si ya está logueado y va a login/registro, redirigir al portal o dashboard
    if (token && (path === '#/login' || path === '#/registro')) {
      if (user && user.role === 'POSTULANTE') {
        window.location.hash = '#/portal';
      } else {
        window.location.hash = '#/dashboard';
      }
      return;
    }

    const routeConfig = routes[path] || (user && user.role === 'POSTULANTE' ? routes['#/portal'] : routes['#/dashboard']);

    // Verificar permisos de rol
    if (routeConfig.roles && user && !routeConfig.roles.includes(user.role)) {
      if (user.role === 'POSTULANTE') {
        window.location.hash = '#/portal';
      } else {
        window.location.hash = '#/dashboard';
      }
      return;
    }

    this.currentRoute = path;

    // Si es vista pública (Login o Registro), renderizar sin AppLayout
    if (routeConfig.public) {
      this.appElement.innerHTML = await routeConfig.render();
      if (routeConfig.init) routeConfig.init();
      return;
    }

    // Renderizar AppLayout con Sidebar y Navbar
    this.appElement.innerHTML = renderAppLayout(user, path);
    initAppLayoutEvents();

    // Inyectar el contenido de la página en #page-content
    const pageContent = document.getElementById('page-content');
    if (pageContent) {
      pageContent.innerHTML = await routeConfig.render();
      if (routeConfig.init) routeConfig.init();
    }
  }
}
