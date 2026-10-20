from datetime import datetime, timezone
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response, StreamingResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, RoleChecker, record_audit
from app.models.user import User, UserRole
from app.models.program import Activity
from app.models.enrollment import ApplicantEnrollment, Evidence, EvidenceStatus
from app.schemas.enrollment import EvidenceOut, EvidenceReview
from app.services.storage import get_storage_service
from app.services.notification import notify_evidence_uploaded, notify_evidence_reviewed
from app.services.alerts import recalculate_enrollment_progress
from app.core.config import settings

router = APIRouter()

@router.post("/upload", response_model=EvidenceOut, status_code=status.HTTP_201_CREATED, summary="Cargar evidencia de actividad (Certificado PDF, Proyecto)")
async def upload_evidence(
    enrollment_id: int = Form(...),
    activity_id: int = Form(...),
    observations: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    enrollment = db.query(ApplicantEnrollment).filter(ApplicantEnrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inscripción no encontrada")

    # Si es postulante, solo puede subir a su propia inscripción
    if current_user.role == UserRole.POSTULANTE and enrollment.applicant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para subir evidencias en esta inscripción")

    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Actividad no encontrada")

    # Leer contenido del archivo
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo subido está vacío")

    # Almacenar en servicio (Local o AWS S3 según variables de entorno)
    storage = get_storage_service()
    saved_meta = storage.save_file(file_bytes, file.filename)

    # Verificar si ya existía una evidencia para esta actividad
    existing_evidence = db.query(Evidence).filter(
        Evidence.enrollment_id == enrollment.id,
        Evidence.activity_id == activity.id
    ).first()

    now = datetime.now(timezone.utc)

    if existing_evidence:
        existing_evidence.file_url = saved_meta["file_url"]
        existing_evidence.file_name = saved_meta["file_name"]
        existing_evidence.file_size = saved_meta["file_size"]
        existing_evidence.upload_date = now
        existing_evidence.status = EvidenceStatus.PENDIENTE
        existing_evidence.observations = observations
        evidence = existing_evidence
    else:
        evidence = Evidence(
            enrollment_id=enrollment.id,
            activity_id=activity.id,
            file_url=saved_meta["file_url"],
            file_name=saved_meta["file_name"],
            file_size=saved_meta["file_size"],
            upload_date=now,
            status=EvidenceStatus.PENDIENTE,
            observations=observations
        )
        db.add(evidence)

    # Actualizar última actividad del postulante
    enrollment.last_activity_at = now
    db.commit()
    db.refresh(evidence)

    # Notificación automática
    notify_evidence_uploaded(db, evidence)

    # Recalcular semáforo y progreso
    recalculate_enrollment_progress(db, enrollment)

    record_audit(db, user_id=current_user.id, action="CARGA_EVIDENCIA", entity_name="Evidence", entity_id=str(evidence.id), details=f"Archivo {evidence.file_name} subido para actividad {activity.title}")

    return EvidenceOut(
        id=evidence.id,
        enrollment_id=evidence.enrollment_id,
        activity_id=evidence.activity_id,
        activity_title=activity.title,
        file_url=evidence.file_url,
        file_name=evidence.file_name,
        file_size=evidence.file_size,
        upload_date=evidence.upload_date,
        status=evidence.status,
        score=evidence.score,
        observations=evidence.observations,
        reviewed_by_id=evidence.reviewed_by_id,
        reviewed_at=evidence.reviewed_at
    )


@router.get("/enrollment/{enrollment_id}", response_model=List[EvidenceOut], summary="Listar evidencias de una inscripción")
def list_evidences_for_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    enrollment = db.query(ApplicantEnrollment).filter(ApplicantEnrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inscripción no encontrada")

    if current_user.role == UserRole.POSTULANTE and enrollment.applicant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")

    evidences = db.query(Evidence).filter(Evidence.enrollment_id == enrollment_id).all()
    return [
        EvidenceOut(
            id=ev.id,
            enrollment_id=ev.enrollment_id,
            activity_id=ev.activity_id,
            activity_title=ev.activity.title if ev.activity else None,
            file_url=ev.file_url,
            file_name=ev.file_name,
            file_size=ev.file_size,
            upload_date=ev.upload_date,
            status=ev.status,
            score=ev.score,
            observations=ev.observations,
            reviewed_by_id=ev.reviewed_by_id,
            reviewed_at=ev.reviewed_at
        ) for ev in evidences
    ]


@router.put("/{evidence_id}/review", response_model=EvidenceOut, summary="Revisar y calificar evidencia (Aprobar o Rechazar)")
def review_evidence(
    evidence_id: int,
    review_in: EvidenceReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR, UserRole.TUTOR]))
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidencia no encontrada")

    evidence.status = review_in.status
    if review_in.score is not None:
        evidence.score = review_in.score
    if review_in.observations is not None:
        evidence.observations = review_in.observations
    
    evidence.reviewed_by_id = current_user.id
    evidence.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(evidence)

    # Disparar notificación automática de resultado
    notify_evidence_reviewed(db, evidence)

    # Recalcular semáforo y porcentaje del postulante
    recalculate_enrollment_progress(db, evidence.enrollment)

    record_audit(db, user_id=current_user.id, action="CALIFICAR_EVIDENCIA", entity_name="Evidence", entity_id=str(evidence.id), details=f"Evidencia {evidence.file_name} evaluada como {evidence.status.value}")

    return EvidenceOut(
        id=evidence.id,
        enrollment_id=evidence.enrollment_id,
        activity_id=evidence.activity_id,
        activity_title=evidence.activity.title if evidence.activity else None,
        file_url=evidence.file_url,
        file_name=evidence.file_name,
        file_size=evidence.file_size,
        upload_date=evidence.upload_date,
        status=evidence.status,
        score=evidence.score,
        observations=evidence.observations,
        reviewed_by_id=evidence.reviewed_by_id,
        reviewed_at=evidence.reviewed_at
    )


@router.get("/download/{file_key:path}", summary="Descargar archivo de evidencia almacenado")
def download_evidence_file(
    file_key: str,
    db: Session = Depends(get_db)
):
    storage = get_storage_service()
    
    # Si estamos en modo S3, redirigir a presigned URL
    if settings.STORAGE_BACKEND.lower() == "s3" and settings.AWS_S3_BUCKET_NAME and settings.AWS_ACCESS_KEY_ID:
        try:
            url = storage.get_download_url(file_key)
            return RedirectResponse(url=url)
        except Exception:
            pass

    # Modo almacenamiento local
    try:
        content = storage.read_file(file_key)
        return Response(
            content=content,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={file_key.split('_', 1)[-1]}"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo físico no encontrado en el almacenamiento")
