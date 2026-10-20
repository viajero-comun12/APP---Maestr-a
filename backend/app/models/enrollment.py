from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base

class EnrollmentStatus(str, enum.Enum):
    EN_PROCESO = "EN_PROCESO"
    APROBADO = "APROBADO"
    EN_RIESGO = "EN_RIESGO"
    REPROBADO = "REPROBADO"

class RiskLevel(str, enum.Enum):
    BAJO = "BAJO"       # Verde: Cumplimiento adecuado dentro de plazos
    MEDIO = "MEDIO"     # Amarillo: Pendientes próximos o avance lento
    ALTO = "ALTO"       # Rojo: Sin actividad prolongada, plazos vencidos o evidencias rechazadas

class EvidenceStatus(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    APROBADO = "APROBADO"
    RECHAZADO = "RECHAZADO"

class ApplicantEnrollment(Base):
    __tablename__ = "applicant_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    program_id = Column(Integer, ForeignKey("master_programs.id", ondelete="CASCADE"), nullable=False)
    assigned_tutor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    enrollment_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.EN_PROCESO, nullable=False, index=True)
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.BAJO, nullable=False, index=True)
    completion_percentage = Column(Float, default=0.0)  # % de ponderación acumulada aprobada
    final_score = Column(Float, default=0.0)
    last_activity_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    applicant = relationship("User", back_populates="enrollments", foreign_keys=[applicant_id])
    tutor = relationship("User", back_populates="assigned_enrollments", foreign_keys=[assigned_tutor_id])
    program = relationship("MasterProgram", back_populates="enrollments")
    evidences = relationship("Evidence", back_populates="enrollment", cascade="all, delete-orphan")
    tracking_records = relationship("TrackingRecord", back_populates="enrollment", cascade="all, delete-orphan")
    notifications = relationship("NotificationLog", back_populates="enrollment", cascade="all, delete-orphan")


class Evidence(Base):
    __tablename__ = "evidences"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("applicant_enrollments.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    
    file_url = Column(String(500), nullable=False)  # S3 URL/key o ruta local
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)  # en bytes
    upload_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    status = Column(Enum(EvidenceStatus), default=EvidenceStatus.PENDIENTE, nullable=False, index=True)
    score = Column(Float, nullable=True)  # Calificación obtenida (0 - 100)
    observations = Column(Text, nullable=True)  # Observaciones del tutor/coordinador
    
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # Relaciones
    enrollment = relationship("ApplicantEnrollment", back_populates="evidences")
    activity = relationship("Activity", back_populates="evidences")
    reviewer = relationship("User", back_populates="reviewed_evidences", foreign_keys=[reviewed_by_id])
