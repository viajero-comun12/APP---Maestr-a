/**
 * Página: Registro de Postulantes
 * Registro público para aspirantes a programas de maestría
 */

import { renderAuthLayout } from '../components/plantillas/AuthLayout.js';
import { renderFormField } from '../components/moleculas/FormField.js';
import { renderButtonHtml } from '../components/atomos/Button.js';
import { api } from '../services/api.js';
import { toast } from '../components/moleculas/Toast.js';

export function renderRegisterPage() {
  const formHtml = `
    <form id="register-form">
      ${renderFormField({
        id: 'reg-fullname',
        label: 'Nombre Completo y Apellidos',
        placeholder: 'Ej: Ing. Andrea Katherine Silva',
        required: true
      })}

      ${renderFormField({
        id: 'reg-email',
        label: 'Correo Electrónico',
        type: 'email',
        placeholder: 'andrea.silva@ejemplo.com',
        required: true
      })}

      <div class="grid-2" style="gap:12px; margin-bottom:0;">
        ${renderFormField({
          id: 'reg-document',
          label: 'Cédula / Pasaporte / DNI',
          placeholder: '1720000000',
          required: true
        })}

        ${renderFormField({
          id: 'reg-phone',
          label: 'Teléfono Móvil (WhatsApp)',
          placeholder: '+593 99 999 9999',
          required: true
        })}
      </div>

      <div class="grid-2" style="gap:12px; margin-bottom:0;">
        ${renderFormField({
          id: 'reg-password',
          label: 'Contraseña',
          type: 'password',
          placeholder: 'Mínimo 6 caracteres',
          required: true
        })}

        ${renderFormField({
          id: 'reg-password-confirm',
          label: 'Confirmar Contraseña',
          type: 'password',
          placeholder: 'Repita su contraseña',
          required: true
        })}
      </div>

      <div style="margin-top:20px;">
        ${renderButtonHtml({
          text: 'Completar Registro',
          variant: 'primary',
          type: 'submit',
          id: 'btn-submit-register',
          className: 'btn-lg'
        })}
      </div>
    </form>
  `;

  const footerHtml = `
    ¿Ya tiene una cuenta activa? <a href="#/login" style="font-weight:700; color:var(--wine-700);">Iniciar Sesión</a>
  `;

  return renderAuthLayout(
    'Registro de Postulante',
    'Cree su cuenta para comenzar sus cursos preparatorios de maestría',
    formHtml,
    footerHtml
  );
}

export function initRegisterPageEvents() {
  const form = document.getElementById('register-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('reg-fullname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const documentId = document.getElementById('reg-document').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirmPass = document.getElementById('reg-password-confirm').value;

      if (password !== confirmPass) {
        toast.error('Las contraseñas ingresadas no coinciden');
        return;
      }
      if (password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      const btn = document.getElementById('btn-submit-register');
      btn.disabled = true;

      try {
        await api.register({
          full_name: fullName,
          email: email,
          document_id: documentId,
          phone: phone,
          password: password,
          role: 'POSTULANTE'
        });

        toast.success('¡Registro exitoso! Iniciando sesión automáticamente...');
        // Auto login
        const loginRes = await api.login(email, password);
        window.location.hash = '#/portal';
      } catch (err) {
        toast.error(err.message || 'Error al completar el registro');
        btn.disabled = false;
      }
    });
  }
}
