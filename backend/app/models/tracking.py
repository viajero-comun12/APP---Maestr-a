from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base

class ContactType(str, enum.Enum):
    LLAMADA = "LLAMADA"
    CORREO = "CORREO"
    WHATSAPP = "WHATSAPP"
    VIDEOCONFERENCIA = "VIDEOCONFERENCIA"
    PRESENCIAL = "PRESENCIAL"

class CaseStatus(str, enum.Enum):
    EN_SEGUIMIENTO = "EN_SEGUIMIENTO"
    COMPROMISO_PENDIENTE = "COMPROMISO_PENDIENTE"
    RESUELTO = "RESUELTO"
    SIN_RESPUESTA = "SIN_RESPUESTA"
    CERRADO = "CERRADO"

class TrackingRecord(Base):
    __tablename__ = "tracking_records"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String(50), unique=True, index=True, nullable=False)  # ej: TRK-2026-0001
    enrollment_id = Column(Integer, ForeignKey("applicant_enrollments.id", ondelete="CASCADE"), nullable=False)
    tutor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    contact_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    contact_type = Column(Enum(ContactType), nullable=False)
    
    result = Column(Text, nullable=False)  # Resultado del contacto
    commitments = Column(Text, nullable=True)  # Compromisos adquiridos
    observations = Column(Text, nullable=True)  # Observaciones
    recommendations = Column(Text, nullable=True)  # Recomendaciones
    next_action = Column(Text, nullable=True)  # Próxima acción a realizar
    applicant_response = Column(Text, nullable=True)  # Respuesta / postura del postulante
    case_status = Column(Enum(CaseStatus), default=CaseStatus.EN_SEGUIMIENTO, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    enrollment = relationship("ApplicantEnrollment", back_populates="tracking_records")
    tutor = relationship("User", back_populates="tracking_records")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    enrollment_id = Column(Integer, ForeignKey("applicant_enrollments.id", ondelete="SET NULL"), nullable=True)
    
    event_type = Column(String(100), nullable=False)  # REGISTRO, INSCRIPCION, CARGA_EVIDENCIA, REVISION, VENCIMIENTO
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    channel = Column(String(50), default="EMAIL")  # EMAIL, SYSTEM
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    enrollment = relationship("ApplicantEnrollment", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # LOGIN, REGISTRO, INSCRIPCION, CARGA_EVIDENCIA, CALIFICACION, SEGUIMIENTO
    entity_name = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="audit_logs")
