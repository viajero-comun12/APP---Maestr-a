from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, RoleChecker, record_audit
from app.models.user import User, UserRole
from app.models.enrollment import ApplicantEnrollment
from app.services.reports import (
    generate_applicant_pdf_report,
    generate_consolidated_matrix_excel,
    generate_traceability_excel
)

router = APIRouter()

@router.get("/applicant/{enrollment_id}/pdf", summary="Descargar Reporte Individual del Postulante en PDF")
def download_applicant_pdf(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    enrollment = db.query(ApplicantEnrollment).filter(ApplicantEnrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inscripción no encontrada")

    # Si es postulante, solo puede descargar su propio reporte
    if current_user.role == UserRole.POSTULANTE and enrollment.applicant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para descargar este reporte")

    pdf_buffer = generate_applicant_pdf_report(db, enrollment_id)
    
    import unicodedata
    clean_name = unicodedata.normalize('NFKD', enrollment.applicant.full_name).encode('ascii', 'ignore').decode('ascii').replace(" ", "_")
    filename = f"Reporte_Postulante_{clean_name}_{enrollment.id}.pdf"

    record_audit(
        db,
        user_id=current_user.id,
        action="EXPORTAR_REPORTE_PDF",
        entity_name="ApplicantEnrollment",
        entity_id=str(enrollment_id),
        details=f"Descarga de reporte individual PDF: {filename}"
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/consolidated-matrix/excel", summary="Descargar Matriz Consolidada de Seguimiento en Excel (.xlsx)")
def download_consolidated_matrix_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR, UserRole.TUTOR]))
):
    excel_buffer = generate_consolidated_matrix_excel(db)
    filename = "Matriz_Consolidada_Seguimiento.xlsx"

    record_audit(
        db,
        user_id=current_user.id,
        action="EXPORTAR_MATRIZ_EXCEL",
        entity_name="ApplicantEnrollment",
        details="Descarga de matriz consolidada de seguimiento"
    )

    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/traceability/excel", summary="Descargar Informe de Trazabilidad en Excel (.xlsx)")
def download_traceability_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR]))
):
    excel_buffer = generate_traceability_excel(db)
    filename = "Informe_Trazabilidad_Acciones.xlsx"

    record_audit(
        db,
        user_id=current_user.id,
        action="EXPORTAR_TRAZABILIDAD_EXCEL",
        entity_name="TrackingRecord",
        details="Descarga de informe completo de trazabilidad"
    )

    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
