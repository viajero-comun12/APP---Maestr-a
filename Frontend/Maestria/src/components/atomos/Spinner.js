/**
 * Átomo: Spinner de Carga
 */

export function renderSpinner(size = 32, text = 'Cargando datos...') {
  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; gap:12px; color:var(--wine-700);">
      <svg width="${size}" height="${size}" viewBox="0 0 50 50" style="animation: spin 1s linear infinite;">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4"></circle>
      </svg>
      ${text ? `<span style="font-size:0.86rem; font-weight:600; color:var(--text-muted);">${text}</span>` : ''}
    </div>
    <style>
      @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
  `.trim();
}
