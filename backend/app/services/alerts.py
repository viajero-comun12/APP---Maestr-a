from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.enrollment import ApplicantEnrollment, Evidence, RiskLevel, EnrollmentStatus, EvidenceStatus
from app.models.program import Activity, PreparatoryCourse
from app.models.tracking import TrackingRecord, CaseStatus
from app.services.notification import notify_deadline_reminder

def recalculate_enrollment_progress(db: Session, enrollment: ApplicantEnrollment) -> Dict[str, Any]:
    """
    Calcula el porcentaje de avance del postulante según la ponderación de las actividades
    aprobadas y actualiza el estado y nivel de riesgo (Semáforo).
    """
    program = enrollment.program
    if not program:
        return {"completion_percentage": 0.0, "risk_level": RiskLevel.BAJO}

    # Obtener todas las actividades de los cursos del programa
    courses = db.query(PreparatoryCourse).filter(
        PreparatoryCourse.program_id == program.id,
        PreparatoryCourse.is_active == True
    ).all()

    course_ids = [c.id for c in courses]
    activities = db.query(Activity).filter(Activity.course_id.in_(course_ids)).all() if course_ids else []
    
    total_activities_count = len(activities)
    if total_activities_count == 0:
        enrollment.completion_percentage = 100.0
        enrollment.risk_level = RiskLevel.BAJO
        enrollment.status = EnrollmentStatus.APROBADO
        db.commit()
        return {"completion_percentage": 100.0, "risk_level": RiskLevel.BAJO}

    # Evidencias del postulante
    evidences = db.query(Evidence).filter(Evidence.enrollment_id == enrollment.id).all()
    approved_evidences = {e.activity_id: e for e in evidences if e.status == EvidenceStatus.APROBADO}
    submitted_activity_ids = {e.activity_id for e in evidences}

    # Calcular ponderación acumulada
    total_possible_weight = sum(a.weighting for a in activities) or 100.0
    accumulated_weight = sum(a.weighting for a in activities if a.id in approved_evidences)
    
    completion_percentage = round((accumulated_weight / total_possible_weight) * 100.0, 2)
    enrollment.completion_percentage = min(completion_percentage, 100.0)

    # Evaluar riesgo (Semáforo: ALTO, MEDIO, BAJO)
    now = datetime.now(timezone.utc)
    risk = RiskLevel.BAJO

    # 1. Verificar si hay seguimientos con estado "SIN_RESPUESTA"
    unresponsive_trackings = db.query(TrackingRecord).filter(
        TrackingRecord.enrollment_id == enrollment.id,
        TrackingRecord.case_status == CaseStatus.SIN_RESPUESTA
    ).count()

    # 2. Días de inactividad
    last_act = enrollment.last_activity_at
    if last_act and last_act.tzinfo is None:
        last_act = last_act.replace(tzinfo=timezone.utc)
    days_inactive = (now - last_act).days if last_act else 999

    # 3. Revisión de actividades vencidas o por vencer
    has_overdue_mandatory = False
    has_close_deadline = False

    for act in activities:
        if act.id not in approved_evidences and act.deadline:
            dl = act.deadline
            if dl.tzinfo is None:
                dl = dl.replace(tzinfo=timezone.utc)
            
            diff_days = (dl - now).total_seconds() / 86400.0
            if diff_days < 0 and act.is_mandatory:
                has_overdue_mandatory = True
            elif 0 <= diff_days <= 5 and act.id not in submitted_activity_ids:
                has_close_deadline = True

    # Determinación del semáforo:
    if has_overdue_mandatory or unresponsive_trackings > 0 or (days_inactive >= 7 and completion_percentage < 100.0):
        risk = RiskLevel.ALTO
    elif has_close_deadline or (completion_percentage < 50.0 and days_inactive >= 4):
        risk = RiskLevel.MEDIO
    else:
        risk = RiskLevel.BAJO

    enrollment.risk_level = risk

    # Actualizar estado general
    if completion_percentage >= 100.0:
        enrollment.status = EnrollmentStatus.APROBADO
    elif risk == RiskLevel.ALTO:
        enrollment.status = EnrollmentStatus.EN_RIESGO
    else:
        enrollment.status = EnrollmentStatus.EN_PROCESO

    db.commit()
    db.refresh(enrollment)

    return {
        "completion_percentage": enrollment.completion_percentage,
        "risk_level": enrollment.risk_level,
        "status": enrollment.status
    }


def check_and_send_deadline_alerts(db: Session) -> List[Dict[str, Any]]:
    """
    Revisa todas las inscripciones activas y dispara alertas automáticas si faltan
    exactamente 15, 10, 5, 3 o 1 días para el vencimiento de alguna actividad pendiente.
    """
    now = datetime.now(timezone.utc)
    target_alert_days = [15, 10, 5, 3, 1]
    dispatched_alerts = []

    active_enrollments = db.query(ApplicantEnrollment).filter(
        ApplicantEnrollment.status.in_([EnrollmentStatus.EN_PROCESO, EnrollmentStatus.EN_RIESGO])
    ).all()

    for enrollment in active_enrollments:
        program = enrollment.program
        if not program:
            continue

        courses = db.query(PreparatoryCourse).filter(
            PreparatoryCourse.program_id == program.id,
            PreparatoryCourse.is_active == True
        ).all()
        course_ids = [c.id for c in courses]
        if not course_ids:
            continue

        activities = db.query(Activity).filter(Activity.course_id.in_(course_ids)).all()
        submitted_ids = {e.activity_id for e in enrollment.evidences if e.status == EvidenceStatus.APROBADO}

        for act in activities:
            if act.id not in submitted_ids and act.deadline:
                dl = act.deadline
                if dl.tzinfo is None:
                    dl = dl.replace(tzinfo=timezone.utc)
                
                days_left = int(round((dl - now).total_seconds() / 86400.0))
                if days_left in target_alert_days:
                    # Enviar notificación y registrar
                    notify_deadline_reminder(
                        db=db,
                        enrollment=enrollment,
                        days_left=days_left,
                        activity_title=act.title
                    )
                    dispatched_alerts.append({
                        "enrollment_id": enrollment.id,
                        "applicant_email": enrollment.applicant.email,
                        "activity_title": act.title,
                        "days_left": days_left
                    })

    return dispatched_alerts
