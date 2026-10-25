/**
 * Plantilla: AuthLayout
 * Layout centrado para vistas públicas (Login y Registro) con paleta institucional
 */

import { Icons } from '../atomos/Icons.js';

export function renderAuthLayout(title, subtitle, formHtml, footerHtml = '') {
  return `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div style="width:52px; height:52px; background:linear-gradient(135deg, var(--wine-700), var(--wine-900)); color:white; border-radius:var(--radius-lg); display:inline-flex; align-items:center; justify-content:center; margin-bottom:14px; box-shadow:var(--shadow-wine);">
            ${Icons.book(28)}
          </div>
          <h1>${title}</h1>
          <p>${subtitle}</p>
        </div>

        <div class="auth-body">
          ${formHtml}
        </div>

        ${footerHtml ? `<div style="margin-top:24px; text-align:center; font-size:0.86rem; color:var(--text-muted);">${footerHtml}</div>` : ''}
      </div>
    </div>
  `.trim();
}
