from typing import List, Dict, Any
from pydantic import BaseModel

class RiskDistribution(BaseModel):
    alto: int = 0
    medio: int = 0
    bajo: int = 0

class ProgramMetrics(BaseModel):
    program_id: int
    program_name: str
    total_enrolled: int
    approved_count: int
    in_risk_count: int
    average_completion: float

class DashboardMetricsOut(BaseModel):
    total_postulantes: int
    cursos_activos: int
    postulantes_aprobados: int
    postulantes_en_riesgo: int
    distribucion_riesgo: RiskDistribution
    porcentaje_cumplimiento_promedio: float
    actividades_pendientes: int
    seguimientos_realizados: int
    seguimientos_sin_respuesta: int
    metricas_por_programa: List[ProgramMetrics] = []
