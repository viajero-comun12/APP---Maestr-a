/**
 * Átomo: ProgressBar
 * Barra de avance de cumplimiento con cálculo ponderado porcentual
 */

export function renderProgressBar(percentage = 0, status = 'default') {
  const cleanPct = Math.min(Math.max(parseFloat(percentage) || 0, 0), 100);
  let colorClass = '';

  if (cleanPct >= 100) {
    colorClass = 'success';
  } else if (cleanPct < 40) {
    colorClass = 'danger';
  } else if (cleanPct < 70) {
    colorClass = 'warning';
  }

  return `
    <div class="progress-wrapper" style="display:flex; flex-direction:column; gap:4px; width:100%;">
      <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:600; color:var(--text-secondary);">
        <span>Avance Ponderado</span>
        <span style="color:var(--wine-700);">${cleanPct.toFixed(1)}%</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill ${colorClass}" style="width: ${cleanPct}%;"></div>
      </div>
    </div>
  `.trim();
}
