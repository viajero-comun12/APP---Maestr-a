/**
 * Página: Mi Perfil Personal
 * Consulta y actualización de datos personales y contraseña
 */

import { api } from '../services/api.js';
import { Icons } from '../components/atomos/Icons.js';
import { renderSpinner } from '../components/atomos/Spinner.js';
import { renderFormField } from '../components/moleculas/FormField.js';
import { renderButtonHtml } from '../components/atomos/Button.js';
import { renderBadge } from '../components/atomos/Badge.js';
import { toast } from '../components/moleculas/Toast.js';

export async function renderProfilePage() {
  return `
    <div style="display:flex; flex-direction:column; gap:24px; max-width:700px;">
      <div>
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--wine-800); letter-spacing:-0.02em;">Mi Perfil Personal</h2>
        <p style="font-size:0.88rem; color:var(--text-muted);">Información de contacto, documento de identificación y seguridad</p>
      </div>

      <div id="profile-container">
        ${renderSpinner(36, 'Cargando datos del perfil...')}
      </div>
    </div>
  `;
}

export async function initProfilePageEvents() {
  const container = document.getElementById('profile-container');

  try {
    const user = await api.getMe();

    container.innerHTML = `
      <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:28px; box-shadow:var(--shadow-sm); border-top:4px solid var(--wine-700);">
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px; padding-bottom:18px; border-bottom:1px solid var(--border-light);">
          <div style="width:64px; height:64px; border-radius:50%; background:var(--wine-700); color:white; font-size:1.6rem; font-weight:800; display:flex; align-items:center; justify-content:center;">
            ${user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style="font-size:1.25rem; font-weight:800; color:var(--wine-900);">${user.full_name}</h3>
            <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
              ${renderBadge({ text: user.role, variant: 'wine' })}
              <span style="font-size:0.82rem; color:var(--text-muted);">${user.email}</span>
            </div>
          </div>
        </div>

        <form id="profile-update-form" style="display:flex; flex-direction:column; gap:14px;">
          ${renderFormField({
            id: 'prof-fullname',
            label: 'Nombre Completo',
            value: user.full_name,
            required: true
          })}

          <div class="grid-2" style="gap:12px; margin-bottom:0;">
            ${renderFormField({
              id: 'prof-document',
              label: 'Cédula / DNI / Pasaporte',
              value: user.document_id || '',
              placeholder: '1720000000'
            })}

            ${renderFormField({
              id: 'prof-phone',
              label: 'Teléfono Móvil (WhatsApp)',
              value: user.phone || '',
              placeholder: '+593 99 999 9999'
            })}
          </div>

          <div style="border-top:1px dashed var(--border-light); padding-top:16px; margin-top:8px;">
            <h4 style="font-size:0.92rem; font-weight:700; color:var(--wine-800); margin-bottom:12px;">
              Cambiar Contraseña (Opcional)
            </h4>

            <div class="grid-2" style="gap:12px; margin-bottom:0;">
              ${renderFormField({
                id: 'prof-password',
                label: 'Nueva Contraseña',
                type: 'password',
                placeholder: 'Dejar en blanco para no cambiar'
              })}

              ${renderFormField({
                id: 'prof-password-confirm',
                label: 'Confirmar Contraseña',
                type: 'password',
                placeholder: 'Repita la nueva contraseña'
              })}
            </div>
          </div>

          <div style="margin-top:16px;">
            ${renderButtonHtml({
              text: 'Guardar Cambios de Perfil',
              variant: 'primary',
              type: 'submit',
              id: 'btn-save-profile',
              className: 'btn-md'
            })}
          </div>
        </form>
      </div>
    `;

    const form = document.getElementById('profile-update-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('prof-fullname').value.trim();
        const documentId = document.getElementById('prof-document').value.trim();
        const phone = document.getElementById('prof-phone').value.trim();
        const password = document.getElementById('prof-password').value;
        const confirmPass = document.getElementById('prof-password-confirm').value;

        if (password && password !== confirmPass) {
          toast.error('Las contraseñas no coinciden');
          return;
        }

        const btn = document.getElementById('btn-save-profile');
        btn.disabled = true;

        try {
          const updatePayload = {
            full_name: fullName,
            document_id: documentId,
            phone: phone
          };
          if (password) {
            updatePayload.password = password;
          }

          await api.updateProfile(updatePayload);
          toast.success('Perfil actualizado correctamente');
          window.location.reload();
        } catch (err) {
          toast.error(err.message || 'Error al actualizar perfil');
          btn.disabled = false;
        }
      });
    }

  } catch (err) {
    container.innerHTML = `<div style="color:var(--risk-high); padding:20px;">Error al cargar perfil: ${err.message}</div>`;
  }
}
