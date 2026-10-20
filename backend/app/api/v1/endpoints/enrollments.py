from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, RoleChecker, record_audit
from app.models.user import User, UserRole
from app.models.program import MasterProgram, PreparatoryCourse, Activity
from app.models.enrollment import ApplicantEnrollment, EnrollmentStatus, RiskLevel, EvidenceStatus
from app.schemas.enrollment import (
    EnrollmentCreate, EnrollmentAssignTutor, EnrollmentOut, ApplicantProgressOut, EvidenceOut
)
from app.services.notification import notify_enrollment
from app.services.alerts import recalculate_enrollment_progress

router = APIRouter()

def build_enrollment_out(enr: ApplicantEnrollment) -> dict:
    return {
        "id": enr.id,
        "applicant_id": enr.applicant_id,
        "applicant_name": enr.applicant.full_name if enr.applicant else None,
        "applicant_email": enr.applicant.email if enr.applicant else None,
        "program_id": enr.program_id,
        "program_name": enr.program.name if enr.program else None,
        "program_call": enr.program.call_for_applications if enr.program else None,
        "assigned_tutor_id": enr.assigned_tutor_id,
        "tutor_name": enr.tutor.full_name if enr.tutor else None,
        "enrollment_date": enr.enrollment_date,
        "status": enr.status,
        "risk_level": enr.risk_level,
        "completion_percentage": enr.completion_percentage,
        "last_activity_at": enr.last_activity_at,
        "evidences": [
            {
                "id": ev.id,
                "enrollment_id": ev.enrollment_id,
                "activity_id": ev.activity_id,
                "activity_title": ev.activity.title if ev.activity else None,
                "file_url": ev.file_url,
                "file_name": ev.file_name,
                "file_size": ev.file_size,
                "upload_date": ev.upload_date,
                "status": ev.status,
                "score": ev.score,
                "observations": ev.observations,
                "reviewed_by_id": ev.reviewed_by_id,
                "reviewed_at": ev.reviewed_at
            } for ev in enr.evidences
        ]
    }

