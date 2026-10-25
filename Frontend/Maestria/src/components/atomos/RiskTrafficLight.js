/**
 * Átomo: RiskTrafficLight (Semáforo de Riesgo Académico)
 * Representa visualmente el algoritmo de detección temprana:
 * - ALTO: Rojo (con pulso animado)
 * - MEDIO: Amarillo (advertencia preventiva)
 * - BAJO: Verde (cumplimiento normal)
 */

export function renderRiskTrafficLight(riskLevel) {
  const level = (riskLevel || 'BAJO').toUpperCase();
  let className = 'risk-bajo';
  let label = 'Riesgo Bajo';

  if (level === 'ALTO') {
    className = 'risk-alto';
    label = 'Riesgo Alto';
  } else if (level === 'MEDIO') {
    className = 'risk-medio';
    label = 'Riesgo Medio';
  }

  return `
    <span class="risk-badge ${className}" title="Semáforo de Riesgo Académico: ${label}">
      <span class="risk-dot"></span>
      <span>${label}</span>
    </span>
  `.trim();
}
