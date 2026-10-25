/**
 * Página: Login
 * Inicio de sesión seguro con selector de accesos rápidos para demostración
 */

import { renderAuthLayout } from '../components/plantillas/AuthLayout.js';
import { renderFormField } from '../components/moleculas/FormField.js';
import { renderButtonHtml } from '../components/atomos/Button.js';
import { api } from '../services/api.js';
import { toast } from '../components/moleculas/Toast.js';

export function renderLoginPage() {
  const formHtml = `
    <form id="login-form">
      ${renderFormField({
        id: 'login-email',
        label: 'Correo Electrónico Institucional',
        type: 'email',
        placeholder: 'ejemplo@universidad.edu',
        value: 'admin@universidad.edu',
        required: true
      })}

      ${renderFormField({
        id: 'login-password',
        label: 'Contraseña de Acceso',
        type: 'password',
        placeholder: '••••••••',
        value: 'Admin1234!',
        required: true
      })}

      <div style="margin-top:20px;">
        ${renderButtonHtml({
          text: 'Iniciar Sesión',
          variant: 'primary',
          type: 'submit',
          id: 'btn-submit-login',
          className: 'btn-lg',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>`
        })}
      </div>
    </form>

    <div style="margin-top:28px; padding-top:20px; border-top:1px dashed var(--border-light);">
      <div style="font-size:0.78rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:10px; text-align:center;">
        ⚡ Accesos Rápidos de Prueba (1 Clic)
      </div>
      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
        <button type="button" class="btn btn-ghost btn-sm quick-login" data-email="admin@universidad.edu" data-pass="Admin1234!" style="border:1px solid var(--border-light); font-size:0.78rem;">
          👤 <strong>Admin</strong>
        </button>
        <button type="button" class="btn btn-ghost btn-sm quick-login" data-email="coordinador@universidad.edu" data-pass="Coord1234!" style="border:1px solid var(--border-light); font-size:0.78rem;">
          🎓 <strong>Coordinador</strong>
        </button>
        <button type="button" class="btn btn-ghost btn-sm quick-login" data-email="tutor.carlos@universidad.edu" data-pass="Tutor1234!" style="border:1px solid var(--border-light); font-size:0.78rem;">
          📋 <strong>Tutor Carlos</strong>
        </button>
        <button type="button" class="btn btn-ghost btn-sm quick-login" data-email="postulante.ana@ejemplo.com" data-pass="Post1234!" style="border:1px solid var(--border-light); font-size:0.78rem;">
          🟢 <strong>Ana (Riesgo Bajo)</strong>
        </button>
        <button type="button" class="btn btn-ghost btn-sm quick-login" data-email="postulante.luis@ejemplo.com" data-pass="Post1234!" style="border:1px solid var(--border-light); font-size:0.78rem; grid-column: span 2;">
          🔴 <strong>Luis Morales (Riesgo Alto)</strong>
        </button>
      </div>
    </div>
  `;

  const footerHtml = `
    ¿Aún no tiene una cuenta de postulante? <a href="#/registro" style="font-weight:700; color:var(--wine-700);">Registrarse aquí</a>
  `;

  return renderAuthLayout(
    'Acceso al Sistema',
    'Ingrese sus credenciales para gestionar o consultar sus cursos preparatorios',
    formHtml,
    footerHtml
  );
}

export function initLoginPageEvents() {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      const submitBtn = document.getElementById('btn-submit-login');
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Verificando...';

      try {
        const res = await api.login(email, password);
        toast.success(`¡Bienvenido, ${res.full_name}!`);

        // Redirección según rol
        if (res.role === 'POSTULANTE') {
          window.location.hash = '#/portal';
        } else if (res.role === 'TUTOR') {
          window.location.hash = '#/tutorias';
        } else {
          window.location.hash = '#/dashboard';
        }
      } catch (err) {
        toast.error(err.message || 'Error al iniciar sesión');
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = 'Iniciar Sesión';
      }
    });
  }

  // Quick logins
  document.querySelectorAll('.quick-login').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('login-email').value = btn.dataset.email;
      document.getElementById('login-password').value = btn.dataset.pass;
      document.getElementById('login-form').dispatchEvent(new Event('submit'));
    });
  });
}
