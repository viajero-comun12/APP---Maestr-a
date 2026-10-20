import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.tracking import NotificationLog
from app.models.user import User
from app.models.enrollment import ApplicantEnrollment, Evidence

logger = logging.getLogger(__name__)

def record_and_dispatch_notification(
    db: Session,
    user_id: int,
    recipient_email: str,
    subject: str,
    message: str,
    event_type: str,
    enrollment_id: Optional[int] = None
) -> NotificationLog:
    """Registra la notificación en la base de datos para trazabilidad y la envía si SMTP está activo."""
    log_entry = NotificationLog(
        user_id=user_id,
        enrollment_id=enrollment_id,
        event_type=event_type,
        recipient_email=recipient_email,
        subject=subject,
        message=message,
        channel="EMAIL"
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    # Envío real si SMTP está configurado
    if settings.SMTP_ENABLED and settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            msg = MIMEMultipart()
            msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            msg["To"] = recipient_email
            msg["Subject"] = subject
            msg.attach(MIMEText(message, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"Notificación enviada por email a {recipient_email}: {subject}")
        except Exception as e:
            logger.error(f"Error enviando correo SMTP a {recipient_email}: {str(e)}")
    else:
        logger.info(f"[NOTIFICACIÓN SIMULADA] Para: {recipient_email} | Asunto: {subject} | Evento: {event_type}")

    return log_entry


def notify_registration(db: Session, user: User):
    subject = "¡Bienvenido al Sistema de Gestión de Cursos Preparatorios!"
    message = f"""
    <html>
        <body>
            <h2>Estimado/a {user.full_name},</h2>
            <p>Su cuenta ha sido creada exitosamente con el rol de <strong>{user.role.value}</strong>.</p>
            <p>Ya puede iniciar sesión para consultar su programa asignado y comenzar sus cursos preparatorios.</p>
            <br>
            <p>Atentamente,<br>Coordinación de Programas de Maestría</p>
        </body>
    </html>
    """
    return record_and_dispatch_notification(
        db=db,
        user_id=user.id,
        recipient_email=user.email,
        subject=subject,
        message=message,
        event_type="REGISTRO"
    )


def notify_enrollment(db: Session, enrollment: ApplicantEnrollment):
    user = enrollment.applicant
    program = enrollment.program
    subject = f"Inscripción Confirmada: {program.name}"
    message = f"""
    <html>
        <body>
            <h2>Estimado/a {user.full_name},</h2>
            <p>Se ha formalizado su inscripción al programa de <strong>{program.name}</strong> ({program.call_for_applications}).</p>
            <p>Por favor revise sus cursos preparatorios asignados y las fechas límite de entrega de evidencias y proyectos.</p>
            <br>
            <p>Atentamente,<br>Coordinación de Programas de Maestría</p>
        </body>
    </html>
    """
    return record_and_dispatch_notification(
        db=db,
        user_id=user.id,
        recipient_email=user.email,
        subject=subject,
        message=message,
        event_type="INSCRIPCION",
        enrollment_id=enrollment.id
    )


def notify_evidence_uploaded(db: Session, evidence: Evidence):
    enrollment = evidence.enrollment
    user = enrollment.applicant
    activity = evidence.activity
    subject = f"Evidencia Recibida: {activity.title}"
    message = f"""
    <html>
        <body>
            <h2>Estimado/a {user.full_name},</h2>
            <p>Hemos recibido correctamente su archivo <strong>{evidence.file_name}</strong> para la actividad <strong>{activity.title}</strong>.</p>
            <p>Su entrega se encuentra en estado <strong>PENDIENTE DE REVISIÓN</strong> por parte de su tutor/coordinador.</p>
            <br>
            <p>Atentamente,<br>Sistema de Cursos Preparatorios</p>
        </body>
    </html>
    """
    return record_and_dispatch_notification(
        db=db,
        user_id=user.id,
        recipient_email=user.email,
        subject=subject,
        message=message,
        event_type="CARGA_EVIDENCIA",
        enrollment_id=enrollment.id
    )


def notify_evidence_reviewed(db: Session, evidence: Evidence):
    enrollment = evidence.enrollment
    user = enrollment.applicant
    activity = evidence.activity
    status_text = "APROBADA" if evidence.status.value == "APROBADO" else "RECHAZADA"
    
    subject = f"Resultado de Revisión: {activity.title} ({status_text})"
    message = f"""
    <html>
        <body>
            <h2>Estimado/a {user.full_name},</h2>
            <p>Su evidencia para la actividad <strong>{activity.title}</strong> ha sido evaluada.</p>
            <p><strong>Estado:</strong> {status_text}</p>
            <p><strong>Calificación:</strong> {evidence.score or 'N/A'} / 100</p>
            <p><strong>Observaciones del evaluador:</strong> {evidence.observations or 'Sin observaciones registradas'}</p>
            <br>
            <p>Consulte la plataforma para ver el impacto en su porcentaje de avance y próximos pasos.</p>
            <br>
            <p>Atentamente,<br>Equipo de Tutoría y Coordinación</p>
        </body>
    </html>
    """
    return record_and_dispatch_notification(
        db=db,
        user_id=user.id,
        recipient_email=user.email,
        subject=subject,
        message=message,
        event_type="REVISION_EVIDENCIA",
        enrollment_id=enrollment.id
    )


def notify_deadline_reminder(db: Session, enrollment: ApplicantEnrollment, days_left: int, activity_title: str):
    user = enrollment.applicant
    subject = f"Alerta de Vencimiento: Quedan {days_left} día(s) para {activity_title}"
    message = f"""
    <html>
        <body>
            <h2>Estimado/a {user.full_name},</h2>
            <p>Le recordamos que faltan <strong>{days_left} día(s)</strong> para la fecha límite de entrega de la actividad:</p>
            <p><strong>{activity_title}</strong></p>
            <p>Para evitar retrasos o caer en nivel de riesgo alto, le solicitamos cargar su evidencia a la brevedad.</p>
            <br>
            <p>Atentamente,<br>Sistema de Alertas Tempranas - Cursos Preparatorios</p>
        </body>
    </html>
    """
    return record_and_dispatch_notification(
        db=db,
        user_id=user.id,
        recipient_email=user.email,
        subject=subject,
        message=message,
        event_type="ALERTA_VENCIMIENTO",
        enrollment_id=enrollment.id
    )
