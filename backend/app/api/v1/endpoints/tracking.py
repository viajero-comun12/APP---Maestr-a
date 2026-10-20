from datetime import datetime, timezone
import random
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, RoleChecker, record_audit
from app.models.user import User, UserRole
from app.models.enrollment import ApplicantEnrollment, Evidence
from app.models.tracking import TrackingRecord, ContactType, CaseStatus, NotificationLog, AuditLog
from app.schemas.tracking import TrackingRecordCreate, TrackingRecordOut, NotificationLogOut
from app.services.alerts import recalculate_enrollment_progress

router = APIRouter()

def build_tracking_out(tr: TrackingRecord) -> dict:
    return {
        "id": tr.id,
        "tracking_number": tr.tracking_number,
        "enrollment_id": tr.enrollment_id,
        "tutor_id": tr.tutor_id,
        "tutor_name": tr.tutor.full_name if tr.tutor else None,
        "applicant_name": tr.enrollment.applicant.full_name if tr.enrollment and tr.enrollment.applicant else None,
        "contact_date": tr.contact_date,
        "contact_type": tr.contact_type,
        "result": tr.result,
        "commitments": tr.commitments,
        "observations": tr.observations,
        "recommendations": tr.recommendations,
        "next_action": tr.next_action,
        "applicant_response": tr.applicant_response,
        "case_status": tr.case_status,
        "created_at": tr.created_at
    }

@router.post("/", response_model=TrackingRecordOut, status_code=status.HTTP_201_CREATED, summary="Registrar acción de seguimiento por parte del tutor")
def create_tracking_record(
    record_in: TrackingRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR, UserRole.TUTOR]))
):
    enrollment = db.query(ApplicantEnrollment).filter(ApplicantEnrollment.id == record_in.enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inscripción de postulante no encontrada")

    # Generar correlativo único de seguimiento: TRK-YYYY-XXXX
    year = datetime.now().year
    count = db.query(TrackingRecord).count() + 1
    tracking_number = f"TRK-{year}-{count:04d}"

    contact_dt = record_in.contact_date or datetime.now(timezone.utc)

    tracking = TrackingRecord(
        tracking_number=tracking_number,
        enrollment_id=enrollment.id,
        tutor_id=current_user.id,
        contact_date=contact_dt,
        contact_type=record_in.contact_type,
        result=record_in.result.strip(),
        commitments=record_in.commitments,
        observations=record_in.observations,
        recommendations=record_in.recommendations,
        next_action=record_in.next_action,
        applicant_response=record_in.applicant_response,
        case_status=record_in.case_status
    )
    db.add(tracking)
    
    # Actualizar última actividad del postulante si hubo interacción directa
    enrollment.last_activity_at = contact_dt
    db.commit()
    db.refresh(tracking)

    # Actualizar semáforo de riesgo (por ejemplo si fue 'SIN_RESPUESTA' o si se resolvió compromiso)
    recalculate_enrollment_progress(db, enrollment)

    record_audit(
        db,
        user_id=current_user.id,
        action="REGISTRO_SEGUIMIENTO",
        entity_name="TrackingRecord",
        entity_id=str(tracking.id),
        details=f"Seguimiento {tracking.tracking_number} vía {tracking.contact_type.value} a {enrollment.applicant.full_name}"
    )

    return build_tracking_out(tracking)


@router.get("/enrollment/{enrollment_id}", response_model=List[TrackingRecordOut], summary="Listar seguimientos de un postulante")
def list_trackings_for_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR, UserRole.TUTOR]))
):
    records = db.query(TrackingRecord).filter(
        TrackingRecord.enrollment_id == enrollment_id
    ).order_by(TrackingRecord.contact_date.desc()).all()
    return [build_tracking_out(r) for r in records]


@router.get("/timeline/{enrollment_id}", summary="Línea de tiempo cronológica completa de trazabilidad")
def get_applicant_traceability_timeline(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> List[Dict[str, Any]]:
    """
    Consolida cronológicamente todos los eventos del postulante:
    - Inscripción al programa.
    - Entregas de evidencias realizadas.
    - Revisiones y calificaciones efectuadas.
    - Gestiones de seguimiento y contactos del tutor.
    - Notificaciones enviadas.
    """
    enrollment = db.query(ApplicantEnrollment).filter(ApplicantEnrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inscripción no encontrada")

    if current_user.role == UserRole.POSTULANTE and enrollment.applicant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")

    timeline = []

    # 1. Evento de inscripción
    timeline.append({
        "timestamp": enrollment.enrollment_date,
        "type": "INSCRIPCION",
        "title": "Inscripción al Programa",
        "description": f"Postulante inscrito en {enrollment.program.name}",
        "actor": enrollment.applicant.full_name
    })

    # 2. Entregas de evidencia
    for ev in enrollment.evidences:
        timeline.append({
            "timestamp": ev.upload_date,
            "type": "CARGA_EVIDENCIA",
            "title": f"Carga de Evidencia: {ev.activity.title if ev.activity else 'Actividad'}",
            "description": f"Archivo: {ev.file_name} ({ev.status.value})",
            "actor": enrollment.applicant.full_name
        })
        if ev.reviewed_at:
            timeline.append({
                "timestamp": ev.reviewed_at,
                "type": "REVISION_EVIDENCIA",
                "title": f"Evaluación de Evidencia: {ev.activity.title if ev.activity else 'Actividad'}",
                "description": f"Calificación: {ev.score or 'N/A'}/100. Obs: {ev.observations or 'Sin observaciones'}",
                "actor": ev.reviewer.full_name if ev.reviewer else "Coordinación"
            })

    # 3. Seguimientos del tutor
    for tr in enrollment.tracking_records:
        timeline.append({
            "timestamp": tr.contact_date,
            "type": "SEGUIMIENTO_TUTOR",
            "title": f"Contacto ({tr.contact_type.value}) - {tr.tracking_number}",
            "description": f"Resultado: {tr.result} | Próxima acción: {tr.next_action or 'N/A'}",
            "actor": tr.tutor.full_name if tr.tutor else "Tutor"
        })

    # 4. Notificaciones automáticas enviadas
    for notif in enrollment.notifications:
        timeline.append({
            "timestamp": notif.sent_at,
            "type": "NOTIFICACION",
            "title": f"Correo: {notif.subject}",
            "description": f"Evento disparador: {notif.event_type}",
            "actor": "Sistema Automático"
        })

    # Ordenar cronológicamente descendente
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    return timeline
