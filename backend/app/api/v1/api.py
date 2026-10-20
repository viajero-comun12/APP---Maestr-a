from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    programs,
    enrollments,
    evidences,
    tracking,
    dashboard,
    reports,
    alerts
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(users.router, prefix="/users", tags=["Gestión de Usuarios"])
api_router.include_router(programs.router, prefix="/programs", tags=["Programas, Cursos y Actividades"])
api_router.include_router(enrollments.router, prefix="/enrollments", tags=["Inscripciones y Avance"])
api_router.include_router(evidences.router, prefix="/evidences", tags=["Carga y Evaluación de Evidencias"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["Seguimiento de Tutores y Trazabilidad"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard Ejecutivo"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reportes (PDF y Excel)"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alertas y Notificaciones"])