@router.post("/", response_model=EnrollmentOut, status_code=status.HTTP_201_CREATED, summary="Inscribir postulante a un programa de maestría")
def enroll_in_program(
    enrollment_in: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    program = db.query(MasterProgram).filter(MasterProgram.id == enrollment_in.program_id, MasterProgram.is_active == True).first()
    if not program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Programa de maestría no encontrado o inactivo")

    # Verificar si ya está inscrito
    existing = db.query(ApplicantEnrollment).filter(
        ApplicantEnrollment.applicant_id == current_user.id,
        ApplicantEnrollment.program_id == enrollment_in.program_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El postulante ya se encuentra inscrito en este programa")

    enrollment = ApplicantEnrollment(
        applicant_id=current_user.id,
        program_id=program.id,
        status=EnrollmentStatus.EN_PROCESO,
        risk_level=RiskLevel.BAJO,
        completion_percentage=0.0
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    # Disparar notificación automática de inscripción
    notify_enrollment(db, enrollment)

    # Recalcular progreso inicial
    recalculate_enrollment_progress(db, enrollment)

    record_audit(db, user_id=current_user.id, action="INSCRIPCION_PROGRAMA", entity_name="ApplicantEnrollment", entity_id=str(enrollment.id), details=f"Inscripción en {program.name}")

    return build_enrollment_out(enrollment)


@router.get("/me", response_model=List[ApplicantProgressOut], summary="Consultar estado de avance del postulante autenticado")
def get_my_enrollments_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    enrollments = db.query(ApplicantEnrollment).filter(ApplicantEnrollment.applicant_id == current_user.id).all()
    results = []

    now = datetime.now(timezone.utc)
    for enr in enrollments:
        # Asegurar cálculo actualizado
        recalculate_enrollment_progress(db, enr)

        program = enr.program
        courses = db.query(PreparatoryCourse).filter(PreparatoryCourse.program_id == program.id).all()
        course_ids = [c.id for c in courses]
        activities = db.query(Activity).filter(Activity.course_id.in_(course_ids)).all() if course_ids else []

        approved_act_ids = {e.activity_id for e in enr.evidences if e.status == EvidenceStatus.APROBADO}
        total_acts = len(activities)
        completed_acts = len([a for a in activities if a.id in approved_act_ids])
        pending_acts = total_acts - completed_acts

        days_remaining = (program.end_date - now.date()).days if program and program.end_date else 0
        if days_remaining < 0:
            days_remaining = 0

        results.append(ApplicantProgressOut(
            enrollment_id=enr.id,
            program_name=program.name,
            completion_percentage=enr.completion_percentage,
            status=enr.status,
            risk_level=enr.risk_level,
            total_activities=total_acts,
            completed_activities=completed_acts,
            pending_activities=pending_acts,
            days_remaining=days_remaining,
            assigned_tutor=enr.tutor.full_name if enr.tutor else "Tutor aún no asignado"
        ))

    return results


@router.get("/", response_model=List[EnrollmentOut], summary="Listar todas las inscripciones (Coordinadores, Tutores y Admin)")
def list_enrollments(
    program_id: Optional[int] = Query(None, description="Filtrar por programa"),
    status: Optional[EnrollmentStatus] = Query(None, description="Filtrar por estado del postulante"),
    risk_level: Optional[RiskLevel] = Query(None, description="Filtrar por nivel de riesgo / semáforo"),
    tutor_id: Optional[int] = Query(None, description="Filtrar por tutor asignado"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR, UserRole.TUTOR]))
):
    query = db.query(ApplicantEnrollment)

    # Si es Tutor, restringir por defecto a sus propios postulantes asignados (a menos que consulte coordinador/admin)
    if current_user.role == UserRole.TUTOR:
        query = query.filter(ApplicantEnrollment.assigned_tutor_id == current_user.id)
    elif tutor_id:
        query = query.filter(ApplicantEnrollment.assigned_tutor_id == tutor_id)

    if program_id:
        query = query.filter(ApplicantEnrollment.program_id == program_id)
    if status:
        query = query.filter(ApplicantEnrollment.status == status)
    if risk_level:
        query = query.filter(ApplicantEnrollment.risk_level == risk_level)

    enrollments = query.order_by(ApplicantEnrollment.id.desc()).all()
    return [build_enrollment_out(enr) for enr in enrollments]


@router.get("/{enrollment_id}", response_model=EnrollmentOut, summary="Obtener detalle de una inscripción")
def get_enrollment_by_id(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    enr = db.query(ApplicantEnrollment).filter(ApplicantEnrollment.id == enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inscripción no encontrada")

    # Validar que si es postulante solo vea su propia inscripción
    if current_user.role == UserRole.POSTULANTE and enr.applicant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado a esta inscripción")

    recalculate_enrollment_progress(db, enr)
    return build_enrollment_out(enr)


@router.put("/{enrollment_id}/assign-tutor", response_model=EnrollmentOut, summary="Asignar o reasignar un tutor al postulante")
def assign_tutor_to_applicant(
    enrollment_id: int,
    assign_in: EnrollmentAssignTutor,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR]))
):
    enr = db.query(ApplicantEnrollment).filter(ApplicantEnrollment.id == enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inscripción no encontrada")

    tutor = db.query(User).filter(User.id == assign_in.tutor_id, User.role == UserRole.TUTOR, User.is_active == True).first()
    if not tutor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor no encontrado o no tiene el rol correspondiente")

    enr.assigned_tutor_id = tutor.id
    db.commit()
    db.refresh(enr)

    record_audit(db, user_id=current_user.id, action="ASIGNAR_TUTOR", entity_name="ApplicantEnrollment", entity_id=str(enr.id), details=f"Tutor {tutor.full_name} asignado a {enr.applicant.full_name}")

    return build_enrollment_out(enr)
