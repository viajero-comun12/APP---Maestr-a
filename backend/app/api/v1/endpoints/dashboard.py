from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, RoleChecker
from app.models.user import User, UserRole
from app.models.program import MasterProgram, PreparatoryCourse, Activity
from app.models.enrollment import ApplicantEnrollment, EnrollmentStatus, RiskLevel, Evidence, EvidenceStatus
from app.models.tracking import TrackingRecord, CaseStatus
from app.schemas.dashboard import DashboardMetricsOut, RiskDistribution, ProgramMetrics

router = APIRouter()

@router.get("/metrics", response_model=DashboardMetricsOut, summary="Obtener indicadores ejecutivos en tiempo real")
def get_executive_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR, UserRole.TUTOR]))
):
    # Total postulantes inscritos
    total_postulantes = db.query(ApplicantEnrollment).count()

    # Cursos activos
    cursos_activos = db.query(PreparatoryCourse).filter(PreparatoryCourse.is_active == True).count()

    # Postulantes aprobados
    postulantes_aprobados = db.query(ApplicantEnrollment).filter(
        ApplicantEnrollment.status == EnrollmentStatus.APROBADO
    ).count()

    # Postulantes en riesgo
    postulantes_en_riesgo = db.query(ApplicantEnrollment).filter(
        ApplicantEnrollment.risk_level.in_([RiskLevel.ALTO, RiskLevel.MEDIO])
    ).count()

    # Desglose de semáforo de riesgo
    riesgo_alto = db.query(ApplicantEnrollment).filter(ApplicantEnrollment.risk_level == RiskLevel.ALTO).count()
    riesgo_medio = db.query(ApplicantEnrollment).filter(ApplicantEnrollment.risk_level == RiskLevel.MEDIO).count()
    riesgo_bajo = db.query(ApplicantEnrollment).filter(ApplicantEnrollment.risk_level == RiskLevel.BAJO).count()

    # Porcentaje de cumplimiento promedio general
    avg_completion = db.query(func.avg(ApplicantEnrollment.completion_percentage)).scalar() or 0.0

    # Actividades pendientes de entrega/aprobación a nivel global
    # Conteo de evidencias pendientes de revisión
    actividades_pendientes = db.query(Evidence).filter(Evidence.status == EvidenceStatus.PENDIENTE).count()

    # Total de seguimientos realizados por tutores
    seguimientos_realizados = db.query(TrackingRecord).count()

    # Seguimientos sin respuesta del postulante
    seguimientos_sin_respuesta = db.query(TrackingRecord).filter(
        TrackingRecord.case_status == CaseStatus.SIN_RESPUESTA
    ).count()

    # Métricas desglosadas por programa
    programs = db.query(MasterProgram).filter(MasterProgram.is_active == True).all()
    metricas_programas = []

    for prog in programs:
        prog_enrollments = db.query(ApplicantEnrollment).filter(ApplicantEnrollment.program_id == prog.id).all()
        prog_total = len(prog_enrollments)
        prog_approved = sum(1 for e in prog_enrollments if e.status == EnrollmentStatus.APROBADO)
        prog_risk = sum(1 for e in prog_enrollments if e.risk_level in [RiskLevel.ALTO, RiskLevel.MEDIO])
        prog_avg = (sum(e.completion_percentage for e in prog_enrollments) / prog_total) if prog_total > 0 else 0.0

        metricas_programas.append(ProgramMetrics(
            program_id=prog.id,
            program_name=prog.name,
            total_enrolled=prog_total,
            approved_count=prog_approved,
            in_risk_count=prog_risk,
            average_completion=round(prog_avg, 2)
        ))

    return DashboardMetricsOut(
        total_postulantes=total_postulantes,
        cursos_activos=cursos_activos,
        postulantes_aprobados=postulantes_aprobados,
        postulantes_en_riesgo=postulantes_en_riesgo,
        distribucion_riesgo=RiskDistribution(
            alto=riesgo_alto,
            medio=riesgo_medio,
            bajo=riesgo_bajo
        ),
        porcentaje_cumplimiento_promedio=round(float(avg_completion), 2),
        actividades_pendientes=actividades_pendientes,
        seguimientos_realizados=seguimientos_realizados,
        seguimientos_sin_respuesta=seguimientos_sin_respuesta,
        metricas_por_programa=metricas_programas
    )
