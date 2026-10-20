from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, RoleChecker
from app.models.user import User, UserRole
from app.models.tracking import NotificationLog
from app.schemas.tracking import NotificationLogOut
from app.services.alerts import check_and_send_deadline_alerts

router = APIRouter()

@router.post("/check-deadlines", summary="Ejecutar verificación de alertas por vencimiento (15, 10, 5, 3, 1 días)")
def trigger_deadline_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR]))
):
    """
    Evalúa las fechas límite de actividades pendientes de todos los postulantes
    y genera alertas automáticas registradas en la bitácora si coincide con 15, 10, 5, 3 o 1 días.
    """
    dispatched = check_and_send_deadline_alerts(db)
    return {
        "message": f"Verificación completada. {len(dispatched)} alertas generadas.",
        "alerts": dispatched
    }


@router.get("/notifications", response_model=List[NotificationLogOut], summary="Consultar registro de notificaciones enviadas")
def list_notification_logs(
    user_id: Optional[int] = Query(None, description="Filtrar por usuario destinatario"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR]))
):
    query = db.query(NotificationLog)
    if user_id:
        query = query.filter(NotificationLog.user_id == user_id)
    return query.order_by(NotificationLog.sent_at.desc()).limit(limit).all()
