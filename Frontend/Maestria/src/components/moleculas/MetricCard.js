/**
 * Molécula: MetricCard (Tarjeta de Indicador Ejecutivo)
 * Tarjeta premium con icono en contenedor estilizado (vino, azul, amarillo), valor y etiqueta
 */

export function renderMetricCard({
  label = '',
  value = '0',
  subtext = '',
  icon = '',
  colorScheme = 'wine', // 'wine' | 'blue' | 'yellow' | 'red' | 'green'
  badge = null
}) {
  return `
    <div class="stat-card">
      <div class="stat-info">
        <span class="stat-label">${label}</span>
        <div style="display:flex; align-items:baseline; gap:10px;">
          <span class="stat-value">${value}</span>
          ${badge ? badge : ''}
        </div>
        ${subtext ? `<span class="stat-subtext">${subtext}</span>` : ''}
      </div>
      <div class="stat-icon ${colorScheme}">
        ${icon}
      </div>
    </div>
  `.trim();
}
